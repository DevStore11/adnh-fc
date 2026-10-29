import { z } from "zod";
import { ESTADOS_JOGADOR, FORMACOES, PAPEIS, POSICOES, TIPOS_EVENTO } from "./constantes";

export const posicaoSchema = z.enum(POSICOES);
export const tipoEventoSchema = z.enum(TIPOS_EVENTO);
export const formacaoSchema = z.enum(FORMACOES);
export const estadoJogadorSchema = z.enum(ESTADOS_JOGADOR);
export const papelSchema = z.enum(PAPEIS);

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

// TODO: schemas de validação dos restantes pedidos da API
