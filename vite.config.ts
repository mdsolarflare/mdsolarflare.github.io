import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import devtools from "solid-devtools/vite";

// Unique content version per build — busts CDN/browser cache on deploy
const CONTENT_VERSION = Date.now().toString(36);

export default defineConfig({
  // Pure CSR — no SSR plugin, no prerender, no islands
  plugins: [devtools(), solidPlugin(), tailwindcss()],
  server: {
    port: 3000,
  },
  build: {
    target: "es2022",
    cssCodeSplit: false, // single CSS file for simpler CDN caching
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  define: {
    __CONTENT_VERSION: JSON.stringify(CONTENT_VERSION),
  },
});
