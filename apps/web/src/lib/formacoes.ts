import { POSICOES, type Formacao, type JogadorDoJogo, type Posicao } from "@adnh-fc/shared";

export type Espaco = { posicao: Posicao; x: number; y: number };
export type Titular = { id: number; x: number; y: number };

type Linha = { posicao: Posicao; n: number; y: number };

// y = 0 é o ataque e y = 1 a baliza própria, como no campo público.
const LINHAS: Record<Formacao, Linha[]> = {
  "4-4-2": [
    { posicao: "guarda-redes", n: 1, y: 0.9 },
    { posicao: "defesa", n: 4, y: 0.72 },
    { posicao: "médio", n: 4, y: 0.48 },
    { posicao: "avançado", n: 2, y: 0.2 },
  ],
  "4-3-3": [
    { posicao: "guarda-redes", n: 1, y: 0.9 },
    { posicao: "defesa", n: 4, y: 0.72 },
    { posicao: "médio", n: 3, y: 0.5 },
    { posicao: "avançado", n: 3, y: 0.2 },
  ],
  "3-5-2": [
    { posicao: "guarda-redes", n: 1, y: 0.9 },
    { posicao: "defesa", n: 3, y: 0.72 },
    { posicao: "médio", n: 5, y: 0.48 },
    { posicao: "avançado", n: 2, y: 0.2 },
  ],
  "4-2-3-1": [
    { posicao: "guarda-redes", n: 1, y: 0.9 },
    { posicao: "defesa", n: 4, y: 0.72 },
    { posicao: "médio", n: 2, y: 0.56 },
    { posicao: "médio", n: 3, y: 0.36 },
    { posicao: "avançado", n: 1, y: 0.16 },
  ],
};

function espalhar(n: number): number[] {
  if (n === 1) return [0.5];
  const margem = n >= 4 ? 0.1 : n === 3 ? 0.2 : 0.3;
  return Array.from({ length: n }, (_, i) => margem + ((1 - 2 * margem) * i) / (n - 1));
}

// Os 11 lugares da formação: guarda-redes, defesas, médios e avançados, da esquerda para a direita.
export function espacosDaFormacao(formacao: Formacao): Espaco[] {
  return LINHAS[formacao].flatMap((linha) =>
    espalhar(linha.n).map((x) => ({ posicao: linha.posicao, x, y: linha.y })),
  );
}

function ordemPosicao(posicao: Posicao): number {
  return POSICOES.indexOf(posicao);
}

// Coloca os titulares nos lugares da formação, pela ordem GR, defesas, médios, avançados e número.
export function distribuir(formacao: Formacao, jogadores: JogadorDoJogo[]): Titular[] {
  const espacos = espacosDaFormacao(formacao);
  return [...jogadores]
    .sort((a, b) => ordemPosicao(a.posicao) - ordemPosicao(b.posicao) || a.numero - b.numero)
    .map((jogador, indice) => ({ id: jogador.id, x: espacos[indice]?.x ?? 0.5, y: espacos[indice]?.y ?? 0.5 }));
}

// Escolhe 11 convocados que encaixam na formação (os de menor número em cada posição).
export function sugerirOnze(formacao: Formacao, convocados: JogadorDoJogo[]): JogadorDoJogo[] {
  const necessarios = new Map<Posicao, number>();
  for (const linha of LINHAS[formacao]) {
    necessarios.set(linha.posicao, (necessarios.get(linha.posicao) ?? 0) + linha.n);
  }
  const ordenados = [...convocados].sort((a, b) => a.numero - b.numero);
  const escolhidos: JogadorDoJogo[] = [];
  for (const [posicao, quantidade] of necessarios) {
    escolhidos.push(...ordenados.filter((j) => j.posicao === posicao).slice(0, quantidade));
  }
  for (const jogador of ordenados) {
    if (escolhidos.length >= 11) break;
    if (!escolhidos.includes(jogador)) escolhidos.push(jogador);
  }
  return escolhidos.slice(0, 11);
}

// Um lugar do onze: índice, posição da linha (as duas linhas de médios do 4-2-3-1 contam como médio) e coordenadas.
export type Lugar = { indice: number; posicao: Posicao; x: number; y: number };

// Jogador (id) de cada lugar, pelo índice do lugar; null = lugar vazio.
export type OnzePorLugar = (number | null)[];

// Os 11 lugares da formação, do ataque para a defesa e da esquerda para a direita.
export function lugaresDaFormacao(formacao: Formacao): Lugar[] {
  return [...LINHAS[formacao]]
    .reverse()
    .flatMap((linha) => espalhar(linha.n).map((x) => ({ posicao: linha.posicao, x, y: linha.y })))
    .map((lugar, indice) => ({ ...lugar, indice }));
}

// Atribui cada titular ao lugar mais próximo da formação, 1 para 1: pares por ordem de distância, sem repetir
// jogador nem lugar. Os lugares que sobrarem ficam vazios.
export function atribuirALugares(formacao: Formacao, titulares: Titular[]): OnzePorLugar {
  const lugares = lugaresDaFormacao(formacao);
  const pares = titulares
    .flatMap((t) => lugares.map((l) => ({ id: t.id, indice: l.indice, distancia: Math.hypot(t.x - l.x, t.y - l.y) })))
    .sort((a, b) => a.distancia - b.distancia || a.indice - b.indice || a.id - b.id);
  const onze: OnzePorLugar = lugares.map(() => null);
  const colocados = new Set<number>();
  for (const par of pares) {
    if (onze[par.indice] === null && !colocados.has(par.id)) {
      onze[par.indice] = par.id;
      colocados.add(par.id);
    }
  }
  return onze;
}

// Onze que resulta de pôr o jogador no lugar: se já estava noutro lugar, os dois trocam (o outro lugar fica vazio
// se este estava vazio); se vinha do banco, quem ocupava o lugar passa a suplente.
export function simularColocacao(onze: OnzePorLugar, indice: number, jogadorId: number): OnzePorLugar {
  const novo = [...onze];
  const origem = novo.indexOf(jogadorId);
  const ocupante = novo[indice];
  novo[indice] = jogadorId;
  if (origem !== -1 && origem !== indice) novo[origem] = ocupante;
  return novo;
}

// Regra do servidor: exactamente um guarda-redes entre os titulares. No cliente só se recusa o que a piora:
// um jogador de campo no lugar de guarda-redes, ou um segundo guarda-redes no onze.
export function motivoDeRecusa(
  lugares: Lugar[],
  antes: OnzePorLugar,
  depois: OnzePorLugar,
  posicaoDe: (id: number) => Posicao | undefined,
): string | null {
  const guardaRedes = (onze: OnzePorLugar) => onze.filter((id) => id !== null && posicaoDe(id) === "guarda-redes").length;
  for (const lugar of lugares) {
    const id = depois[lugar.indice];
    if (antes[lugar.indice] !== id && lugar.posicao === "guarda-redes" && id !== null && posicaoDe(id) !== "guarda-redes") {
      return "O guarda-redes tem de ser um guarda-redes";
    }
  }
  const total = guardaRedes(depois);
  if (total > 1 && total > guardaRedes(antes)) return "Só pode haver um guarda-redes";
  return null;
}

// Primeiro lugar da formação (da posição do jogador, se possível) ainda livre no campo.
export function proximoEspacoLivre(formacao: Formacao, titulares: Titular[], posicao: Posicao): { x: number; y: number } {
  const espacos = espacosDaFormacao(formacao);
  const livre = (e: Espaco) => !titulares.some((t) => Math.hypot(t.x - e.x, t.y - e.y) < 0.08);
  const escolhido = espacos.find((e) => e.posicao === posicao && livre(e)) ?? espacos.find(livre);
  return escolhido ? { x: escolhido.x, y: escolhido.y } : { x: 0.5, y: 0.5 };
}
