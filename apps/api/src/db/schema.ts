import type { EstadoJogador, Formacao, Posicao } from "@adnh-fc/shared";

export type Bindings = {
  DB: D1Database;
};

export type LinhaClube = {
  nome: string;
  tem_escudo: number;
  cor_primaria: string;
  cor_secundaria: string;
  epoca_actual: string;
};

export type LinhaJogador = {
  id: number;
  nome: string;
  numero: number;
  posicao: Posicao;
  estado: EstadoJogador;
};

export type LinhaProximoJogo = {
  id: number;
  adversario: string;
  data: string;
  local: string;
  competicao: string;
};

export type LinhaJogoTerminado = {
  id: number;
  adversario: string;
  data: string;
  competicao: string;
  golos_pro: number;
  golos_contra: number;
  formacao: Formacao | null;
  mvp_player_id: number | null;
  mvp_descricao: string | null;
};

export type LinhaOnze = {
  id: number;
  nome: string;
  numero: number;
  posicao_campo: string | null;
};

export type LinhaSuplente = {
  id: number;
  nome: string;
};

export type LinhaMarcador = {
  player_id: number;
  nome: string;
  minuto: number;
};

export type LinhaGoloSofrido = {
  minuto: number;
};

export type LinhaHomemDoJogo = {
  id: number;
  nome: string;
  numero: number;
  posicao: Posicao;
  tem_foto: number;
  golos: number;
  assistencias: number;
};
