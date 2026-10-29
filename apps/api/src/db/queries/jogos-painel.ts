export type LinhaJogoPainel = {
  id: number;
  adversario: string;
  data: string;
  local: string;
  competicao: string;
  epoca: string;
  estado: "agendado" | "terminado";
  golos_pro: number | null;
  golos_contra: number | null;
  versao: number;
};

const COLUNAS = "id, adversario, data, local, competicao, epoca, estado, golos_pro, golos_contra, versao";

export async function obterEpocaActual(db: D1Database): Promise<string | null> {
  const linha = await db.prepare("SELECT epoca_actual FROM club WHERE id = ?").bind(1).first<{ epoca_actual: string }>();
  return linha?.epoca_actual ?? null;
}

export async function listarEpocas(db: D1Database): Promise<string[]> {
  const { results } = await db
    .prepare("SELECT DISTINCT epoca FROM matches ORDER BY epoca DESC")
    .all<{ epoca: string }>();
  return results.map((linha) => linha.epoca);
}

export async function listarJogosPainel(db: D1Database, epoca: string): Promise<LinhaJogoPainel[]> {
  const { results } = await db
    .prepare(`SELECT ${COLUNAS} FROM matches WHERE epoca = ? ORDER BY data, id`)
    .bind(epoca)
    .all<LinhaJogoPainel>();
  return results;
}

export function obterJogoPainel(db: D1Database, id: number): Promise<LinhaJogoPainel | null> {
  return db.prepare(`SELECT ${COLUNAS} FROM matches WHERE id = ?`).bind(id).first<LinhaJogoPainel>();
}

// Um jogo só se apaga se estiver agendado e sem convocatória, escalação ou eventos.
export async function jogoTemDados(db: D1Database, id: number): Promise<boolean> {
  const linha = await db
    .prepare(
      `SELECT (SELECT COUNT(*) FROM match_squad WHERE match_id = ?)
            + (SELECT COUNT(*) FROM match_events WHERE match_id = ?) AS total`,
    )
    .bind(id, id)
    .first<{ total: number }>();
  return (linha?.total ?? 0) > 0;
}
