import type { z } from "zod";
import type { ESTADOS_JOGADOR, FORMACOES, PAPEIS, POSICOES, TIPOS_EVENTO } from "./constantes";
import type {
  clubePublicoSchema,
  homemDoJogoSchema,
  inicioSchema,
  jogadorNoCampoSchema,
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

// TODO: tipos de domínio restantes (Jogador, Jogo, Utilizador, ...)
