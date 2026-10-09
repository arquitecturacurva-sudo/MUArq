import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionTenant } from "../../domain/tenant/invitations";

const firestore = vi.hoisted(() => ({ getDoc: vi.fn(), doc: vi.fn((_db: unknown, ...path: string[]) => ({ path: path.join("/") })) }));
vi.mock("../../lib/firebase", () => ({ ensureDb: () => ({}) }));
vi.mock("firebase/firestore", async importOriginal => ({
  ...await importOriginal<typeof import("firebase/firestore")>(),
  doc: firestore.doc,
  getDoc: firestore.getDoc,
}));
vi.mock("../../lib/storage/brandLogoStorage", () => ({ loadBrandLogoPreview: vi.fn() }));

import { readViewerDocumentTheme } from "./viewerBranding";

const tenant: SessionTenant = { id: "study-1", name: "QA Studio", ownerUid: "owner-1", role: "viewer", projectIds: ["project-1"] };

describe("Viewer document identity", () => {
  beforeEach(() => { firestore.doc.mockClear(); firestore.getDoc.mockReset(); });

  it("reads only the member-readable brand setting and uses study defaults when absent", async () => {
    firestore.getDoc.mockResolvedValue({ exists: () => false });
    const theme = await readViewerDocumentTheme(tenant);
    expect(firestore.doc).toHaveBeenCalledWith({}, "clients", "study-1", "settings", "brand");
    expect(firestore.doc).toHaveBeenCalledTimes(1);
    expect(theme.companyName).toBe("QA Studio");
  });
});
