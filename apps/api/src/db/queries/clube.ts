import type { LinhaClube } from "../schema";

const NOME_PROVISORIO = "Associação Desportiva Novo Horizonte";

// Se a linha do clube ainda não existir, cria-a com os valores por omissão (como a migration 0009) e devolve-a.
// O INSERT OR IGNORE é seguro contra pedidos simultâneos: quem chegar depois não altera nada.
export async function obterClube(db: D1Database): Promise<LinhaClube | null> {
  const consulta = db
    .prepare(
      "SELECT nome, escudo IS NOT NULL AS tem_escudo, cor_primaria, cor_secundaria, epoca_actual FROM club WHERE id = ?",
    )
    .bind(1);
  const existente = await consulta.first<LinhaClube>();
  if (existente) return existente;

  await db
    .prepare("INSERT OR IGNORE INTO club (id, nome, epoca_actual) VALUES (1, ?, ?)")
    .bind(NOME_PROVISORIO, String(new Date().getUTCFullYear()))
    .run();
  return consulta.first<LinhaClube>();
}
