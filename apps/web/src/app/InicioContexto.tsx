import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Inicio } from "@adnh-fc/shared";
import { ErroApi, obterInicio } from "../lib/api";

type EstadoInicio =
  | { fase: "carregando" }
  | { fase: "erro"; estadoHttp: number }
  | { fase: "pronto"; dados: Inicio };

type ValorInicio = {
  estado: EstadoInicio;
  recarregar: () => void;
};

const Contexto = createContext<ValorInicio | null>(null);

export function InicioProvider({ children }: { children: ReactNode }) {
  const [estado, definirEstado] = useState<EstadoInicio>({ fase: "carregando" });
  const [tentativa, definirTentativa] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    definirEstado({ fase: "carregando" });
    obterInicio(controlador.signal).then(
      (dados) => definirEstado({ fase: "pronto", dados }),
      (erro: unknown) => {
        if (controlador.signal.aborted) return;
        definirEstado({ fase: "erro", estadoHttp: erro instanceof ErroApi ? erro.estado : 0 });
      },
    );
    return () => controlador.abort();
  }, [tentativa]);

  useEffect(() => {
    if (estado.fase !== "pronto") return;
    const { clube } = estado.dados;
    const raiz = document.documentElement.style;
    raiz.setProperty("--cor-primaria", clube.corPrimaria);
    raiz.setProperty("--cor-secundaria", clube.corSecundaria);
    document.title = clube.nome;
  }, [estado]);

  const recarregar = useCallback(() => definirTentativa((n) => n + 1), []);
  const valor = useMemo(() => ({ estado, recarregar }), [estado, recarregar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useInicio(): ValorInicio {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useInicio fora de InicioProvider");
  return valor;
}
