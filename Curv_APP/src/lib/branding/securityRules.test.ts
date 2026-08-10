import { describe, expect, it } from "vitest";
import rawFirestoreRules from "../../../firestore.rules?raw";
import rawStorageRules from "../../../storage.rules?raw";
import rawLogoHandlers from "../../../functions/src/branding/logoHandlers.ts?raw";

// git checks these out with CRLF wherever core.autocrlf is on (the default on Windows), which
// silently breaks every multi-line containment assertion. Normalize so the contracts below assert
// rule content rather than the contributor's checkout settings.
const normalize = (source: string) => source.replace(/\r\n/g, "\n");
const firestoreRules = normalize(rawFirestoreRules);
const storageRules = normalize(rawStorageRules);
const logoHandlers = normalize(rawLogoHandlers);

describe("branding security rule contracts", () => {
  it("scopes BrandProfile reads to workspace members and writes to admins", () => {
    expect(firestoreRules).toContain("match /clients/{clientId}/settings/{settingId}");
    expect(firestoreRules).toContain('allow read: if settingId == "brand" && isMember(clientId)');
    expect(firestoreRules).toContain('settingId == "brand"\n        && isAdmin(clientId)');
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
