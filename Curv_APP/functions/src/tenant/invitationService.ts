import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

export type Role = "admin" | "editor" | "viewer";
export type Actor = { uid: string; email: string; verified: boolean; name: string };
type Data = Record<string, unknown>;
export const normalizeEmail = (value: unknown): string => {
  if (typeof value !== "string" || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) fail("invalid-argument", "Indica un correo valido.");
  return (value as string).trim().toLowerCase();
};
export function fail(code: functions.https.FunctionsErrorCode, message: string): never { throw new functions.https.HttpsError(code, message); }
export const id = (value: unknown): string => typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value) ? value : fail("invalid-argument", "Referencia no valida.");
export const roleOf = (value: unknown): Role | null => value === "owner" ? "admin" : value === "observer" ? "viewer" : value === "admin" || value === "editor" || value === "viewer" ? value : null;
export const activeMember = (data: Data | undefined): boolean => Boolean(data && roleOf(data.role) && (data.status === undefined || data.status === "active"));
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
const expires = (data: admin.firestore.DocumentData): number => data.expiresAt instanceof Timestamp ? data.expiresAt.toMillis() : 0;
const pending = (data: admin.firestore.DocumentData, now: number) => data.status === "pending" && expires(data) > now;
const publicInvite = (snapshot: admin.firestore.DocumentSnapshot, now: number) => {
  const data = snapshot.data()!;
  return { id: snapshot.id, email: data.email as string, role: data.role as Role, projectIds: data.projectIds as string[],
    status: data.status === "pending" && expires(data) <= now ? "expired" : data.status as string,
    expiresAt: new Date(expires(data)).toISOString() };
};
export function validateScope(role: unknown, projects: unknown): { role: Role; projectIds: string[] } {
  if (role !== "admin" && role !== "editor" && role !== "viewer") fail("invalid-argument", "Rol no valido.");
  if (!Array.isArray(projects) || projects.length > 100) fail("invalid-argument", "Seleccion de proyectos no valida.");
  const projectIds = [...new Set((projects as unknown[]).map(id))];
  if (role === "viewer" && !projectIds.length) fail("invalid-argument", "Selecciona al menos un proyecto para el Viewer.");
  if (role !== "viewer" && projectIds.length) fail("invalid-argument", "Admin y editor acceden al estudio completo.");
  return { role: role as Role, projectIds };
}
export function seatUsage(members: admin.firestore.DocumentData[], invitations: admin.firestore.DocumentData[], now: number) {
  if (members.some(data => (data.status === undefined || data.status === "active") && !roleOf(data.role))) fail("failed-precondition", "Hay una membresia con rol no reconocido.");
  const used = { editors: 0, viewers: 0 };
  for (const data of [...members.filter(activeMember), ...invitations.filter(item => pending(item, now))]) {
    const role = roleOf(data.role); if (!role) fail("failed-precondition", "Hay una membresia con rol no reconocido.");
    used[role === "viewer" ? "viewers" : "editors"]++;
  }
  return used;
}
export function assertSeat(limits: unknown, used: ReturnType<typeof seatUsage>, role: Role) {
  const key = role === "viewer" ? "viewers" : "editors";
  const limit = limits && typeof limits === "object" ? (limits as Data)[key + "Limit"] : undefined;
  if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 0) fail("failed-precondition", "El estudio no tiene limites de plazas validos.");
  if (used[key] >= limit) fail("resource-exhausted", "No hay plazas disponibles para ese rol.");
}

export function createInvitationBackend(db: admin.firestore.Firestore, now = () => Date.now()) {
  const tenantRef = (tenantId: unknown) => db.collection("clients").doc(id(tenantId));
  async function authorized(tx: admin.firestore.Transaction, tenant: admin.firestore.DocumentReference, actor: Actor, adminOnly = true) {
    const [study, member] = await Promise.all([tx.get(tenant), tx.get(tenant.collection("members").doc(actor.uid))]);
    if (!study.exists || study.data()?.status && study.data()?.status !== "active") fail("permission-denied", "Estudio no disponible.");
    if (!activeMember(member.data()) || adminOnly && roleOf(member.data()?.role) !== "admin") fail("permission-denied", "Necesitas ser administrador activo del estudio.");
    return study.data()!;
  }
  async function projectScope(tx: admin.firestore.Transaction, tenant: admin.firestore.DocumentReference, projectIds: string[]) {
    const docs = await Promise.all(projectIds.map(project => tx.get(tenant.collection("projects").doc(project))));
    if (docs.some(doc => !doc.exists)) fail("invalid-argument", "Uno de los proyectos ya no pertenece al estudio.");
  }
  async function usage(tx: admin.firestore.Transaction, tenant: admin.firestore.DocumentReference) {
    const [members, invites] = await Promise.all([tx.get(tenant.collection("members")), tx.get(tenant.collection("invitations").where("status", "==", "pending"))]);
    return { members, invites };
  }
  async function rate(tx: admin.firestore.Transaction, uid: string, operation: string, max: number) {
    const ref = db.collection("invitationRateLimits").doc(uid + "_" + operation);
    const snapshot = await tx.get(ref); const current = snapshot.data();
    const start = typeof current?.start === "number" && now() - current.start < 3600000 ? current.start : now();
    const count = start === current?.start ? Number(current?.count || 0) : 0;
    if (count >= max) fail("resource-exhausted", "Demasiados intentos. Vuelve a intentarlo mas tarde.");
    return () => tx.set(ref, { start, count: count + 1 });
  }
  // Rate attempts separately so invalid-token failures cannot roll the rate counter back.
  async function attempt(actor: Actor) { await db.runTransaction(async tx => { const commit = await rate(tx, actor.uid, "accept", 60); commit(); }); }
  return {
    async create(actor: Actor, input: Data) {
      const tenant = tenantRef(input.tenantId); const invitation = tenant.collection("invitations").doc(id(input.requestId));
      const email = normalizeEmail(input.email); const scope = validateScope(input.role, input.projectIds);
      const token = randomBytes(32).toString("base64url"); const tokenHash = digest(token);
      return db.runTransaction(async tx => {
        const study = await authorized(tx, tenant, actor);
        const existing = await tx.get(invitation);
        if (existing.exists) {
          const data = existing.data()!;
          if (data.createdBy !== actor.uid || data.email !== email || data.role !== scope.role || JSON.stringify(data.projectIds) !== JSON.stringify(scope.projectIds)) fail("already-exists", "La solicitud ya existe con otros datos.");
          return { invitation: publicInvite(existing, now()), token: null }; // Retry reserves no second seat. Renew explicitly for a new link.
        }
        await projectScope(tx, tenant, scope.projectIds);
        const { members, invites } = await usage(tx, tenant);
        if (members.docs.some(doc => typeof doc.data().email === "string" && doc.data().email.trim().toLowerCase() === email)) fail("already-exists", "Esta persona ya tiene una membresia. No se cambia su rol mediante invitaciones.");
        if (invites.docs.some(doc => doc.data().email === email && pending(doc.data(), now()))) fail("already-exists", "Ya existe una invitacion vigente para ese correo.");
        assertSeat(study.limits, seatUsage(members.docs.map(doc => doc.data()), invites.docs.map(doc => doc.data()), now()), scope.role);
        const commitRate = await rate(tx, actor.uid, "create", 30);
        const expiry = now() + 7 * 86400000;
        tx.create(invitation, { email, ...scope, createdBy: actor.uid, status: "pending", tokenHash, createdAt: Timestamp.fromMillis(now()), expiresAt: Timestamp.fromMillis(expiry) });
        tx.update(tenant, { teamRevision: FieldValue.increment(1) }); commitRate();
        return { invitation: { id: invitation.id, email, ...scope, status: "pending", expiresAt: new Date(expiry).toISOString() }, token };
      });
    },
    async list(actor: Actor, input: Data) {
      const tenant = tenantRef(input.tenantId);
      return db.runTransaction(async tx => {
        const study = await authorized(tx, tenant, actor);
        const { members, invites } = await usage(tx, tenant);
        return { invitations: invites.docs.map(doc => publicInvite(doc, now())), usage: seatUsage(members.docs.map(doc => doc.data()), invites.docs.map(doc => doc.data()), now()), limits: study.limits };
      });
    },
    async change(actor: Actor, input: Data, renew: boolean) {
      const tenant = tenantRef(input.tenantId); const ref = tenant.collection("invitations").doc(id(input.invitationId));
      const token = randomBytes(32).toString("base64url");
      return db.runTransaction(async tx => {
        const study = await authorized(tx, tenant, actor); const snapshot = await tx.get(ref);
        if (!snapshot.exists) fail("not-found", "Invitacion no encontrada.");
        const invite = snapshot.data()!;
        if (!renew && invite.status === "cancelled") return { token: null };
        if (invite.status !== "pending") fail("failed-precondition", "Esta invitacion ya no esta pendiente.");
        if (renew) {
          await projectScope(tx, tenant, validateScope(invite.role, invite.projectIds).projectIds);
          const { members, invites } = await usage(tx, tenant);
          if (invites.docs.some(doc => doc.id !== ref.id && doc.data().email === invite.email && pending(doc.data(), now()))) fail("already-exists", "Ya existe otra invitacion vigente para ese correo.");
          assertSeat(study.limits, seatUsage(members.docs.map(doc => doc.data()), invites.docs.filter(doc => doc.id !== ref.id).map(doc => doc.data()), now()), invite.role);
        }
        const commitRate = await rate(tx, actor.uid, "change", 60);
        tx.update(ref, renew ? { tokenHash: digest(token), createdBy: actor.uid, expiresAt: Timestamp.fromMillis(now() + 7 * 86400000) } : { status: "cancelled", cancelledBy: actor.uid, cancelledAt: Timestamp.fromMillis(now()) });
        tx.update(tenant, { teamRevision: FieldValue.increment(1) }); commitRate();
        return { token: renew ? token : null };
      });
    },
    async preview(actor: Actor, input: Data) {
      const tenant = tenantRef(input.tenantId); const ref = tenant.collection("invitations").doc(id(input.invitationId));
      if (!actor.verified) fail("failed-precondition", "Verifica tu correo antes de aceptar.");
      if (typeof input.token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(input.token)) fail("invalid-argument", "Enlace de invitacion no valido.");
      await attempt(actor);
      const tokenHash = digest(input.token as string);
      const [snapshot, study] = await Promise.all([ref.get(), tenant.get()]); const invite = snapshot.data();
      if (!invite || typeof invite.tokenHash !== "string" || !/^[a-f0-9]{64}$/.test(invite.tokenHash) || !timingSafeEqual(Buffer.from(invite.tokenHash), Buffer.from(tokenHash))) fail("permission-denied", "Enlace no valido o no disponible.");
      if (invite.email !== normalizeEmail(actor.email)) fail("permission-denied", "Inicia sesion con el correo al que se envio la invitacion.");
      if (!study.exists || study.data()?.status && study.data()?.status !== "active") fail("permission-denied", "Estudio no disponible.");
      if (!pending(invite, now()) && !(invite.status === "accepted" && invite.acceptedBy === actor.uid)) fail("failed-precondition", "La invitacion vencio, fue cancelada o ya se utilizo.");
      return { tenantName: String(study.data()?.name || "Estudio"), ...validateScope(invite.role, invite.projectIds), expiresAt: new Date(expires(invite)).toISOString() };
    },
    async accept(actor: Actor, input: Data) {
      const tenant = tenantRef(input.tenantId); const ref = tenant.collection("invitations").doc(id(input.invitationId));
      if (!actor.verified) fail("failed-precondition", "Verifica tu correo antes de aceptar.");
      const email = normalizeEmail(actor.email);
      if (typeof input.token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(input.token)) fail("invalid-argument", "Enlace de invitacion no valido.");
      const tokenHash = digest(input.token as string); await attempt(actor);
      return db.runTransaction(async tx => {
        const [snapshot, study, member, user] = await Promise.all([tx.get(ref), tx.get(tenant), tx.get(tenant.collection("members").doc(actor.uid)), tx.get(db.collection("users").doc(actor.uid))]);
        const invite = snapshot.data();
        if (!invite || typeof invite.tokenHash !== "string" || !/^[a-f0-9]{64}$/.test(invite.tokenHash) || !timingSafeEqual(Buffer.from(invite.tokenHash), Buffer.from(tokenHash))) fail("permission-denied", "Enlace no valido o no disponible.");
        if (invite.email !== email) fail("permission-denied", "Inicia sesion con el correo al que se envio la invitacion.");
        if (!study.exists || study.data()?.status && study.data()?.status !== "active") fail("permission-denied", "Estudio no disponible.");
        if (invite.status === "accepted" && invite.acceptedBy === actor.uid) {
          if (!activeMember(member.data())) fail("permission-denied", "Tu acceso ya no esta activo.");
          return { tenantId: tenant.id, role: roleOf(member.data()?.role) };
        }
        if (!pending(invite, now())) fail("failed-precondition", "La invitacion vencio, fue cancelada o ya se utilizo.");
        if (member.exists) fail("already-exists", "Ya tienes una membresia en este estudio; no se modifico tu rol.");
        const inviter = await tx.get(tenant.collection("members").doc(invite.createdBy));
        if (!activeMember(inviter.data()) || roleOf(inviter.data()?.role) !== "admin") fail("permission-denied", "Quien te invito ya no puede administrar el estudio. Solicita un enlace nuevo.");
        const scope = validateScope(invite.role, invite.projectIds); await projectScope(tx, tenant, scope.projectIds);
        const { members, invites } = await usage(tx, tenant);
        assertSeat(study.data()?.limits, seatUsage(members.docs.map(doc => doc.data()), invites.docs.filter(doc => doc.id !== ref.id).map(doc => doc.data()), now()), scope.role);
        const iso = new Date(now()).toISOString();
        tx.create(member.ref, { uid: actor.uid, role: scope.role, status: "active", email, displayName: actor.name.slice(0, 160), createdAt: iso,
          accessScope: scope.role === "viewer" ? { kind: "projects", projectIds: scope.projectIds } : { kind: "tenant" } });
        tx.update(ref, { status: "accepted", acceptedBy: actor.uid, acceptedAt: Timestamp.fromMillis(now()) });
        tx.set(user.ref, { uid: actor.uid, email, displayName: actor.name.slice(0,160), activeClientId: tenant.id, clientIds: FieldValue.arrayUnion(tenant.id), updatedAt: iso, ...(user.exists ? {} : { createdAt: iso }) }, { merge: true });
        tx.update(tenant, { teamRevision: FieldValue.increment(1) });
        return { tenantId: tenant.id, role: scope.role };
      });
    },
    async seats(actor: Actor, input: Data) {
      const tenant = tenantRef(input.tenantId);
      return db.runTransaction(async tx => {
        const study = await authorized(tx, tenant, actor, false);
        const member = await tx.get(tenant.collection("members").doc(actor.uid));
        if (roleOf(member.data()?.role) === "viewer") fail("permission-denied", "Solo el equipo interno puede consultar plazas.");
        const { members, invites } = await usage(tx, tenant);
        return { usage: seatUsage(members.docs.map(doc => doc.data()), invites.docs.map(doc => doc.data()), now()), limits: study.limits };
      });
    },
    async session(actor: Actor) {
      const [user, memberships] = await Promise.all([db.collection("users").doc(actor.uid).get(), db.collectionGroup("members").where("uid", "==", actor.uid).get()]);
      const tenants = (await Promise.all(memberships.docs.filter(doc => activeMember(doc.data()) && /^clients\/[^/]+\/members\/[^/]+$/.test(doc.ref.path)).map(async member => {
        const study = await member.ref.parent.parent!.get(); const data = study.data();
        if (!data || data.status && data.status !== "active") return null;
        return { id: study.id, name: String(data.name || "Estudio"), ownerUid: String(data.ownerUid || ""), role: roleOf(member.data().role)!, projectIds: member.data().accessScope?.kind === "projects" && Array.isArray(member.data().accessScope.projectIds) ? member.data().accessScope.projectIds.filter((id: unknown) => typeof id === "string") as string[] : [] };
      }))).filter((value): value is NonNullable<typeof value> => value !== null);
      const activeTenantId = tenants.find(tenant => tenant.id === user.data()?.activeClientId)?.id || tenants[0]?.id || null;
      return { tenants, activeTenantId };
    },
    async select(actor: Actor, input: Data) {
      const tenant = tenantRef(input.tenantId);
      return db.runTransaction(async tx => {
        await authorized(tx, tenant, actor, false);
        tx.set(db.collection("users").doc(actor.uid), { uid: actor.uid, activeClientId: tenant.id, clientIds: FieldValue.arrayUnion(tenant.id), updatedAt: new Date(now()).toISOString() }, { merge: true });
        return { tenantId: tenant.id };
      });
    },
  };
}
