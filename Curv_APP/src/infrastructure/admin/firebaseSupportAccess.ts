import { FirebaseError } from "firebase/app";
import { httpsCallable } from "firebase/functions";
import type { User } from "firebase/auth";
import { ensureFunctions } from "../../lib/firebase";

export type SupportAccess = "none" | "support" | "member";
export type AdminClientSummary = {
  id: string;
  name: string;
  plan: string;
  status: string;
  billingStatus: string;
  createdAt: string;
  access: SupportAccess;
};
export type SupportAccessResult<T> = { ok: true; value: T } | { ok: false; message: string };

async function call<T>(name: string, data: unknown): Promise<SupportAccessResult<T>> {
  try { return { ok: true, value: (await httpsCallable<unknown, T>(ensureFunctions(), name)(data)).data }; }
  catch (error) {
    if (!(error instanceof FirebaseError)) throw error;
    const code = error.code.replace("functions/", "");
    const known = ["permission-denied", "failed-precondition", "invalid-argument", "already-exists", "not-found", "unauthenticated"].includes(code);
    return { ok: false, message: known ? error.message : "No pudimos conectar con el servidor. Reintenta en unos segundos." };
  }
}

/** UI gate only. Every callable re-checks the claim server-side against the live user record. */
export const isSuperAdmin = async (user: User): Promise<boolean> => {
  try { return (await user.getIdTokenResult()).claims.superAdmin === true; }
  catch { return false; }
};

export const firebaseSupportAccess = {
  listClients: () => call<{ clients: AdminClientSummary[]; truncated: boolean }>("adminListClients", {}),
  grant: (clientId: string) => call<{ clientId: string; access: SupportAccess }>("adminGrantSupportAccess", { clientId }),
  revoke: (clientId: string) => call<{ clientId: string; access: SupportAccess }>("adminRevokeSupportAccess", { clientId }),
  open: (clientId: string) => call<{ tenantId: string }>("selectTeamTenant", { tenantId: clientId }),
};
