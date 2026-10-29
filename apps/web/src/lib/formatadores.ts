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
