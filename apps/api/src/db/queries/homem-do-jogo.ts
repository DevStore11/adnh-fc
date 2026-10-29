import type { LinhaHomemDoJogo } from "../schema";

export function obterHomemDoJogo(
  db: D1Database,
  jogoId: number,
  jogadorId: number,
): Promise<LinhaHomemDoJogo | null> {
  return db
    .prepare(
      `SELECT p.id, p.nome, p.numero, p.posicao, p.foto IS NOT NULL AS tem_foto,
        (SELECT COUNT(*) FROM match_events e WHERE e.match_id = ? AND e.player_id = p.id AND e.tipo = ?) AS golos,
        (SELECT COUNT(*) FROM match_events e WHERE e.match_id = ? AND e.player_id = p.id AND e.tipo = ?) AS assistencias
       FROM players p WHERE p.id = ?`,
    )
    .bind(jogoId, "golo", jogoId, "assist", jogadorId)
    .first<LinhaHomemDoJogo>();
}
