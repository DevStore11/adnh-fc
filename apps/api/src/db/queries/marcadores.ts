import type { LinhaMarcador } from "../schema";

export async function obterMarcadores(db: D1Database, jogoId: number): Promise<LinhaMarcador[]> {
  const { results } = await db
    .prepare(
      "SELECT e.player_id, p.nome, e.minuto FROM match_events e JOIN players p ON p.id = e.player_id WHERE e.match_id = ? AND e.tipo = ? ORDER BY e.minuto",
    )
    .bind(jogoId, "golo")
    .all<LinhaMarcador>();
  return results;
}
