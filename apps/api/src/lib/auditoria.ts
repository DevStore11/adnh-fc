import type { AccaoAuditoria } from "@adnh-fc/shared";

export type RegistoAuditoria = {
  userId: number | null;
  accao: AccaoAuditoria;
  entidade?: string;
  entidadeId?: number;
  ip: string | null;
};

// Devolve a instrução sem a executar, para entrar no mesmo db.batch() da alteração que regista.
export function instrucaoAuditoria(db: D1Database, registo: RegistoAuditoria): D1PreparedStatement {
  return db
    .prepare("INSERT INTO audit_log (user_id, accao, entidade, entidade_id, ip) VALUES (?, ?, ?, ?, ?)")
    .bind(registo.userId, registo.accao, registo.entidade ?? null, registo.entidadeId ?? null, registo.ip);
}

export async function registarAuditoria(db: D1Database, registo: RegistoAuditoria): Promise<void> {
  await instrucaoAuditoria(db, registo).run();
}
