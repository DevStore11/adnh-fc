import type { MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import type { Ambiente } from "../db/schema";
import { hashSha256 } from "../lib/tokens";

export const NOME_COOKIE = "__Host-sessao";
export const DURACAO_SESSAO_MS = 8 * 60 * 60_000;
const RENOVAR_APOS_MS = 5 * 60_000;

// Com a troca de senha pendente, só estes caminhos respondem (eu serve para o front-end saber o estado).
const CAMINHOS_COM_TROCA_PENDENTE = new Set(["/api/auth/trocar-senha", "/api/auth/sair", "/api/auth/eu"]);

export function definirCookieSessao(c: Parameters<typeof setCookie>[0], token: string): void {
  setCookie(c, NOME_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: DURACAO_SESSAO_MS / 1000,
  });
}

export function limparCookieSessao(c: Parameters<typeof deleteCookie>[0]): void {
  deleteCookie(c, NOME_COOKIE, { path: "/", secure: true });
}

type LinhaSessao = {
  sessao_id: string;
  expira_em: string;
  id: number;
  nome: string;
  email: string;
  role: "admin" | "gestor";
  activo: number;
  deve_trocar_senha: number;
};

// Carrega o utilizador da sessão. Sem sessão válida, ou com conta desactivada, responde 401.
export const sessao: MiddlewareHandler<Ambiente> = async (c, next) => {
  const token = getCookie(c, NOME_COOKIE);
  if (!token) throw new HTTPException(401, { message: "Sessão inválida" });

  const sessaoId = await hashSha256(token);
  const agora = new Date();
  const linha = await c.env.DB.prepare(
    `SELECT s.id AS sessao_id, s.expira_em, u.id, u.nome, u.email, u.role, u.activo, u.deve_trocar_senha
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expira_em > ? AND u.activo = 1`,
  )
    .bind(sessaoId, agora.toISOString())
    .first<LinhaSessao>();

  if (!linha) {
    limparCookieSessao(c);
    throw new HTTPException(401, { message: "Sessão inválida" });
  }

  // Renovação por inactividade: cada pedido empurra a expiração para 8 h à frente (no máximo de 5 em 5 min).
  const faltam = Date.parse(linha.expira_em) - agora.getTime();
  if (faltam < DURACAO_SESSAO_MS - RENOVAR_APOS_MS) {
    const novaExpiracao = new Date(agora.getTime() + DURACAO_SESSAO_MS).toISOString();
    await c.env.DB.prepare("UPDATE sessions SET expira_em = ? WHERE id = ?").bind(novaExpiracao, sessaoId).run();
    definirCookieSessao(c, token);
  }

  c.set("sessaoId", sessaoId);
  c.set("utilizador", {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    role: linha.role,
    activo: linha.activo === 1,
    deveTrocarSenha: linha.deve_trocar_senha === 1,
  });

  if (linha.deve_trocar_senha === 1 && !CAMINHOS_COM_TROCA_PENDENTE.has(new URL(c.req.url).pathname)) {
    return c.json({ erro: "É necessário trocar a senha", codigo: "trocar_senha" }, 403);
  }

  return next();
};
