import { useState } from "react";
import { conflitoDetalheSchema, type JogoDetalhe } from "@adnh-fc/shared";
import { ErroApi, obterJogoDetalhe } from "./api";
import { usarPedido, type EstadoPedido } from "./usar-pedido";

export type ContextoJogo = {
  detalhe: JogoDetalhe;
  aOcupar: boolean;
  erro: string | null;
  // Corre uma alteração com a versão que o gestor viu; devolve true se foi guardada.
  executar: (accao: (versao: number) => Promise<JogoDetalhe>) => Promise<boolean>;
};

export function usarJogoPainel(id: number): {
  estado: EstadoPedido<JogoDetalhe>;
  recarregar: () => void;
  conflito: JogoDetalhe | null;
  carregarActual: () => void;
  erro: string | null;
  aOcupar: boolean;
  executar: (accao: (versao: number) => Promise<JogoDetalhe>) => Promise<boolean>;
} {
  const { estado, recarregar, substituir } = usarPedido((sinal) => obterJogoDetalhe(id, sinal), [id]);
  const [conflito, definirConflito] = useState<JogoDetalhe | null>(null);
  const [erro, definirErro] = useState<string | null>(null);
  const [aOcupar, definirAOcupar] = useState(false);

  async function executar(accao: (versao: number) => Promise<JogoDetalhe>): Promise<boolean> {
    if (estado.fase !== "pronto") return false;
    definirAOcupar(true);
    definirErro(null);
    definirConflito(null);
    try {
      substituir(await accao(estado.dados.jogo.versao));
      return true;
    } catch (falha) {
      const analise = falha instanceof ErroApi && falha.estado === 409 ? conflitoDetalheSchema.safeParse(falha.corpo) : null;
      if (analise?.success) {
        definirConflito(analise.data.detalhe);
      } else {
        definirErro(
          falha instanceof ErroApi && (falha.estado === 400 || falha.estado === 409 || falha.estado === 429)
            ? falha.message
            : "Não foi possível guardar. Verifique a ligação e tente de novo.",
        );
      }
      return false;
    } finally {
      definirAOcupar(false);
    }
  }

  function carregarActual() {
    if (conflito) substituir(conflito);
    definirConflito(null);
    definirErro(null);
  }

  return { estado, recarregar, conflito, carregarActual, erro, aOcupar, executar };
}
