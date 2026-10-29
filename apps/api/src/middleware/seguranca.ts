import { secureHeaders } from "hono/secure-headers";

// Respostas da API são JSON/imagens: CSP fechada. A CSP das páginas HTML está em apps/web/public/_headers.
export const seguranca = secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'none'"],
    frameAncestors: ["'none'"],
  },
  referrerPolicy: "strict-origin-when-cross-origin",
  xContentTypeOptions: "nosniff",
  xFrameOptions: "DENY",
  strictTransportSecurity: "max-age=31536000",
  permissionsPolicy: { camera: [], microphone: [], geolocation: [] },
});
