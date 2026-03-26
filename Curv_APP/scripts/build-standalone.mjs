import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const distIndexPath = path.join(distDir, "index.html");
const outputPath = path.join(rootDir, "standalone.html");

const MIME_TYPES = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",
};

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toWebPath = (absolutePath) => (
  `/${path.relative(distDir, absolutePath).split(path.sep).join("/")}`
);

const isLocalRef = (value) => (
  value.startsWith("/") || value.startsWith("./") || value.startsWith("../")
);

const resolveDistRef = (ref) => {
  const cleanRef = ref.split("?")[0].split("#")[0];
  if (cleanRef.startsWith("/")) return path.join(distDir, cleanRef.slice(1));
  return path.resolve(distDir, cleanRef);
};

const toDataUri = (buffer, absolutePath) => {
  const ext = path.extname(absolutePath).toLowerCase();
  const mime = MIME_TYPES[ext] || "application/octet-stream";
  return `data:${mime};base64,${buffer.toString("base64")}`;
};

const collectFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(abs));
    else files.push(abs);
  }
  return files;
};

const sanitizeInlineScript = (code) => (
  code
    .replace(/<script/gi, "<\\script")
    .replace(/<\/script/gi, "<\\/script")
    .replace(/<!--/g, "<\\!--")
);

const sanitizeInlineStyle = (code) => (
  code.replace(/<\/style/gi, "<\\/style")
);

const embedRefsInText = async (text, fileMap, includeCodeAssets = false) => {
  let out = text;
  for (const [webPath, absPath] of fileMap) {
    const ext = path.extname(absPath).toLowerCase();
    if (ext === ".html") continue;
    if (!includeCodeAssets && (ext === ".js" || ext === ".css")) continue;
    const dataUri = toDataUri(await fs.readFile(absPath), absPath);
    out = out.replace(new RegExp(escapeRegExp(webPath), "g"), dataUri);
  }
  return out;
};

const inlineStylesheets = async (html, fileMap) => {
  const stylesheetRegex = /<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  const matches = [...html.matchAll(stylesheetRegex)];
  let out = html;

  for (const match of matches) {
    const [tag, href] = match;
    if (!isLocalRef(href)) continue;
    const abs = resolveDistRef(href);
    const cssRaw = await fs.readFile(abs, "utf8");
    const css = await embedRefsInText(cssRaw, fileMap, false);
    out = out.replace(tag, `<style>\n${sanitizeInlineStyle(css)}\n</style>`);
  }
  return out;
};

const inlineScripts = async (html, fileMap) => {
  const scriptRegex = /<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi;
  const matches = [...html.matchAll(scriptRegex)];
  let out = html;

  for (const match of matches) {
    const [tag, beforeAttr, src, afterAttr] = match;
    if (!isLocalRef(src)) continue;
    const abs = resolveDistRef(src);
    const jsRaw = await fs.readFile(abs, "utf8");
    const js = await embedRefsInText(jsRaw, fileMap, true);
    const attrs = `${beforeAttr} ${afterAttr}`;
    const typeMatch = attrs.match(/\btype=["']([^"']+)["']/i);
    const type = typeMatch?.[1] || "module";
    const jsData = `data:text/javascript;base64,${Buffer.from(js, "utf8").toString("base64")}`;
    out = out.replace(tag, `<script type="${type}">import "${jsData}";</script>`);
  }
  return out;
};

const removeModulePreloads = (html) => (
  html.replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*>/gi, "")
);

const embedBinaryRefs = async (html, fileMap) => {
  let out = html;

  for (const [webPath, absPath] of fileMap) {
    const ext = path.extname(absPath).toLowerCase();
    if (ext === ".html") continue;
    const dataUri = toDataUri(await fs.readFile(absPath), absPath);
    out = out.replace(new RegExp(escapeRegExp(webPath), "g"), dataUri);
  }

  return out;
};

const removeLeftoverLocalLinks = (html) => (
  html
    .replace(/<link\b[^>]*href=["']\/[^"']+["'][^>]*>/gi, (tag) => {
      if (/rel=["']icon["']/i.test(tag)) return "";
      return tag;
    })
);

const main = async () => {
  try {
    await fs.access(distIndexPath);
  } catch {
    throw new Error("No se encontró dist/index.html. Ejecuta primero `npm run build`.");
  }

  let html = await fs.readFile(distIndexPath, "utf8");
  const allFiles = await collectFiles(distDir);
  const fileMap = new Map(allFiles.map((abs) => [toWebPath(abs), abs]));
  html = removeModulePreloads(html);
  html = await inlineStylesheets(html, fileMap);
  html = await inlineScripts(html, fileMap);

  html = await embedBinaryRefs(html, fileMap);
  html = removeLeftoverLocalLinks(html);

  await fs.writeFile(outputPath, html, "utf8");

  const hasInlineStyle = html.includes("<style>");
  const hasInlineModule = html.includes("<script type=\"module\">");
  const externalRefMatches = [...html.matchAll(/\/assets\/[^\s"'()<>]+|\/favicon\.svg|\/icons\.svg/gi)].map((m) => m[0]);
  const hasExternalRefs = externalRefMatches.length > 0;

  if (!hasInlineStyle || !hasInlineModule || hasExternalRefs) {
    throw new Error(
      [
        "Validación de standalone falló.",
        `- Tiene <style> inline: ${hasInlineStyle}`,
        `- Tiene <script type=\"module\"> inline: ${hasInlineModule}`,
        `- Quedan refs externas /assets|favicon|icons: ${hasExternalRefs}`,
        hasExternalRefs ? `- Ejemplos: ${[...new Set(externalRefMatches)].slice(0, 8).join(", ")}` : "",
      ].join("\n")
    );
  }

  const scriptOpenCount = (html.match(/<script\b/gi) || []).length;
  const scriptCloseCount = (html.match(/<\/script>/gi) || []).length;
  const styleOpenCount = (html.match(/<style\b/gi) || []).length;
  const styleCloseCount = (html.match(/<\/style>/gi) || []).length;

  if (scriptOpenCount !== scriptCloseCount || styleOpenCount !== styleCloseCount) {
    throw new Error(
      [
        "Validación de etiquetas inline falló.",
        `- Scripts abiertos/cerrados: ${scriptOpenCount}/${scriptCloseCount}`,
        `- Styles abiertos/cerrados: ${styleOpenCount}/${styleCloseCount}`,
      ].join("\n")
    );
  }

  console.log(`standalone.html generado en: ${outputPath}`);
  console.log("Validación OK: CSS/JS inline y sin referencias externas a /assets, /favicon.svg o /icons.svg.");
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
