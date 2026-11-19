export async function obterImagemConvocados(db: D1Database, jogoId: number): Promise<string | null> {
  const linha = await db
    .prepare("SELECT convocados FROM jogo_imagens WHERE match_id = ?")
    .bind(jogoId)
    .first<{ convocados: string }>();
  return linha?.convocados ?? null;
}

// Versão curta da imagem (tamanho e fim do conteúdo), para o endereço mudar quando a imagem muda.
export async function obterVersaoImagemConvocados(db: D1Database, jogoId: number): Promise<string | null> {
  const linha = await db
    .prepare("SELECT length(convocados) || substr(convocados, -12) AS versao FROM jogo_imagens WHERE match_id = ?")
    .bind(jogoId)
    .first<{ versao: string }>();
  return linha?.versao ?? null;
}

export function instrucaoGuardarImagemConvocados(db: D1Database, jogoId: number, imagem: string): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO jogo_imagens (match_id, convocados, actualizado_em) VALUES (?, ?, ?)
       ON CONFLICT (match_id) DO UPDATE SET convocados = excluded.convocados, actualizado_em = excluded.actualizado_em`,
    )
    .bind(jogoId, imagem, new Date().toISOString());
}

export function instrucaoRetirarImagemConvocados(db: D1Database, jogoId: number): D1PreparedStatement {
  return db.prepare("DELETE FROM jogo_imagens WHERE match_id = ?").bind(jogoId);
}
