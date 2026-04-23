import { spawn } from "node:child_process";
import process from "node:process";

const VITE_PORT = Number(process.env.VITE_PORT || 4173);
const VITE_URL = `http://127.0.0.1:${VITE_PORT}`;
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const waitForVite = async (timeoutMs = 60_000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(VITE_URL);
      if (response.ok) return;
    } catch {
      // Ignore transient startup errors while Vite boots.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Vite dev server did not start in time (${VITE_URL}).`);
};

const killProcess = (child) => {
  if (!child || child.killed) return;
  child.kill("SIGTERM");
};

const vite = spawn(
  npmCmd,
  ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(VITE_PORT), "--strictPort"],
  { stdio: "inherit", env: process.env }
);

vite.on("exit", (code) => {
  if (code && code !== 0) {
    console.error(`Vite process exited with code ${code}.`);
  }
});

let electron;
try {
  await waitForVite();
  electron = spawn(
    npmCmd,
    ["exec", "electron", "."],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        CURV_DESKTOP_DEV_SERVER_URL: VITE_URL,
      },
    }
  );

  electron.on("exit", () => {
    killProcess(vite);
    process.exit(0);
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  killProcess(vite);
  process.exit(1);
}

process.on("SIGINT", () => {
  killProcess(electron);
  killProcess(vite);
  process.exit(0);
});

process.on("SIGTERM", () => {
  killProcess(electron);
  killProcess(vite);
  process.exit(0);
});
