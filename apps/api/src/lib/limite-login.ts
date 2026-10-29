// Limite de tentativas falhadas guardado no D1, para valer entre instâncias do Worker.

export const LIMITE_POR_EMAIL = { max: 5, janelaMs: 15 * 60_000, bloqueioMs: 15 * 60_000 };
export const LIMITE_POR_IP = { max: 20, janelaMs: 15 * 60_000, bloqueioMs: 15 * 60_000 };

export type Limite = typeof LIMITE_POR_EMAIL;

type LinhaTentativa = { contagem: number; bloqueado_ate: string | null; actualizado_em: string };

// Devolve os segundos que faltam para o fim do bloqueio mais longo, ou 0 se nenhuma chave estiver bloqueada.
export async function segundosBloqueado(db: D1Database, chaves: string[]): Promise<number> {
  const agora = new Date().toISOString();
  let maximo = 0;
  for (const chave of chaves) {
    const linha = await db
      .prepare("SELECT bloqueado_ate FROM tentativas_login WHERE chave = ?")
      .bind(chave)
      .first<{ bloqueado_ate: string | null }>();
    if (linha?.bloqueado_ate && linha.bloqueado_ate > agora) {
      maximo = Math.max(maximo, Math.ceil((Date.parse(linha.bloqueado_ate) - Date.now()) / 1000));
    }
  }
  return maximo;
}

export async function registarFalha(db: D1Database, chave: string, limite: Limite): Promise<void> {
  const agora = Date.now();
  const linha = await db
    .prepare("SELECT contagem, bloqueado_ate, actualizado_em FROM tentativas_login WHERE chave = ?")
    .bind(chave)
    .first<LinhaTentativa>();

  const janelaExpirou = !linha || Date.parse(linha.actualizado_em) + limite.janelaMs <= agora;
  const contagem = janelaExpirou ? 1 : linha.contagem + 1;
  const bloqueadoAte = contagem >= limite.max ? new Date(agora + limite.bloqueioMs).toISOString() : null;

  await db
    .prepare(
      `INSERT INTO tentativas_login (chave, contagem, bloqueado_ate, actualizado_em) VALUES (?, ?, ?, ?)
       ON CONFLICT (chave) DO UPDATE SET contagem = excluded.contagem, bloqueado_ate = excluded.bloqueado_ate,
         actualizado_em = excluded.actualizado_em`,
    )
    .bind(chave, contagem, bloqueadoAte, new Date(agora).toISOString())
    .run();
}

export async function limparTentativas(db: D1Database, chave: string): Promise<void> {
  await db.prepare("DELETE FROM tentativas_login WHERE chave = ?").bind(chave).run();
}

// Apaga registos antigos (sem bloqueio activo) e sessões expiradas.
export async function limparRegistosAntigos(db: D1Database): Promise<void> {
  const agora = new Date().toISOString();
  const limite = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  await db.batch([
    db
      .prepare(
        "DELETE FROM tentativas_login WHERE actualizado_em < ? AND (bloqueado_ate IS NULL OR bloqueado_ate < ?)",
      )
      .bind(limite, agora),
    db.prepare("DELETE FROM sessions WHERE expira_em < ?").bind(agora),
  ]);
}
