import type { LinhaJogoTerminado } from "../schema";

export async function obterUltimosResultados(
  db: D1Database,
  epoca: string,
  limite: number,
): Promise<LinhaJogoTerminado[]> {
  const { results } = await db
    .prepare(
      "SELECT id, adversario, data, competicao, golos_pro, golos_contra, formacao, mvp_player_id, mvp_descricao FROM matches WHERE estado = ? AND epoca = ? ORDER BY data DESC LIMIT ?",
    )
    .bind("terminado", epoca, limite)
    .all<LinhaJogoTerminado>();
  return results;
}
