import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
import { gzipSync } from "node:zlib";

if (process.argv[2] === "--preflight") {
  if (existsSync(resolve("dist"))) {
    throw new Error("Remove the generated dist directory before measuring; its contents can change Tailwind's output.");
  }
  process.exit(0);
}

const buildDir = resolve(process.argv[2] || "dist");
const html = readFileSync(join(buildDir, "index.html"), "utf8");
const resourceTags = html.match(/<(?:script|link)\b[^>]*>/g) || [];
const initialResources = resourceTags.flatMap((tag) => {
  const isModuleScript = /\btype="module"/.test(tag);
  const isPreload = /\brel="modulepreload"/.test(tag);
  const isStylesheet = /\brel="stylesheet"/.test(tag);
  if (!isModuleScript && !isPreload && !isStylesheet) return [];
  const url = tag.match(/\b(?:src|href)="([^"]+)"/)?.[1];
  if (!url?.startsWith("./")) throw new Error(`Unexpected build resource URL: ${url}`);
  return [{ url, kind: isModuleScript ? "entry" : isPreload ? "preload" : "style" }];
});
if (!initialResources.some((resource) => resource.kind === "entry")) {
  throw new Error("No module entry script found in the build HTML.");
}

const fileSize = (file) => {
  const bytes = readFileSync(file);
  return { raw: bytes.byteLength, gzip: gzipSync(bytes).byteLength };
};
const fromBuild = (url) => {
  const file = resolve(buildDir, url);
  if (!file.startsWith(buildDir + sep)) throw new Error(`Resource escaped build directory: ${url}`);
  return file;
};
const initial = initialResources.map(({ url, kind }) => ({
  kind,
  file: url.slice(2),
  ...fileSize(fromBuild(url)),
}));

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const file = join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});
const allAssets = walk(buildDir).filter((file) => [".js", ".css"].includes(extname(file)));
const totals = (items) => items.reduce((sum, item) => ({
  raw: sum.raw + item.raw,
  gzip: sum.gzip + item.gzip,
}), { raw: 0, gzip: 0 });

console.log(JSON.stringify({
  buildDirectory: relative(process.cwd(), buildDir),
  node: process.version,
  initial,
  initialTotal: totals(initial),
  allJsCssTotal: totals(allAssets.map(fileSize)),
  allJsCssFileCount: allAssets.length,
}, null, 2));
