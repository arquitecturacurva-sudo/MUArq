import { doc, getDoc } from "firebase/firestore";
import { ensureDb } from "../../lib/firebase";
import { deserializeBrandProfile, toBrandProfileDraft } from "../../lib/branding/brandProfileSerialization";
import { createDefaultBrandProfile } from "../../lib/branding/defaults";
import { brandProfileToDocumentTheme } from "../../lib/branding/brandProfileToDocumentTheme";
import { loadBrandLogoPreview } from "../../lib/storage/brandLogoStorage";
import type { DocumentTheme } from "../../lib/branding/types";
import type { SessionTenant } from "../../domain/tenant/invitations";

/** The Viewer can read settings/brand, but the tenant root contains billing and is editor-only. */
export async function readViewerDocumentTheme(tenant: SessionTenant): Promise<DocumentTheme> {
  const snapshot = await getDoc(doc(ensureDb(), "clients", tenant.id, "settings", "brand"));
  if (!snapshot.exists()) {
    return brandProfileToDocumentTheme(createDefaultBrandProfile({ ownerUid: tenant.ownerUid, companyName: tenant.name }), tenant.name);
  }
  const parsed = deserializeBrandProfile({
    data: snapshot.data(),
    ownerUid: tenant.ownerUid,
    fallbackCompanyName: tenant.name,
  });
  if (!parsed) throw new Error("La identidad guardada tiene un formato incompatible.");
  let profile = toBrandProfileDraft(parsed);
  if (profile.logoStoragePath) {
    try {
      const preview = await loadBrandLogoPreview(tenant.id);
      profile = { ...profile, logoUrl: preview.logoUrl };
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      console.warn("[viewer] secure logo preview could not be loaded", error);
    }
  }
  return brandProfileToDocumentTheme(profile, tenant.name);
}
