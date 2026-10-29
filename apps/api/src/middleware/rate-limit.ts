import type { MiddlewareHandler } from "hono";

type Opcoes = { max: number; janelaMs: number };

const LIMITE_CHAVES = 5000;

// Limite leve por IP, em memória (por instância do Worker). Serve de travão básico; o login terá limite próprio.
export function limiteTaxa({ max, janelaMs }: Opcoes): MiddlewareHandler {
  const contadores = new Map<string, { total: number; expira: number }>();

  return async (c, next) => {
    const agora = Date.now();
    if (contadores.size > LIMITE_CHAVES) {
      for (const [chave, valor] of contadores) {
        if (valor.expira <= agora) contadores.delete(chave);
      }
    }

    const chave = c.req.header("CF-Connecting-IP") ?? "desconhecido";
    const actual = contadores.get(chave);
    if (!actual || actual.expira <= agora) {
      contadores.set(chave, { total: 1, expira: agora + janelaMs });
    } else if (actual.total >= max) {
      c.header("Retry-After", String(Math.ceil((actual.expira - agora) / 1000)));
      return c.json({ erro: "Demasiados pedidos" }, 429);
    } else {
      actual.total += 1;
    }

    await next();
  };
}
