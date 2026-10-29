export async function obterFotoJogador(db: D1Database, jogadorId: number): Promise<string | null> {
  const linha = await db
    .prepare("SELECT foto FROM players WHERE id = ?")
    .bind(jogadorId)
    .first<{ foto: string | null }>();
  return linha?.foto ?? null;
}
