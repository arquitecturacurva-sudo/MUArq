import { describe, expect, it } from "vitest";
import rawFirestoreRules from "../../../firestore.rules?raw";
import rawIndexes from "../../../firestore.indexes.json?raw";
import { PROJECT_TOOL_IDS } from "../../features/runtime/storage/projectToolPartition";

// See securityRules.test.ts in lib/branding — CRLF checkouts break multi-line containment.
const firestoreRules = rawFirestoreRules.replace(/\r\n/g, "\n");

describe("project tool document rules", () => {
  it("grants member reads and editor writes on the toolData subcollection", () => {
    // rules_version 2 does not cascade into subcollections: without this block every tool
    // document write is denied.
    expect(firestoreRules).toContain(
      "match /clients/{clientId}/projects/{projectId}/toolData/{toolId}"
    );
    expect(firestoreRules).toContain("allow read: if isMember(clientId);");
    expect(firestoreRules).toContain("allow create, update: if isEditor(clientId)");
  });

  it("pins each tool document to its own id, project and tenant", () => {
    // Without the projectId/clientId assertions a tool document could be copied wholesale into
    // another project or another tenant.
    expect(firestoreRules).toContain("request.resource.data.id == toolId");
    expect(firestoreRules).toContain("request.resource.data.toolId == toolId");
    expect(firestoreRules).toContain("request.resource.data.projectId == projectId");
    expect(firestoreRules).toContain("request.resource.data.clientId == clientId");
  });

  it("bounds the subcollection to the canonical tool ids", () => {
    // Drift between this list and PROJECT_TOOL_IDS shows up as denied writes in production with
    // no local signal, so assert them against each other.
    const allowList = firestoreRules
      .split("match /clients/{clientId}/projects/{projectId}/toolData/{toolId}")[1]
      ?.split("validProjectToolDoc")[0] ?? "";
    PROJECT_TOOL_IDS.forEach((toolId) => {
      expect(allowList).toContain(`"${toolId}"`);
    });
    const quoted = allowList.match(/"[a-z]+"/g) ?? [];
    expect(quoted.length).toBe(PROJECT_TOOL_IDS.length);
  });

  it("keeps the parent project block intact", () => {
    expect(firestoreRules).toContain("match /clients/{clientId}/projects/{projectId} {");
  });

  it("never nests tool data under a members path", () => {
    // match /{path=**}/members/{memberId} grants reads at any depth, so a subcollection named
    // "members" would be exposed by it.
    expect(firestoreRules).not.toContain("/toolData/{toolId}/members");
    expect(firestoreRules).not.toContain("/projects/{projectId}/members");
  });

  it("exempts large map fields from automatic indexing", () => {
    // Firestore auto-indexes every subfield and array element of a map, and caps a document at
    // 40,000 index entries — an OCR-imported cot.* array blows that well before the 1 MiB limit.
    const indexes = JSON.parse(rawIndexes) as {
      fieldOverrides: { collectionGroup: string; fieldPath: string; indexes: unknown[] }[];
    };
    const exempted = indexes.fieldOverrides.filter((entry) => entry.indexes.length === 0);
    expect(exempted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ collectionGroup: "toolData", fieldPath: "data" }),
        expect.objectContaining({ collectionGroup: "projects", fieldPath: "snapshot" }),
      ])
    );
  });
});
