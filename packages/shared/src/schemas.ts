import { z } from "zod";
import {
  ACCOES_AUDITORIA,
  CONVOCADOS_MAXIMO,
  CONVOCADOS_MINIMO,
  ESTADOS_JOGADOR,
  FORMACOES,
  LIMITE_ESCUDO_BYTES,
  LIMITE_FOTO_BYTES,
  PAPEIS,
  POSICOES,
  SENHA_TAMANHO_MINIMO,
  TITULARES,
  TIPOS_EVENTO,
} from "./constantes";

export const posicaoSchema = z.enum(POSICOES);
export const tipoEventoSchema = z.enum(TIPOS_EVENTO);
export const formacaoSchema = z.enum(FORMACOES);
export const estadoJogadorSchema = z.enum(ESTADOS_JOGADOR);
export const papelSchema = z.enum(PAPEIS);
export const accaoAuditoriaSchema = z.enum(ACCOES_AUDITORIA);

const idSchema = z.number().int().positive();
const corSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const fracaoSchema = z.number().min(0).max(1);

export const resultadoSchema = z.enum(["V", "E", "D"]);

export const clubePublicoSchema = z.object({
  nome: z.string(),
  escudoUrl: z.string().nullable(),
  corPrimaria: corSchema,
  corSecundaria: corSchema,
  epocaActual: z.string(),
});

export const proximoJogoSchema = z.object({
  id: idSchema,
  adversario: z.string(),
  data: z.string().datetime(),
  local: z.string(),
  competicao: z.string(),
});

export const homemDoJogoSchema = z.object({
  id: idSchema,
  nome: z.string(),
  numero: z.number().int(),
  posicao: posicaoSchema,
  fotoUrl: z.string().nullable(),
  golos: z.number().int().nonnegative(),
  assistencias: z.number().int().nonnegative(),
  minutosGolos: z.array(z.number().int()),
  descricao: z.string().nullable(),
});

export const jogadorNoCampoSchema = z.object({
  id: idSchema,
  nome: z.string(),
  numero: z.number().int(),
  x: fracaoSchema,
  y: fracaoSchema,
});

export const ultimoJogoSchema = z.object({
  id: idSchema,
  adversario: z.string(),
  data: z.string().datetime(),
  competicao: z.string(),
  golosPro: z.number().int().nonnegative(),
  golosContra: z.number().int().nonnegative(),
  formacao: formacaoSchema.nullable(),
  marcadores: z.array(
    z.object({ id: idSchema, nome: z.string(), minutos: z.array(z.number().int()) }),
  ),
  golosSofridos: z.array(z.number().int()),
  homemDoJogo: homemDoJogoSchema.nullable(),
  onzeInicial: z.array(jogadorNoCampoSchema),
  suplentes: z.array(z.object({ id: idSchema, nome: z.string() })),
});

export const resultadoRecenteSchema = z.object({
  id: idSchema,
  adversario: z.string(),
  data: z.string().datetime(),
  golosPro: z.number().int().nonnegative(),
  golosContra: z.number().int().nonnegative(),
  resultado: resultadoSchema,
});

export const inicioSchema = z.object({
  clube: clubePublicoSchema,
  proximoJogo: proximoJogoSchema.nullable(),
  ultimoJogo: ultimoJogoSchema.nullable(),
  ultimosResultados: z.array(resultadoRecenteSchema),
});

export const jogadorPlantelSchema = z.object({
  id: idSchema,
  nome: z.string(),
  numero: z.number().int(),
  posicao: posicaoSchema,
  fotoUrl: z.string().nullable(),
  golos: z.number().int().nonnegative(),
  assistencias: z.number().int().nonnegative(),
});

export const plantelSchema = z.object({
  epoca: z.string(),
  ultimoJogoData: z.string().datetime().nullable(),
  jogadores: z.array(jogadorPlantelSchema),
});

// Autenticação e área privada
const emailSchema = z.string().trim().toLowerCase().email().max(254);
const nomeSchema = z.string().trim().min(2).max(100);
const dataSchema = z.string().datetime();

// base64 de WebP até ao limite do escudo (a verificação dos bytes RIFF/WEBP é feita na API)
const escudoBase64Schema = z
  .string()
  .max(Math.ceil((LIMITE_ESCUDO_BYTES * 4) / 3) + 4)
  .regex(/^[A-Za-z0-9+/]+={0,2}$/);

export const utilizadorSessaoSchema = z.object({
  id: idSchema,
  nome: z.string(),
  email: z.string(),
  role: papelSchema,
  deveTrocarSenha: z.boolean(),
});

export const sessaoRespostaSchema = z.object({ utilizador: utilizadorSessaoSchema });

export const entrarEntradaSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1).max(200),
});

export const trocarSenhaEntradaSchema = z.object({
  senhaActual: z.string().min(1).max(200),
  novaSenha: z.string().min(SENHA_TAMANHO_MINIMO).max(200),
});

export const gestorSchema = z.object({
  id: idSchema,
  nome: z.string(),
  email: z.string(),
  activo: z.boolean(),
  deveTrocarSenha: z.boolean(),
  criadoEm: dataSchema,
  ultimoAcesso: dataSchema.nullable(),
});

export const gestoresSchema = z.object({ gestores: z.array(gestorSchema) });

export const criarGestorEntradaSchema = z.object({
  nome: nomeSchema,
  email: emailSchema,
});

export const actualizarGestorEntradaSchema = z
  .object({
    activo: z.boolean().optional(),
    redefinirSenha: z.literal(true).optional(),
  })
  .strict()
  .refine((v) => (v.activo === undefined) !== (v.redefinirSenha === undefined), {
    message: "Indique só uma alteração",
  });

// A senha temporária só aparece nesta resposta, uma única vez.
export const gestorComSenhaSchema = z.object({
  gestor: gestorSchema,
  senhaTemporaria: z.string(),
});

export const gestorActualizadoSchema = z.object({
  gestor: gestorSchema,
  senhaTemporaria: z.string().optional(),
});

export const clubeAdminSchema = z.object({
  nome: z.string(),
  corPrimaria: corSchema,
  corSecundaria: corSchema,
  escudo: z.string().nullable(),
});

export const clubeAdminEntradaSchema = z.object({
  nome: z.string().trim().min(2).max(80),
  corPrimaria: corSchema,
  corSecundaria: corSchema,
  // ausente = manter; null = remover
  escudo: escudoBase64Schema.nullable().optional(),
});

export const actividadeConsultaSchema = z.object({
  pagina: z.string().regex(/^[1-9]\d{0,5}$/).optional(),
});

export const registoActividadeSchema = z.object({
  id: idSchema,
  data: dataSchema,
  quem: z.string().nullable(),
  accao: z.string(),
  alvo: z.string().nullable(),
  ip: z.string().nullable(),
});

export const actividadeSchema = z.object({
  registos: z.array(registoActividadeSchema),
  pagina: z.number().int().positive(),
  totalPaginas: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

// Painel do gestor
const textoCurto = z.string().trim().min(2).max(80);

export const jogadorPainelSchema = z.object({
  id: idSchema,
  nome: z.string(),
  numero: z.number().int(),
  posicao: posicaoSchema,
  estado: estadoJogadorSchema,
  activo: z.boolean(),
  fotoUrl: z.string().nullable(),
  golos: z.number().int().nonnegative(),
  assistencias: z.number().int().nonnegative(),
});

export const jogadoresPainelSchema = z.object({ jogadores: z.array(jogadorPainelSchema) });

export const jogadoresConsultaSchema = z.object({
  posicao: posicaoSchema.optional(),
  estado: estadoJogadorSchema.optional(),
});

export const jogadorEntradaSchema = z.object({
  nome: textoCurto,
  posicao: posicaoSchema,
  numero: z.number().int().min(1).max(99),
  estado: estadoJogadorSchema,
  activo: z.boolean(),
});

export const jogadorActualizarSchema = jogadorEntradaSchema
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Sem alterações" });

export const fotoEntradaSchema = z.object({
  foto: z
    .string()
    .max(Math.ceil((LIMITE_FOTO_BYTES * 4) / 3) + 4)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/),
});

const epocaSchema = z.string().trim().regex(/^\d{4}([/-]\d{2,4})?$/);

export const jogoPainelSchema = z.object({
  id: idSchema,
  adversario: z.string(),
  data: dataSchema,
  local: z.string(),
  competicao: z.string(),
  epoca: z.string(),
  estado: z.enum(["agendado", "terminado"]),
  golosPro: z.number().int().nullable(),
  golosContra: z.number().int().nullable(),
  versao: z.number().int().positive(),
});

export const jogosPainelSchema = z.object({
  epoca: z.string(),
  epocas: z.array(z.string()),
  jogos: z.array(jogoPainelSchema),
});

export const jogosConsultaSchema = z.object({ epoca: epocaSchema.optional() });

export const jogoEntradaSchema = z.object({
  adversario: textoCurto,
  data: dataSchema,
  local: textoCurto,
  competicao: textoCurto,
  epoca: epocaSchema,
});

export const jogoActualizarSchema = jogoEntradaSchema
  .partial()
  .extend({ versao: z.number().int().positive() })
  .strict()
  .refine((v) => Object.keys(v).length > 1, { message: "Sem alterações" });

// Resposta 409 quando outro gestor alterou o jogo entretanto: traz o estado actual.
export const conflitoJogoSchema = z.object({
  erro: z.string(),
  codigo: z.literal("versao_desactualizada"),
  jogo: jogoPainelSchema,
});

// Gestão do jogo: convocatória, escalação, resultado e eventos
const versaoSchema = z.number().int().positive();
const minutoSchema = z.number().int().min(0).max(130);
const idsUnicos = (ids: number[]) => new Set(ids).size === ids.length;

export const jogoDetalheSchema = z.object({
  clube: z.string(),
  jogo: jogoPainelSchema.extend({
    formacao: formacaoSchema.nullable(),
    mvpPlayerId: idSchema.nullable(),
    mvpDescricao: z.string().nullable(),
    convocatoriaPublicada: z.boolean(),
    escalacaoPublicada: z.boolean(),
  }),
  jogadores: z.array(
    z.object({
      id: idSchema,
      nome: z.string(),
      numero: z.number().int(),
      posicao: posicaoSchema,
      estado: estadoJogadorSchema,
      activo: z.boolean(),
      convocado: z.boolean(),
      titular: z.boolean(),
      suplente: z.boolean(),
      x: fracaoSchema.nullable(),
      y: fracaoSchema.nullable(),
      fotoUrl: z.string().nullable(),
    }),
  ),
  eventos: z.array(
    z.object({ id: idSchema, tipo: tipoEventoSchema, playerId: idSchema.nullable(), minuto: minutoSchema }),
  ),
});

// Resposta 409 destas rotas: traz o estado actual do jogo.
export const conflitoDetalheSchema = z.object({
  erro: z.string(),
  codigo: z.literal("versao_desactualizada"),
  detalhe: jogoDetalheSchema,
});

// Página pública de um jogo: a convocatória e o onze só aparecem depois de publicados; o resultado, depois de terminado.
const jogadorPublicoSchema = z.object({
  id: idSchema,
  nome: z.string(),
  numero: z.number().int(),
  posicao: posicaoSchema,
  fotoUrl: z.string().nullable(),
});

export const jogoPublicoSchema = z.object({
  clube: clubePublicoSchema,
  jogo: z.object({
    id: idSchema,
    adversario: z.string(),
    data: z.string().datetime(),
    local: z.string(),
    competicao: z.string(),
    estado: z.enum(["agendado", "terminado"]),
    golosPro: z.number().int().nullable(),
    golosContra: z.number().int().nullable(),
  }),
  convocados: z.array(jogadorPublicoSchema).nullable(),
  onze: z
    .object({
      formacao: formacaoSchema,
      titulares: z.array(jogadorPublicoSchema.extend({ x: fracaoSchema, y: fracaoSchema })),
      suplentes: z.array(jogadorPublicoSchema),
    })
    .nullable(),
  marcadores: z.array(z.object({ minuto: z.number().int(), nome: z.string() })),
  // Só com o jogo terminado; nome é null nos golos sofridos
  eventos: z.array(z.object({ tipo: tipoEventoSchema, minuto: z.number().int(), nome: z.string().nullable() })),
  homemDoJogo: z
    .object({
      jogador: jogadorPublicoSchema,
      golos: z.number().int().nonnegative(),
      assistencias: z.number().int().nonnegative(),
      descricao: z.string().nullable(),
    })
    .nullable(),
});

// Páginas públicas: calendário, perfil do jogador e estatísticas da época
const contagemSchema = z.number().int().nonnegative();

export const jogosPublicosConsultaSchema = z.object({
  epoca: epocaSchema.optional(),
  competicao: z.string().trim().min(1).max(80).optional(),
  estado: z.enum(["agendado", "terminado"]).optional(),
});

export const jogoListaPublicoSchema = z.object({
  id: idSchema,
  adversario: z.string(),
  data: z.string().datetime(),
  local: z.string(),
  competicao: z.string(),
  estado: z.enum(["agendado", "terminado"]),
  golosPro: z.number().int().nullable(),
  golosContra: z.number().int().nullable(),
  resultado: resultadoSchema.nullable(),
});

export const jogosPublicosSchema = z.object({
  epoca: z.string(),
  epocas: z.array(z.string()),
  competicoes: z.array(z.string()),
  jogos: z.array(jogoListaPublicoSchema),
});

export const estatisticasJogadorSchema = z.object({
  jogos: contagemSchema,
  titular: contagemSchema,
  golos: contagemSchema,
  assistencias: contagemSchema,
  amarelos: contagemSchema,
  vermelhos: contagemSchema,
  homemDoJogo: contagemSchema,
});

export const jogadorPerfilSchema = z.object({
  clube: z.string(),
  epoca: z.string(),
  jogador: z.object({
    id: idSchema,
    nome: z.string(),
    numero: z.number().int(),
    posicao: posicaoSchema,
    fotoUrl: z.string().nullable(),
  }),
  estatisticas: estatisticasJogadorSchema,
  jogos: z.array(
    z.object({
      id: idSchema,
      adversario: z.string(),
      data: z.string().datetime(),
      golosPro: z.number().int(),
      golosContra: z.number().int(),
      titular: z.boolean(),
      golos: contagemSchema,
      assistencias: contagemSchema,
      amarelos: contagemSchema,
      vermelhos: contagemSchema,
    }),
  ),
});

const entradaClassificacaoSchema = z.object({
  id: idSchema,
  nome: z.string(),
  numero: z.number().int(),
  posicao: posicaoSchema,
  valor: contagemSchema,
});

export const estatisticasSchema = z.object({
  clube: z.string(),
  epoca: z.string(),
  epocas: z.array(z.string()),
  resumo: z.object({
    jogos: contagemSchema,
    vitorias: contagemSchema,
    empates: contagemSchema,
    derrotas: contagemSchema,
    golosPro: contagemSchema,
    golosContra: contagemSchema,
  }),
  // Do mais antigo para o mais recente
  forma: z.array(resultadoSchema),
  artilheiros: z.array(entradaClassificacaoSchema),
  assistentes: z.array(entradaClassificacaoSchema),
  presencas: z.array(entradaClassificacaoSchema),
  cartoes: z.array(entradaClassificacaoSchema.omit({ valor: true }).extend({ amarelos: contagemSchema, vermelhos: contagemSchema })),
});

export const convocatoriaEntradaSchema = z.object({
  versao: versaoSchema,
  jogadores: z.array(idSchema).min(CONVOCADOS_MINIMO).max(CONVOCADOS_MAXIMO).refine(idsUnicos),
  publicada: z.boolean(),
});

export const escalacaoEntradaSchema = z
  .object({
    versao: versaoSchema,
    formacao: formacaoSchema,
    titulares: z.array(z.object({ id: idSchema, x: fracaoSchema, y: fracaoSchema })).length(TITULARES),
    suplentes: z.array(idSchema).max(CONVOCADOS_MAXIMO),
    publicada: z.boolean(),
  })
  .refine((v) => {
    const titulares = v.titulares.map((t) => t.id);
    return idsUnicos(titulares) && idsUnicos(v.suplentes) && v.suplentes.every((id) => !titulares.includes(id));
  });

export const resultadoEntradaSchema = z.object({
  versao: versaoSchema,
  golosPro: z.number().int().min(0).max(99),
  golosContra: z.number().int().min(0).max(99),
  mvpPlayerId: idSchema.nullable(),
  mvpDescricao: z.string().trim().max(200).nullable(),
});

export const eventoEntradaSchema = z
  .object({
    versao: versaoSchema,
    tipo: tipoEventoSchema,
    playerId: idSchema.nullable().optional(),
    minuto: minutoSchema,
    // só em golos: regista também a assistência, no mesmo minuto
    assistenteId: idSchema.nullable().optional(),
  })
  .refine((v) => (v.tipo === "golo_sofrido" ? v.playerId == null : v.playerId != null))
  .refine((v) => v.assistenteId == null || (v.tipo === "golo" && v.assistenteId !== v.playerId));

export const versaoEntradaSchema = z.object({ versao: versaoSchema });

// TODO: schemas de validação dos restantes pedidos da API
