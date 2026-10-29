import { Hono } from "hono";
import { inicioSchema } from "@adnh-fc/shared";
import { obterEscudoClube } from "../db/queries/escudo-clube";
import { obterFotoJogador } from "../db/queries/foto-jogador";
import type { Bindings } from "../db/schema";
import { limiteTaxa } from "../middleware/rate-limit";
import { CABECALHOS_IMAGEM, descodificarWebp } from "../services/fotos";
import { montarInicio } from "../services/inicio";

export const publico = new Hono<{ Bindings: Bindings }>();

publico.use("*", limiteTaxa({ max: 60, janelaMs: 60_000 }));

publico.get("/inicio", async (c) => {
  const inicio = await montarInicio(c.env.DB);
  if (!inicio) return c.json({ erro: "Sem dados" }, 404);
  c.header("Cache-Control", "public, max-age=30");
  return c.json(inicioSchema.parse(inicio));
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
