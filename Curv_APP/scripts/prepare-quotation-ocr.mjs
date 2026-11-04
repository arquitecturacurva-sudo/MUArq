import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Build-time only. Runtime OCR never downloads code or language data from a CDN.
const root = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = path.join(root, "public/quotation-ocr");
const manifest = JSON.parse(await readFile(path.join(publicRoot, "manifest.json"), "utf8"));
const digest = bytes => createHash("sha256").update(bytes).digest("hex");

for (const [name, version] of Object.entries(manifest.packages)) {
  const installed = JSON.parse(await readFile(path.join(root, "node_modules", name, "package.json"), "utf8"));
  if (installed.version !== version) throw new Error(`Curv OCR: ${name}@${version} required; found ${installed.version}. Update the reviewed asset manifest explicitly before changing engines.`);
}

let totalBytes = 0;
for (const file of manifest.files) {
  const destination = path.join(publicRoot, file.path);
  const source = file.package ? path.join(root, "node_modules", file.package, file.packagePath) : destination;
  const bytes = await readFile(source);
  if (bytes.length !== file.bytes || digest(bytes) !== file.sha256) throw new Error(`Curv OCR asset integrity check failed: ${file.path}`);
  if (source !== destination) {
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(source, destination);
  }
  totalBytes += bytes.length;
}
console.log(`Curv OCR: ${manifest.files.length} local assets verified (${(totalBytes / 1_000_000).toFixed(1)} MB).`);
