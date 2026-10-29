import type { LinhaPlantel } from "../schema";

// Golos e assistências só de jogos terminados da época.
export async function obterPlantel(db: D1Database, epoca: string): Promise<LinhaPlantel[]> {
  const contagem =
    "SELECT COUNT(*) FROM match_events e JOIN matches m ON m.id = e.match_id WHERE e.player_id = p.id AND e.tipo = ? AND m.epoca = ? AND m.estado = ?";
  const { results } = await db
    .prepare(
      `SELECT p.id, p.nome, p.numero, p.posicao, p.foto IS NOT NULL AS tem_foto,
        (${contagem}) AS golos,
        (${contagem}) AS assistencias
       FROM players p WHERE p.activo = 1 ORDER BY p.numero`,
    )
    .bind("golo", epoca, "terminado", "assist", epoca, "terminado")
    .all<LinhaPlantel>();
  return results;
}
