import { describe, expect, it } from "vitest";
import firestoreRules from "../../../firestore.rules?raw";
import storageRules from "../../../storage.rules?raw";
import logoHandlers from "../../../functions/src/branding/logoHandlers.ts?raw";

const normalizedFirestoreRules = firestoreRules.replace(/\r\n/g, "\n");

describe("branding security rule contracts", () => {
  it("scopes BrandProfile reads to workspace members and writes to admins", () => {
    expect(normalizedFirestoreRules).toContain("match /clients/{clientId}/settings/{settingId}");
    expect(normalizedFirestoreRules).toContain('allow read: if settingId == "brand" && isMember(clientId)');
    expect(normalizedFirestoreRules).toContain('settingId == "brand"\n        && isAdmin(clientId)');
  });

  it("prevents browser writes to backend-owned logo fields", () => {
    expect(firestoreRules).toContain(
      '"id", "ownerUid", "createdAt", "logoUrl", "logoStoragePath"'
    );
    expect(storageRules).toContain("allow create, update, delete: if false");
    expect(storageRules).toContain("isMember(clientId)");
    expect(logoHandlers).toContain("getBrandLogo");
    expect(logoHandlers).not.toContain("firebaseStorageDownloadTokens");
  });

  it("protects workspace ownership and billing fields from browser updates", () => {
    expect(firestoreRules).toContain(
      'request.resource.data.diff(resource.data).affectedKeys().hasOnly(["name"])'
    );
    expect(firestoreRules).toContain('request.resource.data.plan == "BASE"');
  });
});
