import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Required for Electron/file:// runtime: avoids absolute /assets URLs.
  base: "./",
  plugins: [react(), tailwindcss()],
  // Include the fictitious team demo and local quotation QA only in Vercel previews.
  build: process.env.VERCEL_ENV === "preview" ? {
    rollupOptions: { input: { app: "index.html", teamAccess: "prototype/index.html", quotationQa: "tests/quotation/index.html" } },
  } : undefined,
  resolve: {
    // `@/` is what the shadcn CLI writes into generated components.
    alias: {"@": fileURLToPath(new URL("./src", import.meta.url))},
  },
  test: {
    // Cloud Functions use Node's test runner and have their own build/test command.
    exclude: ["**/node_modules/**", "**/.git/**", "functions/**"],
  },
});
