import { useCallback, useEffect, useState } from "react";
import { ErroApi } from "./api";

export type EstadoPedido<T> =
  | { fase: "carregando" }
  | { fase: "erro"; estadoHttp: number }
  | { fase: "pronto"; dados: T };

// Carrega dados ao montar (e sempre que `dependencias` mudam) e permite repetir ou substituir o resultado.
export function usarPedido<T>(
  carregar: (sinal: AbortSignal) => Promise<T>,
  dependencias: unknown[] = [],
): {
  estado: EstadoPedido<T>;
  recarregar: () => void;
  substituir: (dados: T) => void;
} {
  const [estado, definirEstado] = useState<EstadoPedido<T>>({ fase: "carregando" });
  const [tentativa, definirTentativa] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    definirEstado({ fase: "carregando" });
    carregar(controlador.signal).then(
      (dados) => definirEstado({ fase: "pronto", dados }),
      (erro: unknown) => {
        if (controlador.signal.aborted) return;
        definirEstado({ fase: "erro", estadoHttp: erro instanceof ErroApi ? erro.estado : 0 });
      },
    );
    return () => controlador.abort();
  }, [tentativa, ...dependencias]);

  const recarregar = useCallback(() => definirTentativa((n) => n + 1), []);
  const substituir = useCallback((dados: T) => definirEstado({ fase: "pronto", dados }), []);

  return { estado, recarregar, substituir };
}
