import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Required for Electron/file:// runtime: avoids absolute /assets URLs.
  base: "./",
  plugins: [react()],
  test: {
    // Cloud Functions use Node's test runner and have their own build/test command.
    exclude: ["**/node_modules/**", "**/.git/**", "functions/**"],
  },
});
