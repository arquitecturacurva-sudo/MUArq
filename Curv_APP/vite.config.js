import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Required for Electron/file:// runtime: avoids absolute /assets URLs.
  base: "./",
  plugins: [react()],
});
