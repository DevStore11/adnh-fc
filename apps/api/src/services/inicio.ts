import type { Inicio, Resultado } from "@adnh-fc/shared";
import type { LinhaJogoTerminado } from "../db/schema";
import { obterClube } from "../db/queries/clube";
import { obterGolosSofridos } from "../db/queries/golos-sofridos";
import { obterHomemDoJogo } from "../db/queries/homem-do-jogo";
import { obterMarcadores } from "../db/queries/marcadores";
import { obterOnzeInicial } from "../db/queries/onze-inicial";
import { obterProximoJogo } from "../db/queries/proximo-jogo";
import { obterSuplentes } from "../db/queries/suplentes";
import { obterUltimoJogo } from "../db/queries/ultimo-jogo";
import { obterUltimosResultados } from "../db/queries/ultimos-resultados";

const RESULTADOS_RECENTES = 5;

function resultadoDe(jogo: LinhaJogoTerminado): Resultado {
  if (jogo.golos_pro > jogo.golos_contra) return "V";
  if (jogo.golos_pro < jogo.golos_contra) return "D";
  return "E";
}

function lerPosicao(texto: string | null): { x: number; y: number } | null {
  if (!texto) return null;
  try {
    const { x, y } = JSON.parse(texto) as { x?: unknown; y?: unknown };
    return typeof x === "number" && typeof y === "number" ? { x, y } : null;
  } catch {
    return null;
  }
}

async function montarUltimoJogo(db: D1Database, jogo: LinhaJogoTerminado): Promise<Inicio["ultimoJogo"]> {
  const [onze, suplentes, golos, sofridos, homem] = await Promise.all([
    obterOnzeInicial(db, jogo.id),
    obterSuplentes(db, jogo.id),
    obterMarcadores(db, jogo.id),
    obterGolosSofridos(db, jogo.id),
    jogo.mvp_player_id === null ? null : obterHomemDoJogo(db, jogo.id, jogo.mvp_player_id),
  ]);

  const marcadores: NonNullable<Inicio["ultimoJogo"]>["marcadores"] = [];
  for (const golo of golos) {
    const existente = marcadores.find((m) => m.id === golo.player_id);
    if (existente) existente.minutos.push(golo.minuto);
    else marcadores.push({ id: golo.player_id, nome: golo.nome, minutos: [golo.minuto] });
  }

  const onzeInicial = onze.flatMap((jogador) => {
    const posicao = lerPosicao(jogador.posicao_campo);
    return posicao ? [{ id: jogador.id, nome: jogador.nome, numero: jogador.numero, ...posicao }] : [];
  });

  return {
    id: jogo.id,
    adversario: jogo.adversario,
    data: jogo.data,
    competicao: jogo.competicao,
    golosPro: jogo.golos_pro,
    golosContra: jogo.golos_contra,
    formacao: jogo.formacao,
    marcadores,
    golosSofridos: sofridos.map((s) => s.minuto),
    homemDoJogo: homem
      ? {
          id: homem.id,
          nome: homem.nome,
          numero: homem.numero,
          posicao: homem.posicao,
          fotoUrl: homem.tem_foto ? `/api/publico/jogadores/${homem.id}/foto` : null,
          golos: homem.golos,
          assistencias: homem.assistencias,
          minutosGolos: golos.filter((g) => g.player_id === homem.id).map((g) => g.minuto),
          descricao: jogo.mvp_descricao,
        }
      : null,
    onzeInicial,
    suplentes: suplentes.map((s) => ({ id: s.id, nome: s.nome })),
  };
}

export async function montarInicio(db: D1Database): Promise<Inicio | null> {
  const clube = await obterClube(db);
  if (!clube) return null;

  const [proximo, ultimo, recentes] = await Promise.all([
    obterProximoJogo(db, clube.epoca_actual),
    obterUltimoJogo(db, clube.epoca_actual),
    obterUltimosResultados(db, clube.epoca_actual, RESULTADOS_RECENTES),
  ]);

  return {
    clube: {
      nome: clube.nome,
      escudoUrl: clube.tem_escudo ? "/api/publico/clube/escudo" : null,
      corPrimaria: clube.cor_primaria,
      corSecundaria: clube.cor_secundaria,
      epocaActual: clube.epoca_actual,
    },
    proximoJogo: proximo,
    ultimoJogo: ultimo ? await montarUltimoJogo(db, ultimo) : null,
    ultimosResultados: recentes.map((jogo) => ({
      id: jogo.id,
      adversario: jogo.adversario,
      data: jogo.data,
      golosPro: jogo.golos_pro,
      golosContra: jogo.golos_contra,
      resultado: resultadoDe(jogo),
    })),
  };
}
