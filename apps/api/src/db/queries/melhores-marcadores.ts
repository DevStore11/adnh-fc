import type { LinhaMelhorMarcador } from "../schema";

// Top por golos (desempate: assistências, depois nome), só jogos terminados da época e só quem marcou.
export async function obterMelhoresMarcadores(
  db: D1Database,
  epoca: string,
  limite: number,
): Promise<LinhaMelhorMarcador[]> {
  const { results } = await db
    .prepare(
      `SELECT p.id, p.nome,
        SUM(CASE WHEN e.tipo = 'golo' THEN 1 ELSE 0 END) AS golos,
        SUM(CASE WHEN e.tipo = 'assist' THEN 1 ELSE 0 END) AS assistencias
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       JOIN players p ON p.id = e.player_id
       WHERE m.epoca = ? AND m.estado = 'terminado' AND e.tipo IN ('golo', 'assist')
       GROUP BY p.id
       HAVING golos > 0
       ORDER BY golos DESC, assistencias DESC, p.nome
       LIMIT ?`,
    )
    .bind(epoca, limite)
    .all<LinhaMelhorMarcador>();
  return results;
}
