import type { Posicao } from "@adnh-fc/shared";

export type LinhaJogadorPerfil = { id: number; nome: string; numero: number; posicao: Posicao; tem_foto: number; foto_versao: string | null };

export function obterJogadorPerfil(db: D1Database, id: number): Promise<LinhaJogadorPerfil | null> {
  return db
    .prepare(
      `SELECT id, nome, numero, posicao, foto IS NOT NULL AS tem_foto,
        CASE WHEN foto IS NULL THEN NULL ELSE length(foto) || substr(foto, -12) END AS foto_versao
       FROM players WHERE id = ?`,
    )
    .bind(id)
    .first<LinhaJogadorPerfil>();
}

export type LinhaJogoDoJogador = {
  id: number;
  adversario: string;
  data: string;
  golos_pro: number;
  golos_contra: number;
  titular: number;
  golos: number;
  assistencias: number;
  amarelos: number;
  vermelhos: number;
};

const CONTAGEM =
  "(SELECT COUNT(*) FROM match_events e WHERE e.match_id = m.id AND e.player_id = s.player_id AND e.tipo = ?)";

// Jogos terminados da época em que foi convocado, do mais recente para o mais antigo.
export async function listarJogosDoJogador(db: D1Database, jogadorId: number, epoca: string): Promise<LinhaJogoDoJogador[]> {
  const { results } = await db
    .prepare(
      `SELECT m.id, m.adversario, m.data, m.golos_pro, m.golos_contra, s.titular,
        ${CONTAGEM} AS golos, ${CONTAGEM} AS assistencias, ${CONTAGEM} AS amarelos, ${CONTAGEM} AS vermelhos
       FROM match_squad s JOIN matches m ON m.id = s.match_id
       WHERE s.player_id = ? AND s.convocado = 1 AND m.estado = 'terminado' AND m.epoca = ?
       ORDER BY m.data DESC`,
    )
    .bind("golo", "assist", "amarelo", "vermelho", jogadorId, epoca)
    .all<LinhaJogoDoJogador>();
  return results;
}

export async function contarHomemDoJogo(db: D1Database, jogadorId: number, epoca: string): Promise<number> {
  const linha = await db
    .prepare("SELECT COUNT(*) AS total FROM matches WHERE mvp_player_id = ? AND epoca = ? AND estado = 'terminado'")
    .bind(jogadorId, epoca)
    .first<{ total: number }>();
  return linha?.total ?? 0;
}
