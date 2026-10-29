export type LinhaClubeAdmin = {
  nome: string;
  escudo: string | null;
  cor_primaria: string;
  cor_secundaria: string;
};

export function obterClubeAdmin(db: D1Database): Promise<LinhaClubeAdmin | null> {
  return db
    .prepare("SELECT nome, escudo, cor_primaria, cor_secundaria FROM club WHERE id = ?")
    .bind(1)
    .first<LinhaClubeAdmin>();
}

// Se a linha do clube ainda não existir, cria-a com a época do ano actual.
export function instrucaoGuardarClube(
  db: D1Database,
  dados: { nome: string; escudo: string | null; corPrimaria: string; corSecundaria: string },
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO club (id, nome, escudo, cor_primaria, cor_secundaria, epoca_actual) VALUES (1, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET nome = excluded.nome, escudo = excluded.escudo,
         cor_primaria = excluded.cor_primaria, cor_secundaria = excluded.cor_secundaria`,
    )
    .bind(dados.nome, dados.escudo, dados.corPrimaria, dados.corSecundaria, String(new Date().getUTCFullYear()));
}
