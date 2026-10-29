import { inicioSchema, type Inicio } from "@adnh-fc/shared";

export class ErroApi extends Error {
  constructor(
    readonly estado: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

type Validador<T> = {
  safeParse(dados: unknown): { success: true; data: T } | { success: false };
};

async function pedir<T>(caminho: string, validador: Validador<T>, sinal?: AbortSignal): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`/api${caminho}`, { headers: { Accept: "application/json" }, signal: sinal });
  } catch (erro) {
    if (sinal?.aborted) throw erro;
    throw new ErroApi(0, "Sem ligação");
  }
  if (!resposta.ok) throw new ErroApi(resposta.status, "Pedido falhou");

  const json: unknown = await resposta.json().catch(() => null);
  const resultado = validador.safeParse(json);
  if (!resultado.success) throw new ErroApi(resposta.status, "Resposta inválida");
  return resultado.data;
}

export function obterInicio(sinal?: AbortSignal): Promise<Inicio> {
  return pedir("/publico/inicio", inicioSchema, sinal);
}
