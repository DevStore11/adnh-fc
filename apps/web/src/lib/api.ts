import {
  actividadeSchema,
  clubeAdminSchema,
  gestorActualizadoSchema,
  gestorComSenhaSchema,
  gestoresSchema,
  jogadoresPainelSchema,
  jogoDetalheSchema,
  jogadorPainelSchema,
  jogoPainelSchema,
  jogoPublicoSchema,
  jogosPublicosSchema,
  jogadorPerfilSchema,
  estatisticasSchema,
  jogosPainelSchema,
  inicioSchema,
  plantelSchema,
  sessaoRespostaSchema,
  type Actividade,
  type ActualizarGestorEntrada,
  type ClubeAdmin,
  type ClubeAdminEntrada,
  type CriarGestorEntrada,
  type EntrarEntrada,
  type GestorActualizado,
  type GestorComSenha,
  type EstadoJogador,
  type JogadorActualizar,
  type JogadorEntrada,
  type JogadorPainel,
  type ConvocatoriaEntrada,
  type EscalacaoEntrada,
  type EventoEntrada,
  type JogadoresPainel,
  type JogoDetalhe,
  type ResultadoEntrada,
  type JogoActualizar,
  type JogoEntrada,
  type JogoPainel,
  type JogoPublico,
  type JogosPublicos,
  type JogadorPerfil,
  type Estatisticas,
  type JogosPainel,
  type Posicao,
  type Gestores,
  type Inicio,
  type Plantel,
  type TrocarSenhaEntrada,
  type UtilizadorSessao,
} from "@adnh-fc/shared";

export class ErroApi extends Error {
  constructor(
    readonly estado: number,
    mensagem: string,
    readonly codigo?: string,
    readonly corpo?: unknown,
  ) {
    super(mensagem);
  }
}

type Validador<T> = {
  safeParse(dados: unknown): { success: true; data: T } | { success: false };
};

type Opcoes = {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  corpo?: unknown;
  sinal?: AbortSignal;
  // false: o 401/403 é tratado por quem chama (ex.: login com senha errada), sem redireccionar.
  tratarSessao?: boolean;
};

type Ouvintes = {
  semSessao: () => void;
  trocarSenha: () => void;
};

let ouvintes: Ouvintes | null = null;

// O contexto de autenticação regista aqui o que fazer quando a sessão acaba ou a troca de senha é exigida.
export function definirOuvintesSessao(novos: Ouvintes | null): void {
  ouvintes = novos;
}

async function pedir<T>(caminho: string, validador: Validador<T>, opcoes: Opcoes = {}): Promise<T> {
  const { metodo = "GET", corpo, sinal, tratarSessao = true } = opcoes;
  const cabecalhos: Record<string, string> = { Accept: "application/json", "X-Requested-With": "fetch" };
  if (corpo !== undefined) cabecalhos["Content-Type"] = "application/json";

  let resposta: Response;
  try {
    resposta = await fetch(`/api${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      credentials: "same-origin",
      signal: sinal,
    });
  } catch (erro) {
    if (sinal?.aborted) throw erro;
    throw new ErroApi(0, "Sem ligação");
  }

  const json: unknown = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const objecto = (json ?? {}) as { erro?: unknown; codigo?: unknown };
    const mensagem = typeof objecto.erro === "string" ? objecto.erro : "Pedido falhou";
    const codigo = typeof objecto.codigo === "string" ? objecto.codigo : undefined;
    if (tratarSessao && resposta.status === 401) ouvintes?.semSessao();
    if (tratarSessao && resposta.status === 403 && codigo === "trocar_senha") ouvintes?.trocarSenha();
    throw new ErroApi(resposta.status, mensagem, codigo, json);
  }

  const resultado = validador.safeParse(json);
  if (!resultado.success) throw new ErroApi(resposta.status, "Resposta inválida");
  return resultado.data;
}

export function obterPlantel(sinal?: AbortSignal): Promise<Plantel> {
  return pedir("/publico/plantel", plantelSchema, { sinal });
}

export function obterInicio(sinal?: AbortSignal): Promise<Inicio> {
  return pedir("/publico/inicio", inicioSchema, { sinal });
}

export function obterJogoPublico(id: number, sinal?: AbortSignal): Promise<JogoPublico> {
  return pedir(`/publico/jogos/${id}`, jogoPublicoSchema, { sinal });
}

export function obterJogosPublicos(
  filtros: { epoca?: string; competicao?: string; estado?: "agendado" | "terminado" },
  sinal?: AbortSignal,
): Promise<JogosPublicos> {
  const parametros = new URLSearchParams();
  if (filtros.epoca) parametros.set("epoca", filtros.epoca);
  if (filtros.competicao) parametros.set("competicao", filtros.competicao);
  if (filtros.estado) parametros.set("estado", filtros.estado);
  const consulta = parametros.toString();
  return pedir(`/publico/jogos${consulta ? `?${consulta}` : ""}`, jogosPublicosSchema, { sinal });
}

export function obterPerfilJogador(id: number, sinal?: AbortSignal): Promise<JogadorPerfil> {
  return pedir(`/publico/jogadores/${id}`, jogadorPerfilSchema, { sinal });
}

export function obterEstatisticas(epoca?: string, sinal?: AbortSignal): Promise<Estatisticas> {
  return pedir(`/publico/estatisticas${epoca ? `?epoca=${encodeURIComponent(epoca)}` : ""}`, estatisticasSchema, { sinal });
}

// Autenticação

export async function obterUtilizadorActual(sinal?: AbortSignal): Promise<UtilizadorSessao> {
  const resposta = await pedir("/auth/eu", sessaoRespostaSchema, { sinal, tratarSessao: false });
  return resposta.utilizador;
}

export async function entrar(dados: EntrarEntrada): Promise<UtilizadorSessao> {
  const resposta = await pedir("/auth/entrar", sessaoRespostaSchema, {
    metodo: "POST",
    corpo: dados,
    tratarSessao: false,
  });
  return resposta.utilizador;
}

const respostaOk = { safeParse: (dados: unknown) => ({ success: true as const, data: dados }) };

export async function sair(): Promise<void> {
  await pedir("/auth/sair", respostaOk, { metodo: "POST", tratarSessao: false });
}

export async function trocarSenha(dados: TrocarSenhaEntrada): Promise<UtilizadorSessao> {
  const resposta = await pedir("/auth/trocar-senha", sessaoRespostaSchema, {
    metodo: "POST",
    corpo: dados,
    tratarSessao: false,
  });
  return resposta.utilizador;
}

// Administração

export function listarGestores(sinal?: AbortSignal): Promise<Gestores> {
  return pedir("/admin/gestores", gestoresSchema, { sinal });
}

export function criarGestor(dados: CriarGestorEntrada): Promise<GestorComSenha> {
  return pedir("/admin/gestores", gestorComSenhaSchema, { metodo: "POST", corpo: dados });
}

export function actualizarGestor(id: number, dados: ActualizarGestorEntrada): Promise<GestorActualizado> {
  return pedir(`/admin/gestores/${id}`, gestorActualizadoSchema, { metodo: "PATCH", corpo: dados });
}

export function obterClubeAdmin(sinal?: AbortSignal): Promise<ClubeAdmin> {
  return pedir("/admin/clube", clubeAdminSchema, { sinal });
}

export function guardarClubeAdmin(dados: ClubeAdminEntrada): Promise<ClubeAdmin> {
  return pedir("/admin/clube", clubeAdminSchema, { metodo: "PUT", corpo: dados });
}

export function obterActividade(pagina: number, sinal?: AbortSignal): Promise<Actividade> {
  return pedir(`/admin/actividade?pagina=${pagina}`, actividadeSchema, { sinal });
}

// Painel do gestor

export function obterJogadoresPainel(
  filtros: { posicao?: Posicao; estado?: EstadoJogador },
  sinal?: AbortSignal,
): Promise<JogadoresPainel> {
  const parametros = new URLSearchParams();
  if (filtros.posicao) parametros.set("posicao", filtros.posicao);
  if (filtros.estado) parametros.set("estado", filtros.estado);
  const consulta = parametros.size > 0 ? `?${parametros}` : "";
  return pedir(`/painel/jogadores${consulta}`, jogadoresPainelSchema, { sinal });
}

export function criarJogador(dados: JogadorEntrada): Promise<JogadorPainel> {
  return pedir("/painel/jogadores", jogadorPainelSchema, { metodo: "POST", corpo: dados });
}

export function actualizarJogador(id: number, dados: JogadorActualizar): Promise<JogadorPainel> {
  return pedir(`/painel/jogadores/${id}`, jogadorPainelSchema, { metodo: "PATCH", corpo: dados });
}

export async function apagarJogador(id: number): Promise<void> {
  await pedir(`/painel/jogadores/${id}`, respostaOk, { metodo: "DELETE" });
}

export function guardarFotoJogador(id: number, foto: string): Promise<JogadorPainel> {
  return pedir(`/painel/jogadores/${id}/foto`, jogadorPainelSchema, { metodo: "PUT", corpo: { foto } });
}

export function removerFotoJogador(id: number): Promise<JogadorPainel> {
  return pedir(`/painel/jogadores/${id}/foto`, jogadorPainelSchema, { metodo: "DELETE" });
}

export function obterJogosPainel(epoca?: string, sinal?: AbortSignal): Promise<JogosPainel> {
  const consulta = epoca ? `?epoca=${encodeURIComponent(epoca)}` : "";
  return pedir(`/painel/jogos${consulta}`, jogosPainelSchema, { sinal });
}

export function criarJogo(dados: JogoEntrada): Promise<JogoPainel> {
  return pedir("/painel/jogos", jogoPainelSchema, { metodo: "POST", corpo: dados });
}

export function actualizarJogo(id: number, dados: JogoActualizar): Promise<JogoPainel> {
  return pedir(`/painel/jogos/${id}`, jogoPainelSchema, { metodo: "PATCH", corpo: dados });
}

export async function apagarJogo(id: number): Promise<void> {
  await pedir(`/painel/jogos/${id}`, respostaOk, { metodo: "DELETE" });
}

// Gestão do jogo: cada alteração leva a versão que o gestor viu e devolve o estado actual do jogo.

export function obterJogoDetalhe(id: number, sinal?: AbortSignal): Promise<JogoDetalhe> {
  return pedir(`/painel/jogos/${id}`, jogoDetalheSchema, { sinal });
}

export function guardarConvocatoria(id: number, dados: ConvocatoriaEntrada): Promise<JogoDetalhe> {
  return pedir(`/painel/jogos/${id}/convocatoria`, jogoDetalheSchema, { metodo: "PUT", corpo: dados });
}

export function guardarEscalacao(id: number, dados: EscalacaoEntrada): Promise<JogoDetalhe> {
  return pedir(`/painel/jogos/${id}/escalacao`, jogoDetalheSchema, { metodo: "PUT", corpo: dados });
}

export function guardarResultado(id: number, dados: ResultadoEntrada): Promise<JogoDetalhe> {
  return pedir(`/painel/jogos/${id}/resultado`, jogoDetalheSchema, { metodo: "PUT", corpo: dados });
}

export function registarEvento(id: number, dados: EventoEntrada): Promise<JogoDetalhe> {
  return pedir(`/painel/jogos/${id}/eventos`, jogoDetalheSchema, { metodo: "POST", corpo: dados });
}

export function apagarEvento(id: number, eventoId: number, versao: number): Promise<JogoDetalhe> {
  return pedir(`/painel/jogos/${id}/eventos/${eventoId}`, jogoDetalheSchema, { metodo: "DELETE", corpo: { versao } });
}
