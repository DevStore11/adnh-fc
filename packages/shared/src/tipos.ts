import type { z } from "zod";
import type { ACCOES_AUDITORIA, ESTADOS_JOGADOR, FORMACOES, PAPEIS, POSICOES, TIPOS_EVENTO } from "./constantes";
import type {
  actividadeSchema,
  conflitoDetalheSchema,
  conflitoJogoSchema,
  convocatoriaEntradaSchema,
  escalacaoEntradaSchema,
  eventoEntradaSchema,
  jogoDetalheSchema,
  resultadoEntradaSchema,
  jogadorActualizarSchema,
  jogadorEntradaSchema,
  jogadorPainelSchema,
  jogadoresPainelSchema,
  jogoActualizarSchema,
  jogoEntradaSchema,
  jogoPainelSchema,
  jogoPublicoSchema,
  jogoListaPublicoSchema,
  jogosPublicosSchema,
  jogadorPerfilSchema,
  estatisticasSchema,
  jogosPainelSchema,
  actualizarGestorEntradaSchema,
  clubeAdminEntradaSchema,
  clubeAdminSchema,
  clubePublicoSchema,
  criarGestorEntradaSchema,
  entrarEntradaSchema,
  gestorActualizadoSchema,
  gestorComSenhaSchema,
  gestorSchema,
  gestoresSchema,
  registoActividadeSchema,
  trocarSenhaEntradaSchema,
  utilizadorSessaoSchema,
  homemDoJogoSchema,
  inicioSchema,
  jogadorNoCampoSchema,
  jogadorPlantelSchema,
  plantelSchema,
  proximoJogoSchema,
  resultadoRecenteSchema,
  resultadoSchema,
  ultimoJogoSchema,
} from "./schemas";

export type Posicao = (typeof POSICOES)[number];
export type Formacao = (typeof FORMACOES)[number];
export type EstadoJogador = (typeof ESTADOS_JOGADOR)[number];
export type Papel = (typeof PAPEIS)[number];
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export type Resultado = z.infer<typeof resultadoSchema>;
export type ClubePublico = z.infer<typeof clubePublicoSchema>;
export type ProximoJogo = z.infer<typeof proximoJogoSchema>;
export type HomemDoJogo = z.infer<typeof homemDoJogoSchema>;
export type JogadorNoCampo = z.infer<typeof jogadorNoCampoSchema>;
export type UltimoJogo = z.infer<typeof ultimoJogoSchema>;
export type ResultadoRecente = z.infer<typeof resultadoRecenteSchema>;
export type Inicio = z.infer<typeof inicioSchema>;
export type JogadorPlantel = z.infer<typeof jogadorPlantelSchema>;
export type Plantel = z.infer<typeof plantelSchema>;

export type UtilizadorSessao = z.infer<typeof utilizadorSessaoSchema>;
export type EntrarEntrada = z.infer<typeof entrarEntradaSchema>;
export type TrocarSenhaEntrada = z.infer<typeof trocarSenhaEntradaSchema>;
export type Gestor = z.infer<typeof gestorSchema>;
export type Gestores = z.infer<typeof gestoresSchema>;
export type CriarGestorEntrada = z.infer<typeof criarGestorEntradaSchema>;
export type ActualizarGestorEntrada = z.infer<typeof actualizarGestorEntradaSchema>;
export type GestorComSenha = z.infer<typeof gestorComSenhaSchema>;
export type GestorActualizado = z.infer<typeof gestorActualizadoSchema>;
export type ClubeAdmin = z.infer<typeof clubeAdminSchema>;
export type ClubeAdminEntrada = z.infer<typeof clubeAdminEntradaSchema>;
export type AccaoAuditoria = (typeof ACCOES_AUDITORIA)[number];
export type RegistoActividade = z.infer<typeof registoActividadeSchema>;
export type Actividade = z.infer<typeof actividadeSchema>;

export type JogadorPainel = z.infer<typeof jogadorPainelSchema>;
export type JogadoresPainel = z.infer<typeof jogadoresPainelSchema>;
export type JogadorEntrada = z.infer<typeof jogadorEntradaSchema>;
export type JogadorActualizar = z.infer<typeof jogadorActualizarSchema>;
export type JogoPainel = z.infer<typeof jogoPainelSchema>;
export type JogosPainel = z.infer<typeof jogosPainelSchema>;
export type JogoEntrada = z.infer<typeof jogoEntradaSchema>;
export type JogoActualizar = z.infer<typeof jogoActualizarSchema>;
export type ConflitoJogo = z.infer<typeof conflitoJogoSchema>;

export type JogoDetalhe = z.infer<typeof jogoDetalheSchema>;
export type JogadorDoJogo = JogoDetalhe["jogadores"][number];
export type EventoJogo = JogoDetalhe["eventos"][number];
export type ConflitoDetalhe = z.infer<typeof conflitoDetalheSchema>;
export type ConvocatoriaEntrada = z.infer<typeof convocatoriaEntradaSchema>;
export type EscalacaoEntrada = z.infer<typeof escalacaoEntradaSchema>;
export type ResultadoEntrada = z.infer<typeof resultadoEntradaSchema>;
export type EventoEntrada = z.infer<typeof eventoEntradaSchema>;

export type JogoPublico = z.infer<typeof jogoPublicoSchema>;
export type JogoListaPublico = z.infer<typeof jogoListaPublicoSchema>;
export type JogosPublicos = z.infer<typeof jogosPublicosSchema>;
export type JogadorPerfil = z.infer<typeof jogadorPerfilSchema>;
export type Estatisticas = z.infer<typeof estatisticasSchema>;
export type JogadorPublico = NonNullable<JogoPublico["convocados"]>[number];

// TODO: tipos de domínio restantes
