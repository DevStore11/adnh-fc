import type { Plantel } from "@adnh-fc/shared";
import { obterClube } from "../db/queries/clube";
import { obterPlantel } from "../db/queries/plantel";
import { obterUltimoJogo } from "../db/queries/ultimo-jogo";

export async function montarPlantel(db: D1Database): Promise<Plantel | null> {
  const clube = await obterClube(db);
  if (!clube) return null;

  const [linhas, ultimoJogo] = await Promise.all([
    obterPlantel(db, clube.epoca_actual),
    obterUltimoJogo(db, clube.epoca_actual),
  ]);

  return {
    epoca: clube.epoca_actual,
    ultimoJogoData: ultimoJogo?.data ?? null,
    jogadores: linhas.map((linha) => ({
      id: linha.id,
      nome: linha.nome,
      numero: linha.numero,
      posicao: linha.posicao,
      fotoUrl: linha.tem_foto ? `/api/publico/jogadores/${linha.id}/foto` : null,
      golos: linha.golos,
      assistencias: linha.assistencias,
    })),
  };
}
