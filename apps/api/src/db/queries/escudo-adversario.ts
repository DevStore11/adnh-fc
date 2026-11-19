export async function obterEscudoAdversario(db: D1Database, chave: string): Promise<string | null> {
  const linha = await db
    .prepare("SELECT escudo FROM adversarios WHERE chave = ?")
    .bind(chave)
    .first<{ escudo: string }>();
  return linha?.escudo ?? null;
}

export function instrucaoGuardarEscudoAdversario(
  db: D1Database,
  chave: string,
  nome: string,
  escudo: string,
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO adversarios (chave, nome, escudo, actualizado_em) VALUES (?, ?, ?, ?)
       ON CONFLICT (chave) DO UPDATE SET nome = excluded.nome, escudo = excluded.escudo,
         actualizado_em = excluded.actualizado_em`,
    )
    .bind(chave, nome, escudo, new Date().toISOString());
}

export function instrucaoRemoverEscudoAdversario(db: D1Database, chave: string): D1PreparedStatement {
  return db.prepare("DELETE FROM adversarios WHERE chave = ?").bind(chave);
}
