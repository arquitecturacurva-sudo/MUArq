import { describe, expect, it } from "vitest";
import rawFirestoreRules from "../../../firestore.rules?raw";

// See securityRules.test.ts in lib/branding — CRLF checkouts break multi-line containment.
const firestoreRules = rawFirestoreRules.replace(/\r\n/g, "\n");

describe("tenant provisioning rule contracts", () => {
  it("removes every uid-shaped tenant coupling", () => {
    // The single highest-value assertion here: the entire attack surface of moving to generated
    // tenant ids is "did the permissive clause actually get deleted".
    expect(firestoreRules).not.toContain("clientId == request.auth.uid");
    expect(firestoreRules).not.toContain("validBootstrapClient");
    expect(firestoreRules).not.toContain("isMemberNowOrAfter");
  });

  it("drops the legacy ownerId read bypass", () => {
    // A stale pre-rename field must not be able to grant tenant access.
    expect(firestoreRules).not.toContain("resource.data.ownerId");
    expect(firestoreRules).toContain("match /clients/{clientId} {\n      allow read: if isMember(clientId);");
  });

  it("makes tenant creation server-only", () => {
    expect(firestoreRules).toContain("allow create: if false;");
    // Squatting is impossible by construction: there is no client-reachable write path at all.
    expect(firestoreRules).not.toMatch(/match \/clients\/\{clientId\} \{[\s\S]*?allow create: if signedIn/);
  });

  it("removes member self-bootstrap", () => {
    expect(firestoreRules).not.toContain("existsAfter(");
    expect(firestoreRules).not.toContain("getAfter(/databases/$(database)/documents/clients/");
  });

  it("locks the user pointer document to a field allowlist", () => {
    expect(firestoreRules).toContain(
      '"activeClientId", "displayName", "email", "migrations", "updatedAt"'
    );
    // clientIds is server-maintained; a browser must not be able to point at another tenant.
    expect(firestoreRules).not.toMatch(/hasOnly\(\[[^\]]*"clientIds"/);
  });

  it("still requires membership before activeClientId can point somewhere", () => {
    expect(firestoreRules).toContain("hasValidActiveClientOnWrite(userId)");
  });

  it("keeps the collection-group membership read the repair path depends on", () => {
    // ensureTenant runs the same query shape via the Admin SDK to adopt an existing tenant.
    expect(firestoreRules).toContain("match /{path=**}/members/{memberId}");
  });
});
