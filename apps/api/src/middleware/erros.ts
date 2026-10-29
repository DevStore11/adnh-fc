import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";

// Respostas genéricas: o detalhe do erro fica só no registo do Worker.
export const tratarErro: ErrorHandler = (erro, c) => {
  if (erro instanceof HTTPException) {
    return c.json({ erro: erro.message }, erro.status);
  }
  // Só o tipo e a mensagem: nunca o pedido, os cabeçalhos ou os valores que a consulta recebeu.
  console.error("Erro interno:", erro instanceof Error ? `${erro.name}: ${erro.message}` : "desconhecido");
  return c.json({ erro: "Erro interno" }, 500);
};

export const naoEncontrado: NotFoundHandler = (c) => c.json({ erro: "Não encontrado" }, 404);
