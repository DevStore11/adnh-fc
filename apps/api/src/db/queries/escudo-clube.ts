export async function obterEscudoClube(db: D1Database): Promise<string | null> {
  const linha = await db
    .prepare("SELECT escudo FROM club WHERE id = ?")
    .bind(1)
    .first<{ escudo: string | null }>();
  return linha?.escudo ?? null;
}
