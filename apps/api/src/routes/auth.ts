import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { entrarEntradaSchema, trocarSenhaEntradaSchema } from "@adnh-fc/shared";
import { instrucaoApagarSessoes, obterUtilizadorPorEmail, obterUtilizadorPorId } from "../db/queries/utilizadores";
import type { Ambiente, LinhaUtilizador } from "../db/schema";
import { instrucaoAuditoria, registarAuditoria } from "../lib/auditoria";
import { obterIp } from "../lib/ip";
import {
  LIMITE_POR_EMAIL,
  LIMITE_POR_IP,
  limparRegistosAntigos,
  registarFalha,
  segundosBloqueado,
} from "../lib/limite-login";
import { gerarHashSenha, verificarSenha } from "../lib/senha";
import { gerarToken, hashSha256 } from "../lib/tokens";
import {
  definirCookieSessao,
  DURACAO_SESSAO_MS,
  limparCookieSessao,
  NOME_COOKIE,
  sessao,
} from "../middleware/sessao";

export const auth = new Hono<Ambiente>();

const ERRO_CREDENCIAIS = "Email ou senha incorrectos";

// Hash de uma senha que ninguém conhece: gasta o mesmo tempo quando o email não existe.
let hashFalso: Promise<string> | null = null;
function obterHashFalso(): Promise<string> {
  hashFalso ??= gerarHashSenha(gerarToken());
  return hashFalso;
}

function respostaUtilizador(u: LinhaUtilizador) {
  return {
    utilizador: {
      id: u.id,
      nome: u.nome,
      email: u.email,
      role: u.role,
      deveTrocarSenha: u.deve_trocar_senha === 1,
    },
  };
}

auth.post("/entrar", async (c) => {
  const ip = obterIp(c);
  const db = c.env.DB;

  const corpo = entrarEntradaSchema.safeParse(await c.req.json().catch(() => null));
  if (!corpo.success) throw new HTTPException(401, { message: ERRO_CREDENCIAIS });
  const { email, senha } = corpo.data;

  const chaveEmail = await hashSha256(`email|${ip}|${email}`);
  const chaveIp = await hashSha256(`ip|${ip}`);

  c.executionCtx.waitUntil(limparRegistosAntigos(db).catch(() => undefined));

  const espera = await segundosBloqueado(db, [chaveEmail, chaveIp]);
  if (espera > 0) {
    c.header("Retry-After", String(espera));
    return c.json({ erro: "Demasiadas tentativas. Tente de novo mais tarde." }, 429);
  }

  const utilizador = await obterUtilizadorPorEmail(db, email);
  const correcta = await verificarSenha(senha, utilizador?.senha_hash ?? (await obterHashFalso()));

  if (!utilizador || !correcta || utilizador.activo !== 1) {
    await registarFalha(db, chaveEmail, LIMITE_POR_EMAIL);
    await registarFalha(db, chaveIp, LIMITE_POR_IP);
    if (utilizador) {
      await registarAuditoria(db, {
        userId: utilizador.id,
        accao: "login_falhou",
        entidade: "utilizador",
        entidadeId: utilizador.id,
        ip,
      });
    }
    throw new HTTPException(401, { message: ERRO_CREDENCIAIS });
  }

  const token = gerarToken();
  await db.batch([
    db
      .prepare("INSERT INTO sessions (id, user_id, expira_em, ip, user_agent) VALUES (?, ?, ?, ?, ?)")
      .bind(
        await hashSha256(token),
        utilizador.id,
        new Date(Date.now() + DURACAO_SESSAO_MS).toISOString(),
        ip,
        (c.req.header("User-Agent") ?? "").slice(0, 200),
      ),
    db.prepare("DELETE FROM tentativas_login WHERE chave = ?").bind(chaveEmail),
    instrucaoAuditoria(db, { userId: utilizador.id, accao: "login", ip }),
  ]);

  definirCookieSessao(c, token);
  c.header("Cache-Control", "no-store");
  return c.json(respostaUtilizador(utilizador));
});

// Não exige sessão válida: sair tem de funcionar sempre, mesmo com a sessão já expirada.
auth.post("/sair", async (c) => {
  const token = getCookie(c, NOME_COOKIE);
  if (token) {
    const db = c.env.DB;
    const sessaoId = await hashSha256(token);
    const linha = await db
      .prepare("SELECT user_id FROM sessions WHERE id = ?")
      .bind(sessaoId)
      .first<{ user_id: number }>();
    if (linha) {
      await db.batch([
        db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessaoId),
        instrucaoAuditoria(db, { userId: linha.user_id, accao: "logout", ip: obterIp(c) }),
      ]);
    }
  }
  limparCookieSessao(c);
  return c.json({ ok: true });
});

auth.get("/eu", sessao, (c) => {
  const { id, nome, email, role, deveTrocarSenha } = c.get("utilizador");
  c.header("Cache-Control", "no-store");
  return c.json({ utilizador: { id, nome, email, role, deveTrocarSenha } });
});

auth.post("/trocar-senha", sessao, async (c) => {
  const corpo = trocarSenhaEntradaSchema.safeParse(await c.req.json().catch(() => null));
  if (!corpo.success) {
    throw new HTTPException(400, { message: "A nova senha deve ter pelo menos 10 caracteres" });
  }
  const { senhaActual, novaSenha } = corpo.data;
  const db = c.env.DB;
  const actual = c.get("utilizador");

  const chave = await hashSha256(`troca|${actual.id}`);
  const espera = await segundosBloqueado(db, [chave]);
  if (espera > 0) {
    c.header("Retry-After", String(espera));
    return c.json({ erro: "Demasiadas tentativas. Tente de novo mais tarde." }, 429);
  }

  const linha = await obterUtilizadorPorId(db, actual.id);
  if (!linha || !(await verificarSenha(senhaActual, linha.senha_hash))) {
    await registarFalha(db, chave, LIMITE_POR_EMAIL);
    throw new HTTPException(400, { message: "Senha actual incorrecta" });
  }
  if (senhaActual === novaSenha) {
    throw new HTTPException(400, { message: "A nova senha tem de ser diferente da actual" });
  }

  // Trocar a senha termina todas as outras sessões do utilizador.
  await db.batch([
    db
      .prepare("UPDATE users SET senha_hash = ?, deve_trocar_senha = 0 WHERE id = ?")
      .bind(await gerarHashSenha(novaSenha), actual.id),
    instrucaoApagarSessoes(db, actual.id, c.get("sessaoId")),
    db.prepare("DELETE FROM tentativas_login WHERE chave = ?").bind(chave),
    instrucaoAuditoria(db, {
      userId: actual.id,
      accao: "senha_trocada",
      entidade: "utilizador",
      entidadeId: actual.id,
      ip: obterIp(c),
    }),
  ]);

  c.header("Cache-Control", "no-store");
  return c.json(respostaUtilizador({ ...linha, deve_trocar_senha: 0 }));
});
