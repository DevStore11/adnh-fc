import type { Formacao, Posicao } from "@adnh-fc/shared";

// Dados que as imagens precisam. São os mesmos no painel e na página pública: cada lado converte os seus
// dados para estes tipos (ver dados-painel.ts e dados-publicos.ts).

export type ClubeImagem = {
  nome: string;
  // null: usa o escudo de reserva do site
  escudoUrl: string | null;
  corPrimaria: string;
  corSecundaria: string;
};

export type JogadorImagem = {
  id: number;
  nome: string;
  numero: number;
  posicao: Posicao;
  fotoUrl: string | null;
};

export type JogoImagem = {
  clube: ClubeImagem;
  adversario: string;
  // ISO 8601 UTC
  data: string;
  local: string;
  competicao: string;
};

export type DadosConvocados = JogoImagem & {
  jogadores: JogadorImagem[];
};

export type DadosOnzeInicial = JogoImagem & {
  formacao: Formacao;
  // x e y entre 0 e 1, com y = 0 no ataque
  titulares: (JogadorImagem & { x: number; y: number })[];
  suplentes: JogadorImagem[];
};

export type DadosHomemDoJogo = JogoImagem & {
  golosPro: number;
  golosContra: number;
  jogador: JogadorImagem;
  golos: number;
  assistencias: number;
  descricao: string | null;
};

export type FormatoPlacar = "retrato" | "quadrado";

export type DadosPlacarFinal = JogoImagem & {
  golosPro: number;
  golosContra: number;
  marcadores: { minuto: number; nome: string }[];
  formato?: FormatoPlacar;
};

export const LARGURA = 1080;
export const ALTURA_RETRATO = 1350;
export const ALTURA_QUADRADO = 1080;
