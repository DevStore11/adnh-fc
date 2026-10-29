import type { Posicao } from "@adnh-fc/shared";

export type LinhaJogoLista = {
  id: number;
  adversario: string;
  data: string;
  local: string;
  competicao: string;
  estado: "agendado" | "terminado";
  golos_pro: number | null;
  golos_contra: number | null;
};

export type FiltrosJogos = { competicao?: string; estado?: "agendado" | "terminado" };

export async function listarJogosPublicos(db: D1Database, epoca: string, filtros: FiltrosJogos): Promise<LinhaJogoLista[]> {
  const condicoes = ["epoca = ?"];
  const valores: (string | number)[] = [epoca];
  if (filtros.competicao) {
    condicoes.push("competicao = ?");
    valores.push(filtros.competicao);
  }
  if (filtros.estado) {
    condicoes.push("estado = ?");
    valores.push(filtros.estado);
  }
  const { results } = await db
    .prepare(
      `SELECT id, adversario, data, local, competicao, estado, golos_pro, golos_contra
       FROM matches WHERE ${condicoes.join(" AND ")} ORDER BY data DESC`,
    )
    .bind(...valores)
    .all<LinhaJogoLista>();
  return results;
}

export async function listarEpocas(db: D1Database): Promise<string[]> {
  const { results } = await db
    .prepare("SELECT DISTINCT epoca FROM matches ORDER BY epoca DESC")
    .all<{ epoca: string }>();
  return results.map((linha) => linha.epoca);
}

export async function listarCompeticoes(db: D1Database, epoca: string): Promise<string[]> {
  const { results } = await db
    .prepare("SELECT DISTINCT competicao FROM matches WHERE epoca = ? ORDER BY competicao")
    .bind(epoca)
    .all<{ competicao: string }>();
  return results.map((linha) => linha.competicao);
}

export type LinhaEventoPublico = {
  tipo: "golo" | "assist" | "amarelo" | "vermelho" | "golo_sofrido";
  minuto: number;
  nome: string | null;
};

export async function listarEventosPublicos(db: D1Database, jogoId: number): Promise<LinhaEventoPublico[]> {
  const { results } = await db
    .prepare(
      `SELECT e.tipo, e.minuto, p.nome
       FROM match_events e LEFT JOIN players p ON p.id = e.player_id
       WHERE e.match_id = ? ORDER BY e.minuto, e.id`,
    )
    .bind(jogoId)
    .all<LinhaEventoPublico>();
  return results;
}

export type LinhaClassificacao = { id: number; nome: string; numero: number; posicao: Posicao; valor: number };
export type LinhaCartoes = { id: number; nome: string; numero: number; posicao: Posicao; amarelos: number; vermelhos: number };
export type LinhaResumo = {
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golos_pro: number;
  golos_contra: number;
};

const LIMITE_TABELA = 10;

export function obterResumoEpoca(db: D1Database, epoca: string): Promise<LinhaResumo | null> {
  return db
    .prepare(
      `SELECT COUNT(*) AS jogos,
        COALESCE(SUM(CASE WHEN golos_pro > golos_contra THEN 1 ELSE 0 END), 0) AS vitorias,
        COALESCE(SUM(CASE WHEN golos_pro = golos_contra THEN 1 ELSE 0 END), 0) AS empates,
        COALESCE(SUM(CASE WHEN golos_pro < golos_contra THEN 1 ELSE 0 END), 0) AS derrotas,
        COALESCE(SUM(golos_pro), 0) AS golos_pro,
        COALESCE(SUM(golos_contra), 0) AS golos_contra
       FROM matches WHERE epoca = ? AND estado = 'terminado'`,
    )
    .bind(epoca)
    .first<LinhaResumo>();
}

export async function obterForma(db: D1Database, epoca: string, limite: number): Promise<{ golos_pro: number; golos_contra: number }[]> {
  const { results } = await db
    .prepare(
      "SELECT golos_pro, golos_contra FROM matches WHERE epoca = ? AND estado = 'terminado' ORDER BY data DESC LIMIT ?",
    )
    .bind(epoca, limite)
    .all<{ golos_pro: number; golos_contra: number }>();
  return results;
}

export async function obterClassificacaoEventos(db: D1Database, epoca: string, tipo: "golo" | "assist"): Promise<LinhaClassificacao[]> {
  const { results } = await db
    .prepare(
      `SELECT p.id, p.nome, p.numero, p.posicao, COUNT(*) AS valor
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       JOIN players p ON p.id = e.player_id
       WHERE m.epoca = ? AND m.estado = 'terminado' AND e.tipo = ?
       GROUP BY p.id ORDER BY valor DESC, p.nome LIMIT ?`,
    )
    .bind(epoca, tipo, LIMITE_TABELA)
    .all<LinhaClassificacao>();
  return results;
}

export async function obterPresencas(db: D1Database, epoca: string): Promise<LinhaClassificacao[]> {
  const { results } = await db
    .prepare(
      `SELECT p.id, p.nome, p.numero, p.posicao, COUNT(*) AS valor
       FROM match_squad s
       JOIN matches m ON m.id = s.match_id
       JOIN players p ON p.id = s.player_id
       WHERE m.epoca = ? AND m.estado = 'terminado' AND s.convocado = 1
       GROUP BY p.id ORDER BY valor DESC, p.nome LIMIT ?`,
    )
    .bind(epoca, LIMITE_TABELA)
    .all<LinhaClassificacao>();
  return results;
}

export async function obterCartoes(db: D1Database, epoca: string): Promise<LinhaCartoes[]> {
  const { results } = await db
    .prepare(
      `SELECT p.id, p.nome, p.numero, p.posicao,
        SUM(CASE WHEN e.tipo = 'amarelo' THEN 1 ELSE 0 END) AS amarelos,
        SUM(CASE WHEN e.tipo = 'vermelho' THEN 1 ELSE 0 END) AS vermelhos
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       JOIN players p ON p.id = e.player_id
       WHERE m.epoca = ? AND m.estado = 'terminado' AND e.tipo IN ('amarelo', 'vermelho')
       GROUP BY p.id ORDER BY (vermelhos * 3 + amarelos) DESC, p.nome LIMIT ?`,
    )
    .bind(epoca, LIMITE_TABELA)
    .all<LinhaCartoes>();
  return results;
}
