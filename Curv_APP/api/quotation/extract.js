import { QuoteImportError, validateQuoteRequest, extractQuoteWithMistral } from "../_lib/quotation/document-ai.js";
import { readJsonBody } from "../_lib/http.js";

export const config = { maxDuration: 120 };

export async function reserveQuoteBudget(db, uid, pageCount) {
  const user = await db.doc(`users/${uid}`).get();
  const clientId = user.data()?.activeClientId;
  if (typeof clientId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(clientId)) throw new QuoteImportError(403, "No hay un estudio activo autorizado.");
  const client = db.doc(`clients/${clientId}`);
  const member = client.collection("members").doc(uid);
  const date = new Date().toISOString().slice(0, 10);
  const quota = client.collection("quotationImportUsage").doc(date);
  // Access and daily spending reservation share a transaction, including concurrent requests.
  await db.runTransaction(async tx => {
    const [study, membership, usage] = await Promise.all([tx.get(client), tx.get(member), tx.get(quota)]);
    const data = membership.data();
    if (!study.exists || (study.data().status && study.data().status !== "active") || !membership.exists ||
        data.uid !== uid || (data.status && data.status !== "active") || !["admin", "owner", "editor"].includes(data.role)) throw new QuoteImportError(403, "Solo administradores y editores activos pueden usar la lectura especializada.");
    const used = usage.data() || {};
    if ((used.requests || 0) >= 20 || (used.pages || 0) + pageCount > 200) throw new QuoteImportError(429, "Se alcanzó el límite diario del estudio: 20 lecturas o 200 páginas.");
    tx.set(quota, { requests: (used.requests || 0) + 1, pages: (used.pages || 0) + pageCount, updatedAt: new Date().toISOString() });
  });
}

export function createQuoteHandler({ getAdmin, getApiKey, extract = extractQuoteWithMistral, reserve = reserveQuoteBudget }) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Usa POST para leer un documento." }); }
    const token = String(req.headers.authorization || "").match(/^Bearer (\S+)$/i)?.[1];
    if (!token) return res.status(401).json({ error: "Inicia sesión para leer una cotización." });
    try {
      const { adminAuth, adminDb } = await getAdmin();
      let uid;
      try { uid = (await adminAuth.verifyIdToken(token, true)).uid; } catch { throw new QuoteImportError(401, "La sesión venció. Inicia sesión de nuevo."); }
      const input = validateQuoteRequest(await readJsonBody(req));
      const key = getApiKey();
      if (!key) throw new QuoteImportError(503, "La lectura especializada aún no está configurada en este entorno. Puedes probar el ejemplo o usar la lectura local.");
      await reserve(adminDb, uid, input.pageCount);
      const result = await extract(input, key);
      return res.status(200).json(result);
    } catch (error) {
      const status = error instanceof QuoteImportError ? error.status : error instanceof SyntaxError ? 400 : error?.name === "TimeoutError" ? 504 : 500;
      const message = error instanceof QuoteImportError ? error.message : status === 400 ? "La solicitud no contiene JSON válido." : status === 504 ? "La lectura demoró demasiado. Divide el PDF e inténtalo otra vez." : "No se pudo completar la lectura. No se modificó tu cotización.";
      return res.status(status).json({ error: message });
    }
  };
}
export default createQuoteHandler({
  getAdmin: () => import("../_lib/firebase-admin.js"),
  getApiKey: () => process.env.MISTRAL_API_KEY,
});

