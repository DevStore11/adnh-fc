import type { EstadoJogador, Formacao, Posicao, TipoEvento } from "@adnh-fc/shared";

export type LinhaJogoCompleto = {
  id: number;
  adversario: string;
  data: string;
  local: string;
  competicao: string;
  epoca: string;
  estado: "agendado" | "terminado";
  golos_pro: number | null;
  golos_contra: number | null;
  formacao: Formacao | null;
  mvp_player_id: number | null;
  mvp_descricao: string | null;
  convocatoria_publicada: number;
  escalacao_publicada: number;
  versao: number;
};

export type LinhaJogadorDoJogo = {
  id: number;
  nome: string;
  numero: number;
  posicao: Posicao;
  estado: EstadoJogador;
  activo: number;
  convocado: number;
  titular: number;
  suplente: number;
  posicao_campo: string | null;
  foto_versao: string | null;
};

export type LinhaEvento = {
  id: number;
  tipo: TipoEvento;
  player_id: number | null;
  minuto: number;
};

export function obterJogoCompleto(db: D1Database, id: number): Promise<LinhaJogoCompleto | null> {
  return db
    .prepare(
      `SELECT id, adversario, data, local, competicao, epoca, estado, golos_pro, golos_contra, formacao,
        mvp_player_id, mvp_descricao, convocatoria_publicada, escalacao_publicada, versao
       FROM matches WHERE id = ?`,
    )
    .bind(id)
    .first<LinhaJogoCompleto>();
}

// Jogadores activos mais os que, entretanto desactivados, ainda estão neste jogo.
export async function listarJogadoresDoJogo(db: D1Database, jogoId: number): Promise<LinhaJogadorDoJogo[]> {
  const { results } = await db
    .prepare(
      `SELECT p.id, p.nome, p.numero, p.posicao, p.estado, p.activo,
        COALESCE(s.convocado, 0) AS convocado, COALESCE(s.titular, 0) AS titular,
        COALESCE(s.suplente, 0) AS suplente, s.posicao_campo,
        CASE WHEN p.foto IS NULL THEN NULL ELSE length(p.foto) || substr(p.foto, -12) END AS foto_versao
       FROM players p
       LEFT JOIN match_squad s ON s.player_id = p.id AND s.match_id = ?
       WHERE p.activo = 1 OR s.player_id IS NOT NULL
       ORDER BY p.numero`,
    )
    .bind(jogoId)
    .all<LinhaJogadorDoJogo>();
  return results;
}

export async function listarEventos(db: D1Database, jogoId: number): Promise<LinhaEvento[]> {
  const { results } = await db
    .prepare("SELECT id, tipo, player_id, minuto FROM match_events WHERE match_id = ? ORDER BY minuto, id")
    .bind(jogoId)
    .all<LinhaEvento>();
  return results;
}

export async function obterNomeClube(db: D1Database): Promise<string> {
  const linha = await db.prepare("SELECT nome FROM club WHERE id = ?").bind(1).first<{ nome: string }>();
  return linha?.nome ?? "";
}
