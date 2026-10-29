import type { LinhaClube } from "../schema";

export function obterClube(db: D1Database): Promise<LinhaClube | null> {
  return db
    .prepare(
      "SELECT nome, escudo IS NOT NULL AS tem_escudo, cor_primaria, cor_secundaria, epoca_actual FROM club WHERE id = ?",
    )
    .bind(1)
    .first<LinhaClube>();
}
