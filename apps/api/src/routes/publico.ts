import { Hono } from "hono";
import { jogosPublicosConsultaSchema, jogosPublicosSchema, estatisticasSchema, jogadorPerfilSchema, inicioSchema, plantelSchema } from "@adnh-fc/shared";
import { obterEscudoClube } from "../db/queries/escudo-clube";
import { obterFotoJogador } from "../db/queries/foto-jogador";
import type { Bindings } from "../db/schema";
import { limiteTaxa } from "../middleware/rate-limit";
import { CABECALHOS_IMAGEM, descodificarWebp } from "../services/fotos";
import { montarInicio } from "../services/inicio";
import { montarEstatisticas } from "../services/estatisticas";
import { montarJogoPublico } from "../services/jogo-publico";
import { montarJogosPublicos } from "../services/jogos-publicos";
import { montarPerfilJogador } from "../services/perfil-jogador";
import { montarPlantel } from "../services/plantel";

export const publico = new Hono<{ Bindings: Bindings }>();

publico.use("*", limiteTaxa({ max: 60, janelaMs: 60_000 }));

publico.get("/inicio", async (c) => {
  const inicio = await montarInicio(c.env.DB);
  if (!inicio) return c.json({ erro: "Sem dados" }, 404);
  c.header("Cache-Control", "public, max-age=30");
  return c.json(inicioSchema.parse(inicio));
});

publico.get("/plantel", async (c) => {
  const plantel = await montarPlantel(c.env.DB);
  if (!plantel) return c.json({ erro: "Sem dados" }, 404);
  c.header("Cache-Control", "public, max-age=60");
  return c.json(plantelSchema.parse(plantel));
});

publico.get("/jogos", async (c) => {
  const consulta = jogosPublicosConsultaSchema.safeParse(c.req.query());
  if (!consulta.success) return c.json({ erro: "Pedido inválido" }, 400);
  const { epoca, ...filtros } = consulta.data;
  const jogos = await montarJogosPublicos(c.env.DB, epoca, filtros);
  if (!jogos) return c.json({ erro: "Sem dados" }, 404);
  c.header("Cache-Control", "public, max-age=30");
  return c.json(jogosPublicosSchema.parse(jogos));
});

publico.get("/estatisticas", async (c) => {
  const consulta = jogosPublicosConsultaSchema.pick({ epoca: true }).safeParse(c.req.query());
  if (!consulta.success) return c.json({ erro: "Pedido inválido" }, 400);
  const estatisticas = await montarEstatisticas(c.env.DB, consulta.data.epoca);
  if (!estatisticas) return c.json({ erro: "Sem dados" }, 404);
  c.header("Cache-Control", "public, max-age=60");
  return c.json(estatisticasSchema.parse(estatisticas));
});

publico.get("/jogadores/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) return c.json({ erro: "Pedido inválido" }, 400);
  const perfil = await montarPerfilJogador(c.env.DB, id);
  if (!perfil) return c.json({ erro: "Não encontrado" }, 404);
  c.header("Cache-Control", "public, max-age=60");
  return c.json(jogadorPerfilSchema.parse(perfil));
});

publico.get("/jogos/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) return c.json({ erro: "Pedido inválido" }, 400);
  const jogo = await montarJogoPublico(c.env.DB, id);
  if (!jogo) return c.json({ erro: "Não encontrado" }, 404);
  c.header("Cache-Control", "public, max-age=30");
  return c.json(jogo);
});

publico.get("/clube/escudo", async (c) => {
  const escudo = await obterEscudoClube(c.env.DB);
  if (!escudo) return c.json({ erro: "Não encontrado" }, 404);
  return c.body(descodificarWebp(escudo), 200, CABECALHOS_IMAGEM);
});

publico.get("/jogadores/:id/foto", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) return c.json({ erro: "Pedido inválido" }, 400);
  const foto = await obterFotoJogador(c.env.DB, id);
  if (!foto) return c.json({ erro: "Não encontrado" }, 404);
  return c.body(descodificarWebp(foto), 200, CABECALHOS_IMAGEM);
});
