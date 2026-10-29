import { dividirNomeClube, formatarDataLonga, formatarHora, iniciais } from "../lib/formatadores";
import type { ClubeImagem, JogoImagem } from "./tipos";

export const FONTE_TITULO = '"Big Shoulders Display", "Arial Narrow", sans-serif';
export const FONTE_CORPO = 'Barlow, system-ui, sans-serif';

export const MARGEM = 72;
const ESCUDO_RESERVA = "/escudo.png";

export type Paleta = {
  fundo: string;
  destaque: string;
  texto: string;
  texto2: string;
  linha: string;
};

function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
}

// O fundo é a cor principal do clube e o destaque a secundária. Se o fundo for claro, o texto passa a escuro.
export function paleta(clube: ClubeImagem): Paleta {
  const claro = luminancia(clube.corPrimaria) > 0.5;
  const texto = claro ? "#0B1F3A" : "#F4F1EA";
  return {
    fundo: clube.corPrimaria,
    destaque: clube.corSecundaria,
    texto,
    texto2: claro ? "rgba(11, 31, 58, 0.7)" : "rgba(244, 241, 234, 0.7)",
    linha: claro ? "rgba(11, 31, 58, 0.45)" : "rgba(244, 241, 234, 0.5)",
  };
}

// Espera pelas fontes auto-alojadas antes de desenhar: sem isto o canvas usaria a fonte de reserva.
export async function prepararFontes(): Promise<void> {
  const amostra = "Aa ÃÇÕÉÊáãçéíóú 0123456789";
  await Promise.all([
    document.fonts.load(`900 64px ${FONTE_TITULO}`, amostra),
    document.fonts.load(`800 64px ${FONTE_TITULO}`, amostra),
    document.fonts.load(`400 32px ${FONTE_CORPO}`, amostra),
    document.fonts.load(`600 32px ${FONTE_CORPO}`, amostra),
  ]);
  await document.fonts.ready;
}

// Resolve com null se a imagem não existir ou falhar: quem desenha usa um avatar de reserva.
export function carregarImagem(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolver) => {
    const imagem = new Image();
    imagem.onload = () => resolver(imagem);
    imagem.onerror = () => resolver(null);
    imagem.src = url;
  });
}

export function carregarEscudo(clube: ClubeImagem): Promise<HTMLImageElement | null> {
  return carregarImagem(clube.escudoUrl ?? ESCUDO_RESERVA);
}

export function criarTela(largura: number, altura: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("O navegador não consegue desenhar a imagem.");
  return { canvas, ctx };
}

export function canvasParaPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolver, rejeitar) => {
    canvas.toBlob((blob) => (blob ? resolver(blob) : rejeitar(new Error("Não foi possível gerar a imagem."))), "image/png");
  });
}

export function fonte(peso: number, tamanho: number, familia: string = FONTE_CORPO): string {
  return `${peso} ${tamanho}px ${familia}`;
}

export function maiusculas(texto: string): string {
  return texto.toLocaleUpperCase("pt-MZ");
}

export function minuscula1(texto: string): string {
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)}`;
}

type OpcoesTexto = {
  fonte: string;
  cor: string;
  alinhamento?: CanvasTextAlign;
  base?: CanvasTextBaseline;
  // espaçamento entre letras, em px
  espaco?: number;
};

export function escrever(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, opcoes: OpcoesTexto): void {
  ctx.font = opcoes.fonte;
  ctx.fillStyle = opcoes.cor;
  ctx.textAlign = opcoes.alinhamento ?? "left";
  ctx.textBaseline = opcoes.base ?? "alphabetic";
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${opcoes.espaco ?? 0}px`;
  ctx.fillText(texto, x, y);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
}

export function medir(ctx: CanvasRenderingContext2D, texto: string, fontePronta: string, espaco = 0): number {
  ctx.font = fontePronta;
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${espaco}px`;
  const largura = ctx.measureText(texto).width;
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  return largura;
}

// Reduz o tamanho da fonte até o texto caber na largura (nomes longos). Devolve a fonte escolhida.
export function ajustarFonte(
  ctx: CanvasRenderingContext2D,
  texto: string,
  larguraMax: number,
  tamanhoMax: number,
  tamanhoMin: number,
  peso: number,
  familia: string = FONTE_CORPO,
  espaco = 0,
): { fonte: string; tamanho: number } {
  let tamanho = tamanhoMax;
  while (tamanho > tamanhoMin && medir(ctx, texto, fonte(peso, tamanho, familia), espaco) > larguraMax) tamanho -= 2;
  return { fonte: fonte(peso, tamanho, familia), tamanho };
}

// Corta com reticências o que não cabe na largura, com a fonte já escolhida.
export function encurtar(ctx: CanvasRenderingContext2D, texto: string, larguraMax: number, fontePronta: string): string {
  if (medir(ctx, texto, fontePronta) <= larguraMax) return texto;
  let corte = texto.length;
  while (corte > 1 && medir(ctx, `${texto.slice(0, corte).trimEnd()}…`, fontePronta) > larguraMax) corte -= 1;
  return `${texto.slice(0, corte).trimEnd()}…`;
}

// Parte o texto em linhas por palavras; se passar de `maxLinhas`, a última termina em reticências.
export function quebrarLinhas(
  ctx: CanvasRenderingContext2D,
  texto: string,
  larguraMax: number,
  fontePronta: string,
  maxLinhas: number,
  espaco = 0,
): string[] {
  const palavras = texto.trim().split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let actual = "";
  for (const palavra of palavras) {
    const tentativa = actual ? `${actual} ${palavra}` : palavra;
    if (actual && medir(ctx, tentativa, fontePronta, espaco) > larguraMax) {
      linhas.push(actual);
      actual = palavra;
    } else {
      actual = tentativa;
    }
  }
  if (actual) linhas.push(actual);
  if (linhas.length <= maxLinhas) return linhas;
  const visiveis = linhas.slice(0, maxLinhas);
  const resto = linhas.slice(maxLinhas - 1).join(" ");
  visiveis[maxLinhas - 1] = encurtar(ctx, resto, larguraMax, fontePronta);
  return visiveis;
}

// Escolhe o menor número de linhas em que o texto cabe, reduzindo a fonte só se for preciso.
export function ajustarEmLinhas(
  ctx: CanvasRenderingContext2D,
  texto: string,
  larguraMax: number,
  maxLinhas: number,
  tamanhoMax: number,
  tamanhoMin: number,
  peso: number,
  familia: string = FONTE_CORPO,
  espaco = 0,
): { fonte: string; tamanho: number; linhas: string[] } {
  for (let tamanho = tamanhoMax; tamanho >= tamanhoMin; tamanho -= 2) {
    const fontePronta = fonte(peso, tamanho, familia);
    const linhas = quebrarLinhas(ctx, texto, larguraMax, fontePronta, maxLinhas + 1, espaco);
    if (linhas.length <= maxLinhas && linhas.every((l) => medir(ctx, l, fontePronta, espaco) <= larguraMax)) {
      return { fonte: fontePronta, tamanho, linhas };
    }
  }
  const fontePronta = fonte(peso, tamanhoMin, familia);
  return { fonte: fontePronta, tamanho: tamanhoMin, linhas: quebrarLinhas(ctx, texto, larguraMax, fontePronta, maxLinhas, espaco) };
}

// Desenha a imagem a cobrir o rectângulo (como object-fit: cover), alinhada ao topo para não cortar caras.
export function desenharCobrir(
  ctx: CanvasRenderingContext2D,
  imagem: HTMLImageElement,
  x: number,
  y: number,
  largura: number,
  altura: number,
): void {
  const escala = Math.max(largura / imagem.naturalWidth, altura / imagem.naturalHeight);
  const lw = largura / escala;
  const lh = altura / escala;
  const sx = (imagem.naturalWidth - lw) / 2;
  const sy = Math.max(0, Math.min(imagem.naturalHeight - lh, (imagem.naturalHeight - lh) * 0.15));
  ctx.drawImage(imagem, sx, sy, lw, lh, x, y, largura, altura);
}

// Desenha o escudo com a altura pedida, mantendo a proporção. Devolve a largura usada.
export function desenharEscudo(
  ctx: CanvasRenderingContext2D,
  escudo: HTMLImageElement | null,
  x: number,
  y: number,
  altura: number,
  alinhamento: "esquerda" | "centro" | "direita" = "esquerda",
): number {
  if (!escudo) return 0;
  const largura = (escudo.naturalWidth / escudo.naturalHeight) * altura;
  const inicio = alinhamento === "centro" ? x - largura / 2 : alinhamento === "direita" ? x - largura : x;
  ctx.drawImage(escudo, inicio, y, largura, altura);
  return largura;
}

export function iniciaisDe(nome: string): string {
  return iniciais(nome) || nome.trim().charAt(0).toUpperCase();
}

// Avatar de reserva quando o jogador não tem foto: iniciais sobre um fundo mais claro que o da imagem.
export function desenharAvatar(
  ctx: CanvasRenderingContext2D,
  nome: string,
  x: number,
  y: number,
  largura: number,
  altura: number,
  p: Paleta,
  redondo = false,
): void {
  ctx.save();
  ctx.beginPath();
  if (redondo) ctx.ellipse(x + largura / 2, y + altura / 2, largura / 2, altura / 2, 0, 0, Math.PI * 2);
  else ctx.rect(x, y, largura, altura);
  ctx.clip();
  ctx.fillStyle = p.linha;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(x, y, largura, altura);
  ctx.globalAlpha = 1;
  escrever(ctx, iniciaisDe(nome), x + largura / 2, y + altura / 2, {
    fonte: fonte(900, Math.round(Math.min(largura, altura) * 0.5), FONTE_TITULO),
    cor: p.texto2,
    alinhamento: "center",
    base: "middle",
  });
  ctx.restore();
}

export function desenharFundo(ctx: CanvasRenderingContext2D, largura: number, altura: number, p: Paleta): void {
  ctx.fillStyle = p.fundo;
  ctx.fillRect(0, 0, largura, altura);
}

export function textoData(jogo: Pick<JogoImagem, "data">): string {
  return `${minuscula1(formatarDataLonga(jogo.data))} · ${formatarHora(jogo.data)}`;
}

export function nomePrincipalClube(nome: string): string {
  return dividirNomeClube(nome).principal;
}

function semAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// "nh-onze-inicial-vs-grupo-desportivo-da-matola-2026-11-01.png"
export function nomeFicheiro(jogo: JogoImagem, tipo: string): string {
  const slug = (texto: string) =>
    semAcentos(texto)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const dia = jogo.data.slice(0, 10);
  return `${slug(nomePrincipalClube(jogo.clube.nome))}-${tipo}-vs-${slug(jogo.adversario)}-${dia}.png`;
}
