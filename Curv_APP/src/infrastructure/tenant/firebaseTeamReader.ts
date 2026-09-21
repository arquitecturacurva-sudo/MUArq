import { firebaseInvitations } from "./firebaseInvitations";
import { FirebaseError } from "firebase/app";
import { collection, doc, getDoc, getDocs, type Firestore } from "firebase/firestore";
import type { TenantRepository } from "../../domain/tenant/tenantRepository";
import type { TenantAccessResult, TenantMembership, TenantSummary } from "../../domain/tenant/teamAccess";
import { mapTenantMembership } from "../firebase/tenantMembershipMapper";
import { unimplementedTenantRepository } from "./unimplementedTenantRepository";

const invalid = <T>(): TenantAccessResult<T> => ({ ok: false, error: { code: "invalid-response", message: "El estudio tiene datos incompletos. Contacta con soporte." } });
async function read<T>(operation: () => Promise<TenantAccessResult<T>>): Promise<TenantAccessResult<T>> {
  try { return await operation(); } catch (error) {
    if (!(error instanceof FirebaseError)) throw error;
    return { ok: false, error: { code: error.code === "permission-denied" ? "permission-denied" : "unavailable",
      message: error.code === "permission-denied" ? "Tu cuenta no tiene permiso para consultar este equipo." : "No pudimos leer el equipo. Reintenta cuando tengas conexion." } };
  }
}
// This adapter is scoped to the authenticated app's active tenant. It never writes.
export function createFirebaseTeamReader(db: Firestore, uid: string, activeTenantId: string): TenantRepository {
  const scoped = (id: string) => Boolean(uid && id && id === activeTenantId);
  const denied = <T>(): TenantAccessResult<T> => ({ ok: false, error: { code: "tenant-mismatch", message: "El estudio activo cambio. Vuelve a abrir Equipo y acceso." } });
  async function summary(): Promise<TenantAccessResult<TenantSummary>> {
    const membership = await getDoc(doc(db, "clients", activeTenantId, "members", uid));
    const actor = membership.data();
    if (!membership.exists() || !actor || !["owner", "admin", "editor"].includes(actor.role) || (actor.status !== undefined && actor.status !== "active")) {
      return { ok: false, error: { code: "permission-denied", message: "La consulta del equipo requiere una membresia activa de administrador o editor." } };
    }
    const snapshot = await getDoc(doc(db, "clients", activeTenantId));
    if (!snapshot.exists()) return { ok: false, error: { code: "not-found", message: "No encontramos el estudio activo." } };
    const data = snapshot.data();
    if (typeof data.name !== "string" || typeof data.ownerUid !== "string" || !data.ownerUid) return invalid();
    return { ok: true, value: { id: snapshot.id, name: data.name, ownerUid: data.ownerUid } };
  }
  const listMembers: TenantRepository["listMembers"] = id => read(async () => {
    if (!scoped(id)) return denied();
    const tenant = await summary(); if (!tenant.ok) return tenant;
    const documents = await getDocs(collection(db, "clients", id, "members"));
    const members: TenantMembership[] = [];
    for (const item of documents.docs) {
      const raw = item.data();
      const member = mapTenantMembership(id, item.id, tenant.value.ownerUid, {
        ...raw, status: raw.status === undefined ? "active" : raw.status,
        // Match server rules: only canonical nested project assignments grant access.
        projectIds: raw.accessScope?.kind === "projects" ? raw.accessScope.projectIds : [],
      });
      if (!member.ok) return member;
      members.push(member.value);
    }
    return { ok: true, value: members };
  });
  return { ...unimplementedTenantRepository,
    listUserTenants: requestedUid => read(async () => {
      if (requestedUid !== uid || !scoped(activeTenantId)) return denied();
      const tenant = await summary();
      return tenant.ok ? { ok: true, value: [tenant.value] } : tenant;
    }),
    listMembers,
    getSeatUsage: id => read(async () => {
      if (!scoped(id)) return denied();
      const members = await listMembers(id);
      if (!members.ok) return members;
      const tenant = await getDoc(doc(db, "clients", id));
      const limits = tenant.data()?.limits;
      if (!limits || !Number.isInteger(limits.editorsLimit) || limits.editorsLimit < 0 || !Number.isInteger(limits.viewersLimit) || limits.viewersLimit < 0) return invalid();
      const reservations = await firebaseInvitations.seats(id);
      if (!reservations.ok) return reservations;
      return { ok: true, value: { tenantId: id, editors: { used: reservations.value.usage.editors, limit: reservations.value.limits.editorsLimit }, viewers: { used: reservations.value.usage.viewers, limit: reservations.value.limits.viewersLimit } } };
    }),
  };
}
