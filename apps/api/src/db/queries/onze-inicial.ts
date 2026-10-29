import type { LinhaOnze } from "../schema";

export async function obterOnzeInicial(db: D1Database, jogoId: number): Promise<LinhaOnze[]> {
  const { results } = await db
    .prepare(
      "SELECT p.id, p.nome, p.numero, s.posicao_campo FROM match_squad s JOIN players p ON p.id = s.player_id WHERE s.match_id = ? AND s.convocado = ? AND s.titular = ? ORDER BY p.numero",
    )
    .bind(jogoId, 1, 1)
    .all<LinhaOnze>();
  return results;
}
