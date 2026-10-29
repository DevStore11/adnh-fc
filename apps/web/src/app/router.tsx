import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthRaiz } from "./AuthContexto";
import PublicoLayout from "./layouts/PublicoLayout";
import PainelLayout from "./layouts/PainelLayout";
import AdminLayout from "./layouts/AdminLayout";
import Home from "../pages/public/Home";
import Jogadores from "../pages/public/Jogadores";
import Jogador from "../pages/public/Jogador";
import Jogos from "../pages/public/Jogos";
import Jogo from "../pages/public/Jogo";
import Estatisticas from "../pages/public/Estatisticas";
import Entrar from "../pages/auth/Entrar";
import TrocarSenha from "../pages/auth/TrocarSenha";
import PainelJogadores from "../pages/painel/Jogadores";
import PainelJogos from "../pages/painel/Jogos";
import Convocatoria from "../pages/painel/Convocatoria";
import Escalacao from "../pages/painel/Escalacao";
import Golos from "../pages/painel/Golos";
import Resultado from "../pages/painel/Resultado";
import Gestores from "../pages/admin/Gestores";
import Clube from "../pages/admin/Clube";
import Actividade from "../pages/admin/Actividade";

export const router = createBrowserRouter([
  {
    element: <PublicoLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/jogadores", element: <Jogadores /> },
      { path: "/jogadores/:id", element: <Jogador /> },
      { path: "/jogos", element: <Jogos /> },
      { path: "/jogos/:id", element: <Jogo /> },
      { path: "/estatisticas", element: <Estatisticas /> },
    ],
  },
  {
    // Só estas rotas pedem o estado da sessão ao servidor.
    element: <AuthRaiz />,
    children: [
      { path: "/entrar", element: <Entrar /> },
      { path: "/trocar-senha", element: <TrocarSenha /> },
      {
        path: "/painel",
        element: <PainelLayout />,
        children: [
          { index: true, element: <Navigate to="jogos" replace /> },
          { path: "jogadores", element: <PainelJogadores /> },
          { path: "jogos", element: <PainelJogos /> },
          { path: "jogos/:id/convocatoria", element: <Convocatoria /> },
          { path: "jogos/:id/escalacao", element: <Escalacao /> },
          { path: "jogos/:id/golos", element: <Golos /> },
          { path: "jogos/:id/resultado", element: <Resultado /> },
        ],
      },
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="gestores" replace /> },
          { path: "gestores", element: <Gestores /> },
          { path: "clube", element: <Clube /> },
          { path: "actividade", element: <Actividade /> },
        ],
      },
    ],
  },
]);
