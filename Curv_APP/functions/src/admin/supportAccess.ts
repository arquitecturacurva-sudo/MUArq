import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import { FieldValue } from "firebase-admin/firestore";
import { requireAuthUid } from "../shared/callableAuth.js";
import { activeMember, fail, id } from "../tenant/invitationService.js";

type Actor = { uid: string; email: string; name: string };
type Data = Record<string, unknown>;

/**
 * Super-admin is a custom claim set out of band by scripts/set-super-admin.mjs. Never an email
 * allow-list: email/password sign-up does not prove ownership of the address.
 */
const requireSuperAdmin = async (context: functions.https.CallableContext): Promise<Actor> => {
  const uid = requireAuthUid(context);
  if (context.auth?.token?.superAdmin !== true) fail("permission-denied", "Solo el superadministrador puede usar este panel.");
  // The token can outlive a revoked claim by up to an hour; re-check the live record.
  const user = await admin.auth().getUser(uid);
  if (user.disabled || user.customClaims?.superAdmin !== true) fail("permission-denied", "Solo el superadministrador puede usar este panel.");
  return { uid, email: user.email || "", name: user.displayName || "" };
};

const MAX_CLIENTS = 500;

export function createSupportAccessBackend(db: admin.firestore.Firestore, now = () => Date.now()) {
  const audit = (tx: admin.firestore.Transaction, actor: Actor, action: "grant" | "revoke", clientId: string) => {
    tx.create(db.collection("adminAudit").doc(), { action, clientId, actorUid: actor.uid, at: new Date(now()).toISOString() });
  };
  return {
    async list(actor: Actor) {
      const [clients, memberships] = await Promise.all([
        // No orderBy: it would silently drop legacy studios that predate the createdAt field.
        db.collection("clients").limit(MAX_CLIENTS).get(),
        db.collectionGroup("members").where("uid", "==", actor.uid).get(),
      ]);
      const access = new Map<string, "support" | "member">();
      for (const doc of memberships.docs) {
        const clientId = doc.ref.parent.parent?.id;
        if (clientId && activeMember(doc.data())) access.set(clientId, doc.data().support === true ? "support" : "member");
      }
      return {
        clients: clients.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: String(data.name || "Estudio"),
            plan: typeof data.plan === "string" ? data.plan : "",
            status: typeof data.status === "string" ? data.status : "active",
            billingStatus: typeof data.billing?.status === "string" ? data.billing.status : "",
            createdAt: typeof data.createdAt === "string" ? data.createdAt : "",
            access: access.get(doc.id) ?? "none",
          };
        }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        truncated: clients.size >= MAX_CLIENTS,
      };
    },
    async grant(actor: Actor, input: Data) {
      const tenant = db.collection("clients").doc(id(input.clientId));
      return db.runTransaction(async (tx) => {
        const memberRef = tenant.collection("members").doc(actor.uid);
        const [study, member] = await Promise.all([tx.get(tenant), tx.get(memberRef)]);
        if (!study.exists) fail("not-found", "Estudio no encontrado.");
        if (member.exists) {
          // A real membership is never rewritten into support access, and vice versa.
          if (member.data()?.support === true) return { clientId: tenant.id, access: "support" };
          fail("already-exists", "Ya eres miembro de este estudio.");
        }
        const iso = new Date(now()).toISOString();
        // `support: true` keeps this out of seat counts and the studio's team list.
        tx.create(memberRef, { uid: actor.uid, role: "admin", status: "active", support: true, email: actor.email, displayName: actor.name.slice(0, 160), createdAt: iso, accessScope: { kind: "tenant" } });
        tx.set(db.collection("users").doc(actor.uid), { uid: actor.uid, clientIds: FieldValue.arrayUnion(tenant.id), updatedAt: iso }, { merge: true });
        tx.update(tenant, { teamRevision: FieldValue.increment(1) });
        audit(tx, actor, "grant", tenant.id);
        return { clientId: tenant.id, access: "support" };
      });
    },
    async revoke(actor: Actor, input: Data) {
      const tenant = db.collection("clients").doc(id(input.clientId));
      return db.runTransaction(async (tx) => {
        const memberRef = tenant.collection("members").doc(actor.uid);
        const userRef = db.collection("users").doc(actor.uid);
        const [member, user] = await Promise.all([tx.get(memberRef), tx.get(userRef)]);
        if (!member.exists) return { clientId: tenant.id, access: "none" };
        if (member.data()?.support !== true) fail("failed-precondition", "Esta es una membresía real; no se elimina desde el panel.");
        const iso = new Date(now()).toISOString();
        tx.delete(memberRef);
        // Clearing a dangling pointer lets ensureTenant fall back to the admin's own studio.
        tx.set(userRef, {
          clientIds: FieldValue.arrayRemove(tenant.id),
          ...(user.data()?.activeClientId === tenant.id ? { activeClientId: FieldValue.delete() } : {}),
          updatedAt: iso,
        }, { merge: true });
        tx.update(tenant, { teamRevision: FieldValue.increment(1) });
        audit(tx, actor, "revoke", tenant.id);
        return { clientId: tenant.id, access: "none" };
      });
    },
  };
}

function callable(operation: (service: ReturnType<typeof createSupportAccessBackend>, actor: Actor, data: Data) => Promise<unknown>) {
  return functions.runWith({ timeoutSeconds: 60, memory: "256MB", maxInstances: 2 }).https.onCall(async (input: unknown, context) => {
    const actor = await requireSuperAdmin(context);
    if (input !== null && input !== undefined && (typeof input !== "object" || Array.isArray(input))) fail("invalid-argument", "Solicitud no valida.");
    return operation(createSupportAccessBackend(admin.firestore()), actor, (input || {}) as Data);
  });
}

export const adminListClients = callable((service, actor) => service.list(actor));
export const adminGrantSupportAccess = callable((service, actor, data) => service.grant(actor, data));
export const adminRevokeSupportAccess = callable((service, actor, data) => service.revoke(actor, data));
