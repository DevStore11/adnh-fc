import { estatisticasSchema, type Estatisticas } from "@adnh-fc/shared";
import { obterClube } from "../db/queries/clube";
import {
  obterCartoes,
  obterClassificacaoEventos,
  obterForma,
  obterPresencas,
  obterResumoEpoca,
} from "../db/queries/publico-jogos";
import { juntarEpocaActual, resultadoDoJogo } from "./jogos-publicos";

const JOGOS_NA_FORMA = 5;

export async function montarEstatisticas(db: D1Database, epocaPedida: string | undefined): Promise<Estatisticas | null> {
  const clube = await obterClube(db);
  if (!clube) return null;
  const epoca = epocaPedida ?? clube.epoca_actual;

  const [epocas, resumo, forma, artilheiros, assistentes, presencas, cartoes] = await Promise.all([
    juntarEpocaActual(db, clube.epoca_actual),
    obterResumoEpoca(db, epoca),
    obterForma(db, epoca, JOGOS_NA_FORMA),
    obterClassificacaoEventos(db, epoca, "golo"),
    obterClassificacaoEventos(db, epoca, "assist"),
    obterPresencas(db, epoca),
    obterCartoes(db, epoca),
  ]);

  return estatisticasSchema.parse({
    clube: clube.nome,
    epoca,
    epocas,
    resumo: {
      jogos: resumo?.jogos ?? 0,
      vitorias: resumo?.vitorias ?? 0,
      empates: resumo?.empates ?? 0,
      derrotas: resumo?.derrotas ?? 0,
      golosPro: resumo?.golos_pro ?? 0,
      golosContra: resumo?.golos_contra ?? 0,
    },
    forma: forma.map((jogo) => resultadoDoJogo(jogo.golos_pro, jogo.golos_contra)).reverse(),
    artilheiros,
    assistentes,
    presencas,
    cartoes,
  });
}
