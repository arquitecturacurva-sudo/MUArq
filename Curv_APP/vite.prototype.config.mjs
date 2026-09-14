import { defineConfig, mergeConfig } from "vite";
import baseConfig from "./vite.config.js";

// Separate artifact: the production build keeps its existing single entry point.
export default mergeConfig(baseConfig, defineConfig({
  base: "/",
  publicDir: false,
  build: { outDir: "dist-team-access", rollupOptions: { input: "prototype/index.html" } },
}));
