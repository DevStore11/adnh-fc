import type { Papel } from "@adnh-fc/shared";
import type { LinhaUtilizador } from "../schema";

const COLUNAS = "id, nome, email, senha_hash, role, activo, deve_trocar_senha, criado_em";

export function obterUtilizadorPorEmail(db: D1Database, email: string): Promise<LinhaUtilizador | null> {
  return db.prepare(`SELECT ${COLUNAS} FROM users WHERE email = ?`).bind(email).first<LinhaUtilizador>();
}

export function obterUtilizadorPorId(db: D1Database, id: number): Promise<LinhaUtilizador | null> {
  return db.prepare(`SELECT ${COLUNAS} FROM users WHERE id = ?`).bind(id).first<LinhaUtilizador>();
}

export type LinhaGestor = {
  id: number;
  nome: string;
  email: string;
  activo: number;
  deve_trocar_senha: number;
  criado_em: string;
  ultimo_acesso: string | null;
};

const SELECCIONAR_GESTOR = `SELECT u.id, u.nome, u.email, u.activo, u.deve_trocar_senha, u.criado_em,
  (SELECT MAX(a.data) FROM audit_log a WHERE a.user_id = u.id AND a.accao = 'login') AS ultimo_acesso
  FROM users u`;

export async function listarGestores(db: D1Database): Promise<LinhaGestor[]> {
  const resultado = await db
    .prepare(`${SELECCIONAR_GESTOR} WHERE u.role = ? ORDER BY u.nome COLLATE NOCASE`)
    .bind("gestor")
    .all<LinhaGestor>();
  return resultado.results;
}

export function obterGestor(db: D1Database, id: number): Promise<LinhaGestor | null> {
  return db.prepare(`${SELECCIONAR_GESTOR} WHERE u.id = ?`).bind(id).first<LinhaGestor>();
}

export function instrucaoInserirUtilizador(
  db: D1Database,
  dados: { nome: string; email: string; senhaHash: string; role: Papel },
): D1PreparedStatement {
  return db
    .prepare(
      "INSERT INTO users (nome, email, senha_hash, role, activo, deve_trocar_senha) VALUES (?, ?, ?, ?, 1, 1)",
    )
    .bind(dados.nome, dados.email, dados.senhaHash, dados.role);
}

export function instrucaoApagarSessoes(db: D1Database, userId: number, excepto?: string): D1PreparedStatement {
  return excepto === undefined
    ? db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId)
    : db.prepare("DELETE FROM sessions WHERE user_id = ? AND id <> ?").bind(userId, excepto);
}
