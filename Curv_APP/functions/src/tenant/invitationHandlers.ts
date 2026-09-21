import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import { requireAuthUid } from "../shared/callableAuth.js";
import { createInvitationBackend, type Actor } from "./invitationService.js";
function callable(operation: (service: ReturnType<typeof createInvitationBackend>, actor: Actor, data: Record<string, unknown>) => Promise<unknown>) {
  return functions.runWith({ timeoutSeconds: 60, memory: "256MB", maxInstances: 10 }).https.onCall(async (input: unknown, context) => {
    const uid = requireAuthUid(context);
    const user = await admin.auth().getUser(uid);
    if (user.disabled) throw new functions.https.HttpsError("permission-denied", "Cuenta deshabilitada.");
    const actor = { uid, email: user.email || "", verified: user.emailVerified, name: user.displayName || "" };
    if (input !== null && input !== undefined && (typeof input !== "object" || Array.isArray(input))) throw new functions.https.HttpsError("invalid-argument", "Solicitud no valida.");
    return operation(createInvitationBackend(admin.firestore()), actor, (input || {}) as Record<string, unknown>);
  });
}
export const createTeamInvitation = callable((service, actor, data) => service.create(actor, data));
export const listTeamInvitations = callable((service, actor, data) => service.list(actor, data));
export const cancelTeamInvitation = callable((service, actor, data) => service.change(actor, data, false));
export const renewTeamInvitation = callable((service, actor, data) => service.change(actor, data, true));
export const acceptTeamInvitation = callable((service, actor, data) => service.accept(actor, data));
export const getTeamSession = callable((service, actor) => service.session(actor));
export const selectTeamTenant = callable((service, actor, data) => service.select(actor, data));

export const getTeamSeatUsage = callable((service, actor, data) => service.seats(actor, data));
export const previewTeamInvitation = callable((service, actor, data) => service.preview(actor, data));
