export type LinhaActividade = {
  id: number;
  data: string;
  accao: string;
  ip: string | null;
  quem: string | null;
  alvo: string | null;
};

export async function contarActividade(db: D1Database): Promise<number> {
  const linha = await db.prepare("SELECT COUNT(*) AS total FROM audit_log").first<{ total: number }>();
  return linha?.total ?? 0;
}

export async function listarActividade(db: D1Database, limite: number, desvio: number): Promise<LinhaActividade[]> {
  const resultado = await db
    .prepare(
      `SELECT a.id, a.data, a.accao, a.ip, u.nome AS quem, COALESCE(alvo.nome, jog.nome, jogo.adversario) AS alvo
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN users alvo ON a.entidade = 'utilizador' AND alvo.id = a.entidade_id
       LEFT JOIN players jog ON a.entidade = 'jogador' AND jog.id = a.entidade_id
       LEFT JOIN matches jogo ON a.entidade = 'jogo' AND jogo.id = a.entidade_id
       ORDER BY a.data DESC, a.id DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(limite, desvio)
    .all<LinhaActividade>();
  return resultado.results;
}
