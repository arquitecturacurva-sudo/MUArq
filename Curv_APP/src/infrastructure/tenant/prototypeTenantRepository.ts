import type { TenantRepository } from "../../domain/tenant/tenantRepository";
import { getMemberMutationError } from "../../domain/tenant/authorization";
import { validateInviteMember, validateRoleScope, type TenantAccessErrorCode, type TenantAccessResult, type TenantMembership, type TenantSummary, type TenantUsage } from "../../domain/tenant/teamAccess";

export interface PrototypeProject { id: string; tenantId: string; name: string }
export interface PrototypeTenantSeed {
  tenant: TenantSummary;
  members: TenantMembership[];
  projects: PrototypeProject[];
  limits: { editors: number; viewers: number };
}
const ok = <T>(value: T): TenantAccessResult<T> => ({ ok: true, value });
const fail = <T>(code: TenantAccessErrorCode, message: string, field?: "email" | "role" | "projects"): TenantAccessResult<T> =>
  ({ ok: false, error: { code, message, field } });

// Local simulation ONLY. Never imported by the production entry point.
// No Firebase, network, email, localStorage or success masquerading as delivery.
export function createPrototypeTenantRepository(seed: readonly PrototypeTenantSeed[], options: { actorUid: string; latencyMs?: number }) {
  let records = structuredClone([...seed]);
  let actorUid = options.actorUid;
  let session = 0;
  let revision = 0;
  let nextFailure: "unavailable" | "conflict" | null = null;
  let undo: { before: PrototypeTenantSeed[]; tenantId: string; actorUid: string; revision: number } | null = null;
  const delay = () => new Promise<void>(resolve => setTimeout(resolve, options.latencyMs ?? 250));
  const find = (id: string) => records.find(record => record.tenant.id === id);
  const activeActor = (record: PrototypeTenantSeed) => record.members.find(member => member.uid === actorUid && member.status === "active");
  const usage = (record: PrototypeTenantSeed): TenantUsage => ({
    tenantId: record.tenant.id,
    editors: { used: record.members.filter(m => m.status !== "revoked" && m.role !== "viewer").length, limit: record.limits.editors },
    viewers: { used: record.members.filter(m => m.status !== "revoked" && m.role === "viewer").length, limit: record.limits.viewers },
  });
  const scopeError = (record: PrototypeTenantSeed, scope: TenantMembership["accessScope"]) =>
    scope.kind === "projects" && scope.projectIds.some(id => !record.projects.some(project => project.id === id));
  const capacityError = (record: PrototypeTenantSeed) => {
    const seats = usage(record);
    return seats.editors.used > seats.editors.limit || seats.viewers.used > seats.viewers.limit;
  };
  async function mutate<T>(tenantId: string, operation: (record: PrototypeTenantSeed, actor: TenantMembership) => TenantAccessResult<T>): Promise<TenantAccessResult<T>> {
    const requestedSession = session;
    await delay();
    if (requestedSession !== session) return fail("conflict", "La vista cambio. Revisa el estudio e intentalo de nuevo.");
    const record = find(tenantId);
    if (!record) return fail("not-found", "No encontramos este estudio.");
    const actor = activeActor(record);
    if (!actor || actor.role !== "admin") return fail("permission-denied", "Solo un administrador activo puede gestionar el equipo.");
    if (nextFailure) {
      const code = nextFailure;
      nextFailure = null;
      return fail(code, code === "conflict" ? "El equipo cambio. Actualizamos los datos; revisa e intenta de nuevo." : "No pudimos guardar el cambio. Tus datos siguen aqui. Intenta de nuevo.");
    }
    const before = structuredClone(records);
    const result = operation(record, actor);
    if (!result.ok) { records = before; return result; }
    if (capacityError(record)) { records = before; return fail("seat-limit", "No quedan plazas para este rol. Retira un acceso o elige otro rol."); }
    revision++;
    undo = { before, tenantId, actorUid, revision };
    return structuredClone(result);
  }
  const repository: TenantRepository = {
    async listUserTenants(uid) {
      await delay();
      if (uid !== actorUid) return fail("permission-denied", "La sesion de prueba cambio.");
      return ok(structuredClone(records.filter(record => activeActor(record)).map(record => record.tenant)));
    },
    async listMembers(tenantId) {
      await delay();
      const record = find(tenantId);
      const actor = record && activeActor(record);
      if (!record || !actor) return fail("permission-denied", "No tienes acceso a este estudio.");
      return ok(structuredClone(record.members.filter(member => member.status !== "revoked" && (actor.role !== "viewer" || member.uid === actorUid))));
    },
    async getSeatUsage(tenantId) {
      await delay();
      const record = find(tenantId);
      if (!record || !activeActor(record)) return fail("permission-denied", "No tienes acceso a este estudio.");
      return ok(usage(record));
    },
    inviteMember(input) {
      return mutate(input.tenantId, record => {
        const valid = validateInviteMember(input);
        if (!valid.ok) return valid;
        if (scopeError(record, input.accessScope)) return fail("tenant-mismatch", "Selecciona proyectos de este estudio.", "projects");
        const email = input.email.trim().toLowerCase();
        if (record.members.some(member => member.status !== "revoked" && member.email.toLowerCase() === email)) {
          return fail("conflict", "Esta persona ya pertenece al equipo o tiene una invitacion pendiente.", "email");
        }
        record.members.push({ tenantId: input.tenantId, uid: "demo-invite-" + (revision + 1), email,
          displayName: "", role: input.role, status: "invited", isOwner: false, accessScope: structuredClone(input.accessScope) });
        return ok(undefined);
      });
    },
    changeMemberRole(input) {
      return mutate(input.tenantId, (record, actor) => {
        const target = record.members.find(m => m.uid === input.targetUid && m.status !== "revoked");
        if (!target) return fail("not-found", "Este acceso ya no esta disponible.");
        const error = getMemberMutationError(actor, target, { tenantId: record.tenant.id, ownerUid: record.tenant.ownerUid, members: record.members })
          ?? validateRoleScope(input.nextRole, input.accessScope);
        if (error) return { ok: false, error };
        if (scopeError(record, input.accessScope)) return fail("tenant-mismatch", "Selecciona proyectos de este estudio.", "projects");
        target.role = input.nextRole;
        target.accessScope = structuredClone(input.accessScope);
        return ok(target);
      });
    },
    revokeMemberAccess(input) {
      return mutate(input.tenantId, (record, actor) => {
        const target = record.members.find(m => m.uid === input.targetUid && m.status !== "revoked");
        if (!target) return fail("not-found", "Este acceso ya fue retirado.");
        const error = getMemberMutationError(actor, target, { tenantId: record.tenant.id, ownerUid: record.tenant.ownerUid, members: record.members });
        if (error) return { ok: false, error };
        target.status = "revoked";
        return ok(undefined);
      });
    },
  };
  return {
    repository,
    projects: structuredClone(seed.flatMap(record => record.projects)),
    setActor(uid: string) { actorUid = uid; session++; undo = null; },
    failNextWrite(code: "unavailable" | "conflict") { nextFailure = code; },
    reset() { records = structuredClone([...seed]); revision++; session++; undo = null; nextFailure = null; },
    async undoLastChange(tenantId: string): Promise<TenantAccessResult<void>> {
      const requestedSession = session;
      await delay();
      if (!undo || requestedSession !== session || undo.actorUid !== actorUid || undo.tenantId !== tenantId || undo.revision !== revision) {
        return fail("conflict", "Este cambio ya no puede deshacerse. Revisa el estado actual.");
      }
      // Safe local rollback: only the exact last revision by the same demo actor.
      records = undo.before;
      undo = null;
      revision++;
      return ok(undefined);
    },
  };
}
