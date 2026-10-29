import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "@fontsource/big-shoulders-display/latin-800";
import "@fontsource/big-shoulders-display/latin-900";
import "@fontsource/barlow/latin-400";
import "@fontsource/barlow/latin-600";
import { router } from "./app/router";
import "./styles/tema.css";
import "./styles/global.css";
import "./styles/componentes.css";
import "./styles/privado.css";
import "./styles/painel.css";
import "./styles/jogo.css";
import "./styles/imagens.css";
import "./styles/publico.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
