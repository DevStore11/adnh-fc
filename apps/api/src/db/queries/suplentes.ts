import type { LinhaSuplente } from "../schema";

export async function obterSuplentes(db: D1Database, jogoId: number): Promise<LinhaSuplente[]> {
  const { results } = await db
    .prepare(
      "SELECT p.id, p.nome FROM match_squad s JOIN players p ON p.id = s.player_id WHERE s.match_id = ? AND s.convocado = ? AND s.suplente = ? ORDER BY p.numero",
    )
    .bind(jogoId, 1, 1)
    .all<LinhaSuplente>();
  return results;
}
