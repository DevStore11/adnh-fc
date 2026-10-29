import type { LinhaJogoTerminado } from "../schema";

export function obterUltimoJogo(db: D1Database, epoca: string): Promise<LinhaJogoTerminado | null> {
  return db
    .prepare(
      "SELECT id, adversario, data, competicao, golos_pro, golos_contra, formacao, mvp_player_id, mvp_descricao FROM matches WHERE estado = ? AND epoca = ? ORDER BY data DESC LIMIT 1",
    )
    .bind("terminado", epoca)
    .first<LinhaJogoTerminado>();
}
