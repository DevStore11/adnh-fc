import { jogosPublicosSchema, type JogosPublicos, type Resultado } from "@adnh-fc/shared";
import { obterClube } from "../db/queries/clube";
import {
  listarCompeticoes,
  listarEpocas,
  listarJogosPublicos,
  type FiltrosJogos,
} from "../db/queries/publico-jogos";

export function resultadoDoJogo(golosPro: number, golosContra: number): Resultado {
  if (golosPro > golosContra) return "V";
  if (golosPro < golosContra) return "D";
  return "E";
}

// A época actual aparece sempre na lista, mesmo antes do primeiro jogo.
export async function juntarEpocaActual(db: D1Database, actual: string): Promise<string[]> {
  const epocas = await listarEpocas(db);
  return epocas.includes(actual) ? epocas : [actual, ...epocas];
}

export async function montarJogosPublicos(
  db: D1Database,
  epocaPedida: string | undefined,
  filtros: FiltrosJogos,
): Promise<JogosPublicos | null> {
  const clube = await obterClube(db);
  if (!clube) return null;
  const epoca = epocaPedida ?? clube.epoca_actual;
  const [epocas, competicoes, jogos] = await Promise.all([
    juntarEpocaActual(db, clube.epoca_actual),
    listarCompeticoes(db, epoca),
    listarJogosPublicos(db, epoca, filtros),
  ]);

  return jogosPublicosSchema.parse({
    epoca,
    epocas,
    competicoes,
    jogos: jogos.map((jogo) => {
      const terminado = jogo.estado === "terminado" && jogo.golos_pro !== null && jogo.golos_contra !== null;
      return {
        id: jogo.id,
        adversario: jogo.adversario,
        data: jogo.data,
        local: jogo.local,
        competicao: jogo.competicao,
        estado: jogo.estado,
        golosPro: terminado ? jogo.golos_pro : null,
        golosContra: terminado ? jogo.golos_contra : null,
        resultado: terminado ? resultadoDoJogo(jogo.golos_pro as number, jogo.golos_contra as number) : null,
      };
    }),
  });
}
