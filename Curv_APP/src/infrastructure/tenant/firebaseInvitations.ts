import { FirebaseError } from "firebase/app";
import { httpsCallable } from "firebase/functions";
import { ensureFunctions } from "../../lib/firebase";
import type { InvitationGateway } from "../../domain/tenant/invitations";
import type { TenantAccessResult } from "../../domain/tenant/teamAccess";
async function call<T>(name: string, data: unknown): Promise<TenantAccessResult<T>> {
  try { return { ok: true, value: (await httpsCallable<unknown, T>(ensureFunctions(), name)(data)).data }; }
  catch (error) {
    if (!(error instanceof FirebaseError)) throw error;
    const code = error.code.replace("functions/", "");
    const known = ["permission-denied", "failed-precondition", "invalid-argument", "already-exists", "resource-exhausted", "not-found", "unauthenticated"].includes(code);
    return { ok: false, error: { code: code === "permission-denied" ? "permission-denied" : code === "unauthenticated" ? "unauthenticated" : code === "not-found" ? "not-found" : code === "already-exists" ? "conflict" : code === "invalid-argument" ? "invalid-input" : "unavailable",
      message: known ? error.message : "No pudimos conectar con el servidor. Conserva los datos y reintenta." } };
  }
}
export const firebaseInvitations: InvitationGateway = {
  preview: link => call("previewTeamInvitation", link),
  create: input => call("createTeamInvitation", input),
  list: tenantId => call("listTeamInvitations", { tenantId }),
  cancel: (tenantId, invitationId) => call("cancelTeamInvitation", { tenantId, invitationId }),
  renew: (tenantId, invitationId) => call("renewTeamInvitation", { tenantId, invitationId }),
  accept: link => call("acceptTeamInvitation", link),
  seats: tenantId => call("getTeamSeatUsage", { tenantId }),
  session: () => call("getTeamSession", {}),
  select: tenantId => call("selectTeamTenant", { tenantId }),
};
