import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  fotoEntradaSchema,
  jogadorActualizarSchema,
  jogadorEntradaSchema,
  jogadoresConsultaSchema,
  jogadoresPainelSchema,
  jogadorPainelSchema,
  jogoActualizarSchema,
  jogoEntradaSchema,
  jogoPainelSchema,
  jogosConsultaSchema,
  jogosPainelSchema,
  LIMITE_FOTO_BYTES,
  type AccaoAuditoria,
} from "@adnh-fc/shared";
import {
  existeJogador,
  jogadorTemHistorico,
  listarJogadoresPainel,
  obterJogadorPainel,
  type LinhaJogadorPainel,
} from "../db/queries/jogadores-painel";
import {
  jogoTemDados,
  listarEpocas,
  listarJogosPainel,
  obterEpocaActual,
  obterJogoPainel,
  type LinhaJogoPainel,
} from "../db/queries/jogos-painel";
import type { Ambiente } from "../db/schema";
import { instrucaoAuditoria } from "../lib/auditoria";
import { obterIp } from "../lib/ip";
import { exigirPapel } from "../middleware/papel";
import { sessao } from "../middleware/sessao";
import { painelJogo } from "./painel-jogo";
import { ehWebpValido } from "../services/fotos";

export const painel = new Hono<Ambiente>();

painel.use("*", sessao, exigirPapel("admin", "gestor"));
painel.use("*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  await next();
});

function lerId(valor: string): number {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new HTTPException(400, { message: "Pedido inválido" });
  return id;
}

async function lerCorpo(c: { req: { json: () => Promise<unknown> } }): Promise<unknown> {
  return c.req.json().catch(() => null);
}

function erroUnico(erro: unknown): boolean {
  return erro instanceof Error && erro.message.includes("UNIQUE");
}

function auditar(c: Context<Ambiente>, accao: AccaoAuditoria, entidade: "jogador" | "jogo", entidadeId: number) {
  return instrucaoAuditoria(c.env.DB, { userId: c.get("utilizador").id, accao, entidade, entidadeId, ip: obterIp(c) });
}

// Gestão de um jogo (convocatória, escalação, resultado, eventos)
painel.route("/jogos", painelJogo);

// Jogadores

function paraJogador(linha: LinhaJogadorPainel) {
  return jogadorPainelSchema.parse({
    id: linha.id,
    nome: linha.nome,
    numero: linha.numero,
    posicao: linha.posicao,
    estado: linha.estado,
    activo: linha.activo === 1,
    fotoUrl: linha.foto_versao ? `/api/publico/jogadores/${linha.id}/foto?v=${encodeURIComponent(linha.foto_versao)}` : null,
    golos: linha.golos,
    assistencias: linha.assistencias,
  });
}

async function obterJogadorOu404(db: D1Database, id: number) {
  const epoca = (await obterEpocaActual(db)) ?? "";
  const linha = await obterJogadorPainel(db, epoca, id);
  if (!linha) throw new HTTPException(404, { message: "Não encontrado" });
  return paraJogador(linha);
}

const CONFLITO_NUMERO = "Já existe um jogador activo com esse número";

painel.get("/jogadores", async (c) => {
  const consulta = jogadoresConsultaSchema.safeParse({
    posicao: c.req.query("posicao"),
    estado: c.req.query("estado"),
  });
  if (!consulta.success) throw new HTTPException(400, { message: "Pedido inválido" });

  const db = c.env.DB;
  const epoca = (await obterEpocaActual(db)) ?? "";
  const linhas = await listarJogadoresPainel(db, epoca, consulta.data);
  return c.json(jogadoresPainelSchema.parse({ jogadores: linhas.map(paraJogador) }));
});

painel.post("/jogadores", async (c) => {
  const corpo = jogadorEntradaSchema.safeParse(await lerCorpo(c));
  if (!corpo.success) throw new HTTPException(400, { message: "Dados inválidos" });
  const { nome, posicao, numero, estado, activo } = corpo.data;
  const db = c.env.DB;

  let id: number;
  try {
    const resultado = await db
      .prepare("INSERT INTO players (nome, posicao, numero, estado, activo) VALUES (?, ?, ?, ?, ?)")
      .bind(nome, posicao, numero, estado, activo ? 1 : 0)
      .run();
    id = resultado.meta.last_row_id;
  } catch (erro) {
    if (erroUnico(erro)) throw new HTTPException(409, { message: CONFLITO_NUMERO });
    throw erro;
  }

  await auditar(c, "jogador_criado", "jogador", id).run();
  return c.json(await obterJogadorOu404(db, id), 201);
});

const COLUNAS_JOGADOR = { nome: "nome", posicao: "posicao", numero: "numero", estado: "estado", activo: "activo" } as const;

painel.patch("/jogadores/:id", async (c) => {
  const id = lerId(c.req.param("id"));
  const corpo = jogadorActualizarSchema.safeParse(await lerCorpo(c));
  if (!corpo.success) throw new HTTPException(400, { message: "Dados inválidos" });
  const db = c.env.DB;
  if (!(await existeJogador(db, id))) throw new HTTPException(404, { message: "Não encontrado" });

  const campos: string[] = [];
  const valores: (string | number)[] = [];
  for (const [chave, coluna] of Object.entries(COLUNAS_JOGADOR)) {
    const valor = corpo.data[chave as keyof typeof COLUNAS_JOGADOR];
    if (valor === undefined) continue;
    campos.push(`${coluna} = ?`);
    valores.push(typeof valor === "boolean" ? (valor ? 1 : 0) : valor);
  }

  try {
    await db.batch([
      db.prepare(`UPDATE players SET ${campos.join(", ")} WHERE id = ?`).bind(...valores, id),
      auditar(c, "jogador_actualizado", "jogador", id),
    ]);
  } catch (erro) {
    if (erroUnico(erro)) throw new HTTPException(409, { message: CONFLITO_NUMERO });
    throw erro;
  }
  return c.json(await obterJogadorOu404(db, id));
});

painel.delete("/jogadores/:id", async (c) => {
  const id = lerId(c.req.param("id"));
  const db = c.env.DB;
  if (!(await existeJogador(db, id))) throw new HTTPException(404, { message: "Não encontrado" });
  if (await jogadorTemHistorico(db, id)) {
    throw new HTTPException(409, {
      message: "Este jogador tem convocatórias ou eventos registados. Marque-o como inactivo em vez de o apagar.",
    });
  }
  await db.batch([db.prepare("DELETE FROM players WHERE id = ?").bind(id), auditar(c, "jogador_apagado", "jogador", id)]);
  return c.json({ ok: true });
});

painel.put("/jogadores/:id/foto", async (c) => {
  const id = lerId(c.req.param("id"));
  const corpo = fotoEntradaSchema.safeParse(await lerCorpo(c));
  if (!corpo.success || !ehWebpValido(corpo.data.foto, LIMITE_FOTO_BYTES)) {
    throw new HTTPException(400, { message: "A foto tem de ser uma imagem WebP até 100 KB" });
  }
  const db = c.env.DB;
  if (!(await existeJogador(db, id))) throw new HTTPException(404, { message: "Não encontrado" });
  await db.batch([
    db.prepare("UPDATE players SET foto = ? WHERE id = ?").bind(corpo.data.foto, id),
    auditar(c, "jogador_foto_actualizada", "jogador", id),
  ]);
  return c.json(await obterJogadorOu404(db, id));
});

painel.delete("/jogadores/:id/foto", async (c) => {
  const id = lerId(c.req.param("id"));
  const db = c.env.DB;
  if (!(await existeJogador(db, id))) throw new HTTPException(404, { message: "Não encontrado" });
  await db.batch([
    db.prepare("UPDATE players SET foto = NULL WHERE id = ?").bind(id),
    auditar(c, "jogador_foto_removida", "jogador", id),
  ]);
  return c.json(await obterJogadorOu404(db, id));
});

// Jogos

function paraJogo(linha: LinhaJogoPainel) {
  return jogoPainelSchema.parse({
    id: linha.id,
    adversario: linha.adversario,
    data: linha.data,
    local: linha.local,
    competicao: linha.competicao,
    epoca: linha.epoca,
    estado: linha.estado,
    golosPro: linha.golos_pro,
    golosContra: linha.golos_contra,
    versao: linha.versao,
  });
}

painel.get("/jogos", async (c) => {
  const consulta = jogosConsultaSchema.safeParse({ epoca: c.req.query("epoca") });
  if (!consulta.success) throw new HTTPException(400, { message: "Pedido inválido" });

  const db = c.env.DB;
  const epoca = consulta.data.epoca ?? (await obterEpocaActual(db)) ?? String(new Date().getUTCFullYear());
  const [linhas, epocas] = await Promise.all([listarJogosPainel(db, epoca), listarEpocas(db)]);
  // A época em consulta aparece sempre na lista, mesmo sem jogos.
  const todas = epocas.includes(epoca) ? epocas : [epoca, ...epocas];
  return c.json(jogosPainelSchema.parse({ epoca, epocas: todas, jogos: linhas.map(paraJogo) }));
});

painel.post("/jogos", async (c) => {
  const corpo = jogoEntradaSchema.safeParse(await lerCorpo(c));
  if (!corpo.success) throw new HTTPException(400, { message: "Dados inválidos" });
  const { adversario, data, local, competicao, epoca } = corpo.data;
  const db = c.env.DB;

  const resultado = await db
    .prepare("INSERT INTO matches (adversario, data, local, competicao, epoca) VALUES (?, ?, ?, ?, ?)")
    .bind(adversario, new Date(data).toISOString(), local, competicao, epoca)
    .run();
  const id = resultado.meta.last_row_id;

  await auditar(c, "jogo_criado", "jogo", id).run();
  const jogo = await obterJogoPainel(db, id);
  if (!jogo) throw new Error("Jogo criado não encontrado");
  return c.json(paraJogo(jogo), 201);
});

const COLUNAS_JOGO = ["adversario", "data", "local", "competicao", "epoca"] as const;

painel.patch("/jogos/:id", async (c) => {
  const id = lerId(c.req.param("id"));
  const corpo = jogoActualizarSchema.safeParse(await lerCorpo(c));
  if (!corpo.success) throw new HTTPException(400, { message: "Dados inválidos" });
  const db = c.env.DB;

  const campos: string[] = [];
  const valores: string[] = [];
  for (const coluna of COLUNAS_JOGO) {
    const valor = corpo.data[coluna];
    if (valor === undefined) continue;
    campos.push(`${coluna} = ?`);
    valores.push(coluna === "data" ? new Date(valor).toISOString() : valor);
  }

  // A condição de versão fica na própria instrução: dois gestores em simultâneo não se sobrepõem.
  const resultado = await db
    .prepare(`UPDATE matches SET ${campos.join(", ")}, versao = versao + 1 WHERE id = ? AND versao = ?`)
    .bind(...valores, id, corpo.data.versao)
    .run();

  if (resultado.meta.changes === 0) {
    const actual = await obterJogoPainel(db, id);
    if (!actual) throw new HTTPException(404, { message: "Não encontrado" });
    return c.json({ erro: "Outro gestor alterou este jogo", codigo: "versao_desactualizada", jogo: paraJogo(actual) }, 409);
  }

  await auditar(c, "jogo_actualizado", "jogo", id).run();
  const jogo = await obterJogoPainel(db, id);
  if (!jogo) throw new HTTPException(404, { message: "Não encontrado" });
  return c.json(paraJogo(jogo));
});

painel.delete("/jogos/:id", async (c) => {
  const id = lerId(c.req.param("id"));
  const db = c.env.DB;
  const jogo = await obterJogoPainel(db, id);
  if (!jogo) throw new HTTPException(404, { message: "Não encontrado" });
  if (jogo.estado !== "agendado" || (await jogoTemDados(db, id))) {
    throw new HTTPException(409, { message: "Só é possível apagar jogos agendados e sem convocatória nem eventos" });
  }
  await db.batch([
    db.prepare("DELETE FROM matches WHERE id = ? AND estado = 'agendado'").bind(id),
    auditar(c, "jogo_apagado", "jogo", id),
  ]);
  return c.json({ ok: true });
});
