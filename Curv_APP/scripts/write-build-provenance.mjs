import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const readGit = (...args) => {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};

const commit = process.env.VERCEL_GIT_COMMIT_SHA
  || process.env.GITHUB_SHA
  || readGit("rev-parse", "HEAD")
  || "unknown";
const ref = process.env.VERCEL_GIT_COMMIT_REF
  || process.env.GITHUB_REF_NAME
  || readGit("branch", "--show-current")
  || "unknown";
const buildId = process.env.VERCEL_DEPLOYMENT_ID
  || process.env.GITHUB_RUN_ID
  || "local";

const provenance = {
  schemaVersion: 1,
  application: "curv-app",
  packageVersion: process.env.npm_package_version || "unknown",
  commit,
  ref,
  buildId,
  environment: process.env.VERCEL_ENV || (process.env.CI ? "ci" : "local"),
  builtAt: new Date().toISOString(),
};

const outputDir = path.resolve("dist");
await mkdir(outputDir, { recursive: true });
await writeFile(
  path.join(outputDir, "build-provenance.json"),
  `${JSON.stringify(provenance, null, 2)}\n`,
  "utf8"
);
console.log(`Build provenance: ${commit.slice(0, 12)} (${buildId})`);
