import type { Posicao } from "@adnh-fc/shared";

const LOCALE = "pt-MZ";
const FUSO = "Africa/Maputo";

const PREFIXOS_CLUBE = /^(Associação Desportiva|Clube Desportivo|Grupo Desportivo)\s+(.+)$/i;

const ABREVIATURAS_POSICAO: Record<Posicao, string> = {
  "guarda-redes": "GR",
  defesa: "DEF",
  médio: "MED",
  avançado: "AVA",
};

const TITULOS_GRUPO: Record<Posicao, string> = {
  "guarda-redes": "Guarda-redes (GR)",
  defesa: "Defesas (DEF)",
  médio: "Médios (MED)",
  avançado: "Avançados (AVA)",
};

export function tituloGrupo(posicao: Posicao): string {
  return TITULOS_GRUPO[posicao];
}

export function formatarDataLonga(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: FUSO,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

export function formatarDataCurta(iso: string): string {
  const partes = new Intl.DateTimeFormat(LOCALE, {
    timeZone: FUSO,
    day: "2-digit",
    month: "long",
  }).formatToParts(new Date(iso));
  const dia = partes.find((p) => p.type === "day")?.value ?? "";
  const mes = partes.find((p) => p.type === "month")?.value ?? "";
  return `${dia} ${mes.charAt(0).toUpperCase()}${mes.slice(1, 3)}`;
}

export function formatarHora(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatarPlacar(golosPro: number, golosContra: number): string {
  return `${golosPro} – ${golosContra}`;
}

export function listarMinutos(minutos: number[]): string {
  const textos = minutos.map((m) => `${m}'`);
  if (textos.length <= 1) return textos.join("");
  return `${textos.slice(0, -1).join(", ")} e ${textos[textos.length - 1]}`;
}

export function formatarMinutos(minutos: number[]): string {
  return minutos.map((m) => `${m}'`).join(", ");
}

// Parte um nome em duas linhas (metade das palavras em cada), como na manchete da referência.
export function partirNome(nome: string): string[] {
  const palavras = nome.trim().split(/\s+/);
  if (palavras.length < 2) return [nome];
  const meio = Math.ceil(palavras.length / 2);
  return [palavras.slice(0, meio).join(" "), palavras.slice(meio).join(" ")];
}

export function dividirNomeClube(nome: string): { prefixo: string | null; principal: string } {
  const partes = PREFIXOS_CLUBE.exec(nome);
  return partes ? { prefixo: partes[1], principal: partes[2] } : { prefixo: null, principal: nome };
}

export function apelido(nome: string): string {
  const palavras = nome.trim().split(/\s+/);
  return palavras[palavras.length - 1] ?? nome;
}

export function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter((palavra) => /^\p{Lu}/u.test(palavra))
    .slice(0, 2)
    .map((palavra) => palavra.charAt(0))
    .join("");
}

export function abreviarPosicao(posicao: Posicao): string {
  return ABREVIATURAS_POSICAO[posicao];
}

// "25 Out 2026 · 16:12"
export function formatarDataHora(iso: string): string {
  const partes = new Intl.DateTimeFormat(LOCALE, {
    timeZone: FUSO,
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  const mes = valor("month");
  return `${valor("day")} ${mes.charAt(0).toUpperCase()}${mes.slice(1, 3)} ${valor("year")} · ${valor("hour")}:${valor("minute")}`;
}

// Maputo não tem horário de verão: o fuso é sempre UTC+2.
export function maputoParaIso(valorLocal: string): string {
  return new Date(`${valorLocal}:00+02:00`).toISOString();
}

// Valor para um <input type="datetime-local">, em hora de Maputo.
export function isoParaMaputoLocal(iso: string): string {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${valor("year")}-${valor("month")}-${valor("day")}T${valor("hour")}:${valor("minute")}`;
}

// "Dom, 1 Nov"
export function formatarDataLista(iso: string): string {
  const partes = new Intl.DateTimeFormat(LOCALE, {
    timeZone: FUSO,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).formatToParts(new Date(iso));
  const limpo = (tipo: string) => (partes.find((p) => p.type === tipo)?.value ?? "").replace(".", "");
  const maiuscula = (texto: string) => `${texto.charAt(0).toUpperCase()}${texto.slice(1)}`;
  return `${maiuscula(limpo("weekday"))}, ${limpo("day")} ${maiuscula(limpo("month"))}`;
}

// "Grupo Desportivo da Matola" -> "GDM"; só conta palavras que começam por maiúscula.
export function sigla(nome: string): string {
  return nome
    .split(/\s+/)
    .filter((palavra) => /^\p{Lu}/u.test(palavra))
    .map((palavra) => palavra.charAt(0))
    .join("")
    .slice(0, 3);
}
