import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

const METODOS_SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

// Pedidos que alteram dados só passam com Origin igual ao do site e o cabeçalho X-Requested-With,
// que um formulário ou pedido entre sites não consegue enviar sem pré-verificação CORS (que não existe).
export const protegerCsrf: MiddlewareHandler = async (c, next) => {
  if (METODOS_SEGUROS.has(c.req.method)) return next();

  const origem = c.req.header("Origin");
  const url = new URL(c.req.url);
  const anfitriao = c.req.header("Host");
  const aceites = [url.origin];
  if (anfitriao) aceites.push(`${url.protocol}//${anfitriao}`);

  if (!origem || !aceites.includes(origem) || !c.req.header("X-Requested-With")) {
    throw new HTTPException(403, { message: "Pedido não autorizado" });
  }
  return next();
};
