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
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
        // O Worker só aceita pedidos de escrita com Origin igual ao seu próprio endereço (CSRF);
        // sem reescrever Host e Origin, o login em localhost:5173 devolve 403.
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            if (proxyReq.getHeader("origin")) proxyReq.setHeader("origin", "http://localhost:8787");
          });
        },
      },
    },
  },
});
