import { promises as fs } from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import pngToIco from "png-to-ico";

const rootDir = process.cwd();
const svgPath = path.join(rootDir, "public", "favicon.svg");
const buildDir = path.join(rootDir, "build");
const icoPath = path.join(buildDir, "icon.ico");
const iconSizes = [16, 32, 48, 64, 128, 256];

const normalizeSvgCanvas = (svgText) => (
  svgText
    .replace(/width="[^"]+"/i, 'width="48"')
    .replace(/height="[^"]+"/i, 'height="48"')
    .replace(/viewBox="[^"]+"/i, 'viewBox="0 0 48 48"')
);

const renderPng = (svgBuffer, size) => {
  const resvg = new Resvg(svgBuffer, {
    fitTo: { mode: "width", value: size },
  });
  return resvg.render().asPng();
};

const main = async () => {
  const svgRaw = await fs.readFile(svgPath, "utf8");
  const normalizedSvgBuffer = Buffer.from(normalizeSvgCanvas(svgRaw), "utf8");
  const pngBuffers = iconSizes.map((size) => renderPng(normalizedSvgBuffer, size));
  const icoBuffer = await pngToIco(pngBuffers);
  await fs.mkdir(buildDir, { recursive: true });
  await fs.writeFile(icoPath, icoBuffer);
  console.log(`Desktop icon generated: ${icoPath}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
