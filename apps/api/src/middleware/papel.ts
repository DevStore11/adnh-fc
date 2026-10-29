import type { Papel } from "@adnh-fc/shared";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Ambiente } from "../db/schema";

// Usar depois de `sessao`. Conta desactivada nunca passa, mesmo que ainda tenha sessão.
export function exigirPapel(...papeis: Papel[]): MiddlewareHandler<Ambiente> {
  return async (c, next) => {
    const utilizador = c.get("utilizador");
    if (!utilizador?.activo || !papeis.includes(utilizador.role)) {
      throw new HTTPException(403, { message: "Sem permissão" });
    }
    return next();
  };
}
