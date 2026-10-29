import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";

// Respostas genéricas: o detalhe do erro fica só no registo do Worker.
export const tratarErro: ErrorHandler = (erro, c) => {
  if (erro instanceof HTTPException) {
    return c.json({ erro: erro.message }, erro.status);
  }
  console.error(erro);
  return c.json({ erro: "Erro interno" }, 500);
};

export const naoEncontrado: NotFoundHandler = (c) => c.json({ erro: "Não encontrado" }, 404);
