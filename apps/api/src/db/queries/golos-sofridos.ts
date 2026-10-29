import type { LinhaGoloSofrido } from "../schema";

export async function obterGolosSofridos(db: D1Database, jogoId: number): Promise<LinhaGoloSofrido[]> {
  const { results } = await db
    .prepare("SELECT minuto FROM match_events WHERE match_id = ? AND tipo = ? ORDER BY minuto")
    .bind(jogoId, "golo_sofrido")
    .all<LinhaGoloSofrido>();
  return results;
}
