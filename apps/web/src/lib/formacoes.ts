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

// Primeiro lugar da formação (da posição do jogador, se possível) ainda livre no campo.
export function proximoEspacoLivre(formacao: Formacao, titulares: Titular[], posicao: Posicao): { x: number; y: number } {
  const espacos = espacosDaFormacao(formacao);
  const livre = (e: Espaco) => !titulares.some((t) => Math.hypot(t.x - e.x, t.y - e.y) < 0.08);
  const escolhido = espacos.find((e) => e.posicao === posicao && livre(e)) ?? espacos.find(livre);
  return escolhido ? { x: escolhido.x, y: escolhido.y } : { x: 0.5, y: 0.5 };
}
