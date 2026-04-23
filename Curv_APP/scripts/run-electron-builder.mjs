import { spawn } from "node:child_process";
import path from "node:path";

const binary = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "electron-builder.cmd" : "electron-builder"
);
const args = process.argv.slice(2);
const currentNodeOptions = process.env.NODE_OPTIONS || "";
const nextNodeOptions = `${currentNodeOptions} --no-deprecation`.trim();
const systemRoot = process.env.SystemRoot || "C:\\Windows";
const system32Dir = path.join(systemRoot, "System32");
const currentPath = process.env.PATH || process.env.Path || "";
const hasSystem32 = currentPath.toLowerCase().split(";").includes(system32Dir.toLowerCase());
const nextPath = hasSystem32 ? currentPath : `${currentPath};${system32Dir}`;
const quotedArgs = args.map((arg) => `"${arg.replace(/"/g, '\\"')}"`).join(" ");
const command = `"${binary}" ${quotedArgs}`.trim();

const child = spawn(command, {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS: nextNodeOptions,
    PATH: nextPath,
    Path: nextPath,
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
