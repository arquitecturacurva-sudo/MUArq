import { adminAuth, adminDb } from "../_lib/firebase-admin.js";

export const config = { maxDuration: 60 };
const MODEL = "nvidia/nemotron-parse-2.0";
const MAX_BODY = 3_000_000;

async function boundedBody(req) {
  if (req.body) {
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > MAX_BODY) throw new Error("size");
    return JSON.parse(raw);
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error("size");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({error:"Usa POST."}); }
  const token = /^Bearer (.+)$/i.exec(String(req.headers.authorization || ""))?.[1];
  if (!token) return res.status(401).json({error:"Inicia sesión para usar NVIDIA."});
  let user;
  try { user = await adminAuth.verifyIdToken(token, true); }
  catch { return res.status(401).json({error:"La sesión venció. Vuelve a iniciar sesión."}); }
  let body;
  try { body = await boundedBody(req); }
  catch { return res.status(400).json({error:"Imagen inválida o demasiado grande (máximo 3 MB)."}); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return res.status(400).json({error:"Petición inválida."});
  const {clientId, image} = body;
  if (typeof clientId !== "string" || !/^[\w-]{1,128}$/.test(clientId) || typeof image !== "string" ||
      !/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(image) || image.length > MAX_BODY - 200) {
    return res.status(400).json({error:"Selecciona una imagen PNG o JPEG válida."});
  }
  const bytes = Buffer.from(image.split(",")[1], "base64");
  if (!(image.startsWith("data:image/png;") ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)) {
    return res.status(400).json({error:"El contenido no corresponde a una imagen."});
  }
  try {
    const member = await adminDb.collection("clients").doc(clientId).collection("members").doc(user.uid).get();
    if (!member.exists || !["admin", "editor"].includes(member.data()?.role)) return res.status(403).json({error:"Necesitas permiso de edición en el estudio."});
    if (!process.env.NVIDIA_API_KEY) return res.status(503).json({error:"NVIDIA no está configurado. Puedes seguir con la lectura local."});
    // Persistent quota across Vercel instances. No document content is stored.
    const usage = adminDb.collection("quotationOcrUsage").doc(user.uid);
    const day = new Date().toISOString().slice(0,10);
    const allowed = await adminDb.runTransaction(async tx => {
      const snapshot = await tx.get(usage);
      const count = snapshot.data()?.day === day ? Number(snapshot.data()?.count) || 0 : 0;
      if (count >= 60) return false;
      tx.set(usage, {day, count:count + 1}); return true;
    });
    if (!allowed) return res.status(429).json({error:"Llegaste al límite de 60 páginas por día. La lectura local sigue disponible."});
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method:"POST", headers:{Authorization:`Bearer ${process.env.NVIDIA_API_KEY}`, "Content-Type":"application/json"},
      signal:AbortSignal.timeout(45_000),
      body:JSON.stringify({model:MODEL, temperature:0, max_tokens:3500, stream:false, messages:[{role:"user",content:[
        {type:"text",text:"</s><s><predict_bbox><predict_classes><output_markdown><predict_no_text_in_pic>"},
        {type:"image_url",image_url:{url:image}},
      ]}]}),
    });
    // Upstream errors can echo the entire image; never relay or log their bodies.
    if (!response.ok) return res.status(502).json({error:"NVIDIA no pudo leer esta página. Conservamos la lectura local; intenta más tarde."});
    const result = await response.json();
    const choice = result.choices?.[0], text = choice?.message?.content;
    if (typeof text !== "string" || !text.trim() || text.length > 80_000 || choice.finish_reason !== "stop") {
      return res.status(502).json({error:"NVIDIA devolvió una lectura vacía o incompleta. Conservamos la lectura local."});
    }
    return res.status(200).json({text, model:MODEL});
  } catch {
    return res.status(503).json({error:"La lectura con NVIDIA no está disponible. Conservamos la lectura local."});
  }
}
