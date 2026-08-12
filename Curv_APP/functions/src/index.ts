import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();

// Tenant provisioning is the ensureTenant callable, not an auth trigger. See ensureTenant.ts for
// why: a trigger fires once per account (so it can never repair an existing user), retries under
// failurePolicy (which would mint a second tenant now that ids are generated), and fails invisibly.
export { ensureTenant } from "./tenant/ensureTenant.js";
export { deleteBrandLogo, getBrandLogo, upsertBrandLogo } from "./branding/logoHandlers.js";
