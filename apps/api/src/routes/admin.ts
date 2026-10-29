import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  actividadeConsultaSchema,
  actividadeSchema,
  actualizarGestorEntradaSchema,
  clubeAdminEntradaSchema,
  clubeAdminSchema,
  criarGestorEntradaSchema,
  gestorActualizadoSchema,
  gestorComSenhaSchema,
  gestoresSchema,
  LIMITE_ESCUDO_BYTES,
  type Gestor,
} from "@adnh-fc/shared";
import { contarActividade, listarActividade } from "../db/queries/actividade";
import { instrucaoGuardarClube, obterClubeAdmin } from "../db/queries/clube-admin";
import {
  instrucaoApagarSessoes,
  instrucaoInserirUtilizador,
  listarGestores,
  obterGestor,
  obterUtilizadorPorEmail,
  obterUtilizadorPorId,
  type LinhaGestor,
} from "../db/queries/utilizadores";
import type { Ambiente } from "../db/schema";
import { instrucaoAuditoria, registarAuditoria } from "../lib/auditoria";
import { mascararIp, obterIp } from "../lib/ip";
import { gerarHashSenha, gerarSenhaTemporaria } from "../lib/senha";
import { exigirPapel } from "../middleware/papel";
import { sessao } from "../middleware/sessao";
import { ehWebpValido } from "../services/fotos";

export const admin = new Hono<Ambiente>();

const TAMANHO_PAGINA = 25;

admin.use("*", sessao, exigirPapel("admin"));
admin.use("*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  await next();
});

function paraGestor(linha: LinhaGestor): Gestor {
  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    activo: linha.activo === 1,
    deveTrocarSenha: linha.deve_trocar_senha === 1,
    criadoEm: linha.criado_em,
    ultimoAcesso: linha.ultimo_acesso,
  };
}

function lerId(valor: string): number {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new HTTPException(400, { message: "Pedido inválido" });
  return id;
}

async function lerCorpo(c: { req: { json: () => Promise<unknown> } }): Promise<unknown> {
  return c.req.json().catch(() => null);
}

admin.get("/gestores", async (c) => {
  const linhas = await listarGestores(c.env.DB);
  return c.json(gestoresSchema.parse({ gestores: linhas.map(paraGestor) }));
});

admin.post("/gestores", async (c) => {
  const corpo = criarGestorEntradaSchema.safeParse(await lerCorpo(c));
  if (!corpo.success) throw new HTTPException(400, { message: "Dados inválidos" });
  const { nome, email } = corpo.data;
  const db = c.env.DB;
  const conflito = new HTTPException(409, { message: "Já existe um utilizador com este email" });

  if (await obterUtilizadorPorEmail(db, email)) throw conflito;

  const senhaTemporaria = gerarSenhaTemporaria();
  let id: number;
  try {
    const resultado = await instrucaoInserirUtilizador(db, {
      nome,
      email,
      senhaHash: await gerarHashSenha(senhaTemporaria),
      role: "gestor",
    }).run();
    id = resultado.meta.last_row_id;
  } catch (erro) {
    if (erro instanceof Error && erro.message.includes("UNIQUE")) throw conflito;
    throw erro;
  }

  await registarAuditoria(db, {
    userId: c.get("utilizador").id,
    accao: "gestor_criado",
    entidade: "utilizador",
    entidadeId: id,
    ip: obterIp(c),
  });

  const gestor = await obterGestor(db, id);
  if (!gestor) throw new Error("Gestor criado não encontrado");
  return c.json(gestorComSenhaSchema.parse({ gestor: paraGestor(gestor), senhaTemporaria }), 201);
});

admin.patch("/gestores/:id", async (c) => {
  const id = lerId(c.req.param("id"));
  const corpo = actualizarGestorEntradaSchema.safeParse(await lerCorpo(c));
  if (!corpo.success) throw new HTTPException(400, { message: "Dados inválidos" });

  const db = c.env.DB;
  const eu = c.get("utilizador");
  const ip = obterIp(c);
  const alvo = await obterUtilizadorPorId(db, id);
  if (!alvo) throw new HTTPException(404, { message: "Não encontrado" });

  let senhaTemporaria: string | undefined;

  if (corpo.data.redefinirSenha) {
    if (alvo.role !== "gestor") {
      throw new HTTPException(400, { message: "Só é possível redefinir a senha de gestores" });
    }
    senhaTemporaria = gerarSenhaTemporaria();
    await db.batch([
      db
        .prepare("UPDATE users SET senha_hash = ?, deve_trocar_senha = 1 WHERE id = ?")
        .bind(await gerarHashSenha(senhaTemporaria), id),
      instrucaoApagarSessoes(db, id),
      instrucaoAuditoria(db, { userId: eu.id, accao: "gestor_senha_redefinida", entidade: "utilizador", entidadeId: id, ip }),
    ]);
  } else if (corpo.data.activo === false) {
    if (alvo.id === eu.id) throw new HTTPException(409, { message: "Não pode desactivar a própria conta" });
    if (alvo.activo === 1) {
      // A condição fica na própria instrução, para dois pedidos em simultâneo não deixarem o sistema sem admin.
      const resultado = await db
        .prepare(
          `UPDATE users SET activo = 0 WHERE id = ?
           AND (role <> 'admin' OR (SELECT COUNT(*) FROM users WHERE role = 'admin' AND activo = 1 AND id <> ?) >= 1)`,
        )
        .bind(id, id)
        .run();
      if (resultado.meta.changes === 0) {
        throw new HTTPException(409, { message: "Não pode desactivar o último administrador" });
      }
      await db.batch([
        instrucaoApagarSessoes(db, id),
        instrucaoAuditoria(db, { userId: eu.id, accao: "gestor_desactivado", entidade: "utilizador", entidadeId: id, ip }),
      ]);
    }
  } else if (corpo.data.activo === true && alvo.activo === 0) {
    await db.batch([
      db.prepare("UPDATE users SET activo = 1 WHERE id = ?").bind(id),
      instrucaoAuditoria(db, { userId: eu.id, accao: "gestor_activado", entidade: "utilizador", entidadeId: id, ip }),
    ]);
  }

  const gestor = await obterGestor(db, id);
  if (!gestor) throw new HTTPException(404, { message: "Não encontrado" });
  return c.json(gestorActualizadoSchema.parse({ gestor: paraGestor(gestor), senhaTemporaria }));
});

function paraClubeAdmin(linha: { nome: string; escudo: string | null; cor_primaria: string; cor_secundaria: string }) {
  return clubeAdminSchema.parse({
    nome: linha.nome,
    corPrimaria: linha.cor_primaria,
    corSecundaria: linha.cor_secundaria,
    escudo: linha.escudo,
  });
}

admin.get("/clube", async (c) => {
  const clube = await obterClubeAdmin(c.env.DB);
  if (!clube) throw new HTTPException(404, { message: "Clube ainda não configurado" });
  return c.json(paraClubeAdmin(clube));
});

admin.put("/clube", async (c) => {
  const corpo = clubeAdminEntradaSchema.safeParse(await lerCorpo(c));
  if (!corpo.success) throw new HTTPException(400, { message: "Dados inválidos" });
  const { nome, corPrimaria, corSecundaria, escudo } = corpo.data;
  const db = c.env.DB;

  if (typeof escudo === "string" && !ehWebpValido(escudo, LIMITE_ESCUDO_BYTES)) {
    throw new HTTPException(400, { message: "O escudo tem de ser uma imagem WebP até 100 KB" });
  }

  const actual = await obterClubeAdmin(db);
  const escudoFinal = escudo === undefined ? (actual?.escudo ?? null) : escudo;

  await db.batch([
    instrucaoGuardarClube(db, { nome, escudo: escudoFinal, corPrimaria, corSecundaria }),
    instrucaoAuditoria(db, { userId: c.get("utilizador").id, accao: "clube_actualizado", entidade: "clube", ip: obterIp(c) }),
  ]);

  return c.json(
    paraClubeAdmin({ nome, escudo: escudoFinal, cor_primaria: corPrimaria, cor_secundaria: corSecundaria }),
  );
});

admin.get("/actividade", async (c) => {
  const consulta = actividadeConsultaSchema.safeParse({ pagina: c.req.query("pagina") });
  if (!consulta.success) throw new HTTPException(400, { message: "Pedido inválido" });

  const db = c.env.DB;
  const total = await contarActividade(db);
  const totalPaginas = Math.max(1, Math.ceil(total / TAMANHO_PAGINA));
  const pagina = Math.min(Number(consulta.data.pagina ?? 1), totalPaginas);
  const linhas = await listarActividade(db, TAMANHO_PAGINA, (pagina - 1) * TAMANHO_PAGINA);

  return c.json(
    actividadeSchema.parse({
      registos: linhas.map((linha) => ({ ...linha, ip: mascararIp(linha.ip) })),
      pagina,
      totalPaginas,
      total,
    }),
  );
});
