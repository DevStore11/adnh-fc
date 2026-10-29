import type { EstadoJogador, Posicao } from "@adnh-fc/shared";

export type LinhaJogadorPainel = {
  id: number;
  nome: string;
  numero: number;
  posicao: Posicao;
  estado: EstadoJogador;
  activo: number;
  foto_versao: string | null;
  golos: number;
  assistencias: number;
};

// A versão da foto (tamanho + fim do conteúdo) serve só para forçar o navegador a pedir a imagem nova.
const SELECCIONAR = `SELECT p.id, p.nome, p.numero, p.posicao, p.estado, p.activo,
  CASE WHEN p.foto IS NULL THEN NULL ELSE length(p.foto) || substr(p.foto, -12) END AS foto_versao,
  (SELECT COUNT(*) FROM match_events e JOIN matches m ON m.id = e.match_id
    WHERE e.player_id = p.id AND e.tipo = 'golo' AND m.epoca = ? AND m.estado = 'terminado') AS golos,
  (SELECT COUNT(*) FROM match_events e JOIN matches m ON m.id = e.match_id
    WHERE e.player_id = p.id AND e.tipo = 'assist' AND m.epoca = ? AND m.estado = 'terminado') AS assistencias
  FROM players p`;

export async function listarJogadoresPainel(
  db: D1Database,
  epoca: string,
  filtros: { posicao?: Posicao; estado?: EstadoJogador },
): Promise<LinhaJogadorPainel[]> {
  const condicoes: string[] = [];
  const valores: (string | number)[] = [epoca, epoca];
  if (filtros.posicao) {
    condicoes.push("p.posicao = ?");
    valores.push(filtros.posicao);
  }
  if (filtros.estado) {
    condicoes.push("p.estado = ?");
    valores.push(filtros.estado);
  }
  const onde = condicoes.length > 0 ? ` WHERE ${condicoes.join(" AND ")}` : "";
  const { results } = await db
    .prepare(`${SELECCIONAR}${onde} ORDER BY p.activo DESC, p.numero`)
    .bind(...valores)
    .all<LinhaJogadorPainel>();
  return results;
}

export function obterJogadorPainel(db: D1Database, epoca: string, id: number): Promise<LinhaJogadorPainel | null> {
  return db.prepare(`${SELECCIONAR} WHERE p.id = ?`).bind(epoca, epoca, id).first<LinhaJogadorPainel>();
}

export async function jogadorTemHistorico(db: D1Database, id: number): Promise<boolean> {
  const linha = await db
    .prepare(
      `SELECT (SELECT COUNT(*) FROM match_squad WHERE player_id = ?)
            + (SELECT COUNT(*) FROM match_events WHERE player_id = ?)
            + (SELECT COUNT(*) FROM matches WHERE mvp_player_id = ?) AS total`,
    )
    .bind(id, id, id)
    .first<{ total: number }>();
  return (linha?.total ?? 0) > 0;
}

export async function existeJogador(db: D1Database, id: number): Promise<boolean> {
  const linha = await db.prepare("SELECT id FROM players WHERE id = ?").bind(id).first();
  return linha !== null;
}
