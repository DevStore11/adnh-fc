import type { LinhaProximoJogo } from "../schema";

// Um jogo agendado cuja data já passou há mais de isto (ficou por terminar) só conta se não houver nenhum a seguir.
const TOLERANCIA_MS = 4 * 60 * 60 * 1000;

// Sem época devolve o próximo jogo de qualquer época, para um jogo novo aparecer sempre em destaque.
export function obterProximoJogo(db: D1Database, epoca: string | null): Promise<LinhaProximoJogo | null> {
  const limite = new Date(Date.now() - TOLERANCIA_MS).toISOString();
  const filtroEpoca = epoca === null ? "" : " AND epoca = ?";
  const valores = epoca === null ? ["agendado", limite] : ["agendado", epoca, limite];
  return db
    .prepare(
      `SELECT id, adversario, data, local, competicao FROM matches WHERE estado = ?${filtroEpoca} ORDER BY data < ? ASC, data ASC LIMIT 1`,
    )
    .bind(...valores)
    .first<LinhaProximoJogo>();
}
