import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { Papel, UtilizadorSessao } from "@adnh-fc/shared";
import { Carregando } from "../components/ui/Estados";
import { definirOuvintesSessao, obterUtilizadorActual, sair as sairNaApi } from "../lib/api";

type EstadoAuth =
  | { fase: "carregando" }
  | { fase: "anonimo" }
  | { fase: "autenticado"; utilizador: UtilizadorSessao };

type ValorAuth = {
  estado: EstadoAuth;
  iniciarSessao: (utilizador: UtilizadorSessao) => void;
  terminarSessao: () => Promise<void>;
};

const Contexto = createContext<ValorAuth | null>(null);

export function caminhoInicial(utilizador: UtilizadorSessao): string {
  if (utilizador.deveTrocarSenha) return "/trocar-senha";
  return utilizador.role === "admin" ? "/admin/gestores" : "/painel/jogos";
}

// Envolve só as rotas privadas e de acesso: as páginas públicas não pedem o estado da sessão.
export function AuthRaiz() {
  const [estado, definirEstado] = useState<EstadoAuth>({ fase: "carregando" });
  const navegar = useNavigate();

  useEffect(() => {
    const controlador = new AbortController();
    obterUtilizadorActual(controlador.signal).then(
      (utilizador) => definirEstado({ fase: "autenticado", utilizador }),
      () => {
        if (!controlador.signal.aborted) definirEstado({ fase: "anonimo" });
      },
    );
    return () => controlador.abort();
  }, []);

  useEffect(() => {
    definirOuvintesSessao({
      semSessao: () => {
        definirEstado({ fase: "anonimo" });
        navegar("/entrar", { replace: true });
      },
      trocarSenha: () => {
        definirEstado((anterior) =>
          anterior.fase === "autenticado"
            ? { fase: "autenticado", utilizador: { ...anterior.utilizador, deveTrocarSenha: true } }
            : anterior,
        );
        navegar("/trocar-senha", { replace: true });
      },
    });
    return () => definirOuvintesSessao(null);
  }, [navegar]);

  const iniciarSessao = useCallback((utilizador: UtilizadorSessao) => {
    definirEstado({ fase: "autenticado", utilizador });
  }, []);

  const terminarSessao = useCallback(async () => {
    try {
      await sairNaApi();
    } catch {
      // mesmo sem resposta, o cookie é inútil no servidor depois de expirar; limpa-se o estado local
    }
    definirEstado({ fase: "anonimo" });
    navegar("/entrar", { replace: true });
  }, [navegar]);

  const valor = useMemo(() => ({ estado, iniciarSessao, terminarSessao }), [estado, iniciarSessao, terminarSessao]);

  return (
    <Contexto.Provider value={valor}>
      <Outlet />
    </Contexto.Provider>
  );
}

export function useAuth(): ValorAuth {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useAuth fora de AuthRaiz");
  return valor;
}

type PropsGuarda = {
  papeis: Papel[];
  children: ReactNode;
};

// Protege um conjunto de rotas: sem sessão vai para /entrar, com troca de senha pendente vai para /trocar-senha,
// e com o papel errado volta à área do próprio utilizador.
export function RotaPrivada({ papeis, children }: PropsGuarda) {
  const { estado } = useAuth();
  const local = useLocation();

  if (estado.fase === "carregando") {
    return (
      <div className="contentor">
        <Carregando />
      </div>
    );
  }
  if (estado.fase === "anonimo") return <Navigate to="/entrar" replace state={{ de: local.pathname }} />;
  if (estado.utilizador.deveTrocarSenha) return <Navigate to="/trocar-senha" replace />;
  if (!papeis.includes(estado.utilizador.role)) return <Navigate to={caminhoInicial(estado.utilizador)} replace />;
  return <>{children}</>;
}
