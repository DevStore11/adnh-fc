import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // a CSP não permite fontes em data: URI
    assetsInlineLimit: 0,
  },
  server: {
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
});
