import type { LinhaProximoJogo } from "../schema";

export function obterProximoJogo(db: D1Database, epoca: string): Promise<LinhaProximoJogo | null> {
  return db
    .prepare(
      "SELECT id, adversario, data, local, competicao FROM matches WHERE estado = ? AND epoca = ? ORDER BY data ASC LIMIT 1",
    )
    .bind("agendado", epoca)
    .first<LinhaProximoJogo>();
}
