import { apelido, inicialEApelido, partirNome } from "../lib/formatadores";
import {
  ajustarEmLinhas,
  ajustarFonte,
  carregarEscudo,
  carregarImagem,
  criarTela,
  desenharCobrir,
  desenharEscudo,
  desenharFundo,
  encurtar,
  escrever,
  FONTE_CORPO,
  FONTE_TITULO,
  fonte,
  MARGEM,
  maiusculas,
  medir,
  nomePrincipalClube,
  paleta,
  prepararFontes,
  textoData,
  type Paleta,
} from "./base";
import { ALTURA_RETRATO, LARGURA, type DadosOnzeInicial, type JogadorImagem } from "./tipos";

const CAMPO = { x: MARGEM, y: 398, largura: LARGURA - 2 * MARGEM, altura: 853 };

// Medidas de cada jogador, em px (ver h5 no clube.pen). Tudo é relativo ao centro da foto.
const FOTO = 104;
const RAIO_FOTO = FOTO / 2;
const ANEL = 3;
const DISCO = 42;
const DISCO_DESCIDA = 48; // centro do disco abaixo do centro da foto
const PILULA_TOPO = 75; // topo da pílula abaixo do centro da foto
const PILULA_ALTURA = 30;
const PILULA_PADDING = 13;
const PILULA_LARGURA_MAX = 170;
const FOCO_VERTICAL_FOTO = 0.35;
const FOLGA_CAMPO = 6;
const ALTURA_COLUNA_ACIMA = RAIO_FOTO; // da foto, para cima
const ALTURA_COLUNA_ABAIXO = PILULA_TOPO + PILULA_ALTURA; // do centro da foto, para baixo
const LIMITE_LINHAS_IGUAIS = 5;
const DISTANCIA_MESMA_LINHA = 0.05;

// Centros possíveis da foto, na vertical: o círculo, o disco e a pílula ficam sempre dentro do campo.
const CENTRO_MIN = CAMPO.y + FOLGA_CAMPO + ALTURA_COLUNA_ACIMA;
const CENTRO_MAX = CAMPO.y + CAMPO.altura - FOLGA_CAMPO - ALTURA_COLUNA_ABAIXO;

type Titular = DadosOnzeInicial["titulares"][number];

// Mesmas linhas do campo do site (viewBox 600×700), esticadas à área do campo. Sem a pequena área.
// `topoArea` é o topo da grande área, em px, escolhido para não cortar a linha de defesas.
function desenharLinhasCampo(ctx: CanvasRenderingContext2D, p: Paleta, topoArea: number): void {
  const { x, y, largura, altura } = CAMPO;
  const sx = largura / 600;
  const sy = altura / 700;
  ctx.strokeStyle = p.linha;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, largura, altura);
  ctx.beginPath();
  ctx.ellipse(x + 300 * sx, y, 90 * sx, 90 * sy, 0, 0, Math.PI);
  ctx.stroke();
  ctx.strokeRect(x + 120 * sx, topoArea, 360 * sx, y + altura - topoArea);
}

// Linhas de jogadores: agrupa os y que estão próximos e devolve o centro de cada grupo, do ataque para a defesa.
function centrosDasLinhas(ys: number[]): number[] {
  const ordenados = [...ys].sort((a, b) => a - b);
  const grupos: number[][] = [];
  for (const y of ordenados) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && y - ultimo[ultimo.length - 1] < DISTANCIA_MESMA_LINHA) ultimo.push(y);
    else grupos.push([y]);
  }
  return grupos.map((g) => g.reduce((soma, v) => soma + v, 0) / g.length);
}

// Até 5 linhas ficam igualmente espaçadas entre o topo e a base (garante folga entre linhas);
// com posições livres (mais de 5 linhas) usa-se a escala proporcional.
function criarPosicionadorY(ys: number[]): (y: number) => number {
  const linhas = centrosDasLinhas(ys);
  if (linhas.length <= 1) return () => (CENTRO_MIN + CENTRO_MAX) / 2;
  if (linhas.length <= LIMITE_LINHAS_IGUAIS) {
    const passo = (CENTRO_MAX - CENTRO_MIN) / (linhas.length - 1);
    return (y) => {
      let melhor = 0;
      linhas.forEach((centro, indice) => {
        if (Math.abs(centro - y) < Math.abs(linhas[melhor] - y)) melhor = indice;
      });
      return CENTRO_MIN + melhor * passo;
    };
  }
  const minimo = linhas[0];
  const amplitude = linhas[linhas.length - 1] - minimo;
  return (y) => CENTRO_MIN + ((y - minimo) / amplitude) * (CENTRO_MAX - CENTRO_MIN);
}

function caminhoPilula(ctx: CanvasRenderingContext2D, x: number, y: number, largura: number, altura: number): void {
  const r = altura / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + largura - r, y);
  ctx.arc(x + largura - r, y + r, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + r, y + altura);
  ctx.arc(x + r, y + r, r, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.closePath();
}

// Nome em inicial e apelido; se não couber em 170 px, corta com "…".
function prepararPilula(ctx: CanvasRenderingContext2D, nome: string): { texto: string; fontePronta: string; largura: number } {
  const fontePronta = fonte(600, 20, FONTE_CORPO);
  const texto = encurtar(ctx, inicialEApelido(nome), PILULA_LARGURA_MAX - 2 * PILULA_PADDING, fontePronta);
  const largura = Math.min(PILULA_LARGURA_MAX, Math.ceil(medir(ctx, texto, fontePronta)) + 2 * PILULA_PADDING);
  return { texto, fontePronta, largura };
}

// Círculo com a foto, recortada a cobrir e com o rosto na parte de cima. Devolve false se a foto não puder ser desenhada.
function desenharFoto(ctx: CanvasRenderingContext2D, foto: HTMLImageElement | null, px: number, py: number): boolean {
  if (!foto || foto.naturalWidth === 0 || foto.naturalHeight === 0) return false;
  try {
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, RAIO_FOTO, 0, Math.PI * 2);
    ctx.clip();
    desenharCobrir(ctx, foto, px - RAIO_FOTO, py - RAIO_FOTO, FOTO, FOTO, FOCO_VERTICAL_FOTO);
    ctx.restore();
    return true;
  } catch {
    ctx.restore();
    return false;
  }
}

function desenharJogador(
  ctx: CanvasRenderingContext2D,
  p: Paleta,
  jogador: Titular,
  foto: HTMLImageElement | null,
  py: number,
): void {
  const pilula = prepararPilula(ctx, jogador.nome);
  // O centro nunca deixa a pílula (a parte mais larga da coluna) sair do campo.
  const metade = Math.max(RAIO_FOTO, pilula.largura / 2);
  const px = Math.min(
    CAMPO.x + CAMPO.largura - metade - FOLGA_CAMPO,
    Math.max(CAMPO.x + metade + FOLGA_CAMPO, CAMPO.x + jogador.x * CAMPO.largura),
  );

  const comFoto = desenharFoto(ctx, foto, px, py);
  if (!comFoto) {
    // Sem foto: círculo mais claro que o fundo com o número grande, no lugar do disco.
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = p.texto;
    ctx.beginPath();
    ctx.arc(px, py, RAIO_FOTO, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    escrever(ctx, String(jogador.numero), px, py + 2, {
      fonte: fonte(800, jogador.numero > 9 ? 60 : 66, FONTE_TITULO),
      cor: p.texto,
      alinhamento: "center",
      base: "middle",
    });
  }

  // Anel fino claro à volta da foto (ou do círculo sem foto)
  ctx.strokeStyle = p.texto;
  ctx.lineWidth = ANEL;
  ctx.beginPath();
  ctx.arc(px, py, RAIO_FOTO - ANEL / 2, 0, Math.PI * 2);
  ctx.stroke();

  if (comFoto) {
    // Disco escuro com o número, sobreposto à base da foto
    const dy = py + DISCO_DESCIDA;
    ctx.fillStyle = p.fundo;
    ctx.beginPath();
    ctx.arc(px, dy, DISCO / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.texto;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, dy, DISCO / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
    escrever(ctx, String(jogador.numero), px, dy + 1, {
      fonte: fonte(800, 27, FONTE_TITULO),
      cor: p.texto,
      alinhamento: "center",
      base: "middle",
    });
  }

  // Pílula com o nome: fundo da imagem e contorno fino claro, que a distingue do campo
  const xPilula = px - pilula.largura / 2;
  const yPilula = py + PILULA_TOPO;
  caminhoPilula(ctx, xPilula, yPilula, pilula.largura, PILULA_ALTURA);
  ctx.fillStyle = p.fundo;
  ctx.fill();
  ctx.strokeStyle = p.texto;
  ctx.lineWidth = 2;
  caminhoPilula(ctx, xPilula + 1, yPilula + 1, pilula.largura - 2, PILULA_ALTURA - 2);
  ctx.stroke();
  escrever(ctx, pilula.texto, px, yPilula + PILULA_ALTURA / 2 + 1, {
    fonte: pilula.fontePronta,
    cor: p.texto,
    alinhamento: "center",
    base: "middle",
  });
}

export async function gerarOnzeInicial(dados: DadosOnzeInicial): Promise<HTMLCanvasElement> {
  await prepararFontes();
  const p = paleta(dados.clube);
  // As fotos carregam em paralelo; as que falharem ou demorarem mais de 10 s ficam a null e usam o círculo sem foto.
  const [escudo, fotos] = await Promise.all([
    carregarEscudo(dados.clube),
    Promise.all(dados.titulares.map((j: JogadorImagem) => carregarImagem(j.fotoUrl))),
  ]);
  const fotoDe = new Map(dados.titulares.map((j, indice) => [j.id, fotos[indice]]));
  const { canvas, ctx } = criarTela(LARGURA, ALTURA_RETRATO);
  desenharFundo(ctx, LARGURA, ALTURA_RETRATO, p);

  // Cabeçalho: escudo, "ONZE INICIAL" e nome do clube (em duas linhas se tiver mais de uma palavra)
  const alturaEscudo = 128;
  const larguraEscudo = desenharEscudo(ctx, escudo, MARGEM, 64, alturaEscudo);
  const xTexto = MARGEM + (larguraEscudo > 0 ? larguraEscudo + 28 : 0);
  escrever(ctx, "ONZE INICIAL", xTexto, 64 + 22, {
    fonte: fonte(600, 32, FONTE_CORPO),
    cor: p.destaque,
    espaco: 4,
  });
  const nomeClube = maiusculas(nomePrincipalClube(dados.clube.nome));
  const partesNome = partirNome(nomeClube);
  const larguraNome = LARGURA - MARGEM - xTexto;
  const tamanhoNome = Math.min(
    ...partesNome.map((parte) => ajustarFonte(ctx, parte, larguraNome, 78, 44, 900, FONTE_TITULO).tamanho),
  );
  const fonteNome = fonte(900, tamanhoNome, FONTE_TITULO);
  if (partesNome.length === 1) {
    escrever(ctx, partesNome[0], xTexto, 64 + alturaEscudo - 6, { fonte: fonteNome, cor: p.texto });
  } else {
    const passoNome = Math.round(tamanhoNome * 0.82);
    partesNome.forEach((parte, indice) => {
      escrever(ctx, parte, xTexto, 162 + indice * passoNome, { fonte: fonteNome, cor: p.texto });
    });
  }

  // Formação em grande, com o adversário e a data ao lado
  const formacao = dados.formacao.replaceAll("-", "–");
  const ajusteFormacao = ajustarFonte(ctx, formacao, 330, 150, 96, 900, FONTE_TITULO);
  escrever(ctx, formacao, MARGEM, 360, { fonte: ajusteFormacao.fonte, cor: p.destaque });
  const xBloco = MARGEM + medir(ctx, formacao, ajusteFormacao.fonte) + 48;
  const larguraBloco = LARGURA - MARGEM - xBloco;

  const vs = ajustarEmLinhas(ctx, maiusculas(`vs ${dados.adversario}`), larguraBloco, 2, 36, 24, 600);
  // A última linha do adversário fica sempre na mesma altura; se houver duas, a primeira sobe.
  let y = 290 - (vs.linhas.length - 1) * (vs.tamanho + 8);
  for (const linha of vs.linhas) {
    escrever(ctx, linha, xBloco, y, { fonte: vs.fonte, cor: p.texto });
    y += vs.tamanho + 8;
  }
  const data = ajustarFonte(ctx, textoData(dados), larguraBloco, 28, 18, 400);
  escrever(ctx, textoData(dados), xBloco, y, { fonte: data.fonte, cor: p.texto2 });
  const local = ajustarFonte(ctx, dados.local, larguraBloco, 28, 18, 400);
  escrever(ctx, dados.local, xBloco, y + data.tamanho + 8, { fonte: local.fonte, cor: p.texto2 });

  // Campo com os titulares nas posições guardadas
  const centroY = criarPosicionadorY(dados.titulares.map((t) => t.y));
  const linhasY = centrosDasLinhas(dados.titulares.map((t) => t.y));
  // Topo da grande área: a meio entre a linha anterior ao guarda-redes (pílulas) e a foto do guarda-redes.
  let topoArea = CAMPO.y + 0.77 * CAMPO.altura;
  if (linhasY.length >= 2 && linhasY.length <= LIMITE_LINHAS_IGUAIS) {
    const guardaRedes = centroY(linhasY[linhasY.length - 1]);
    const anterior = centroY(linhasY[linhasY.length - 2]);
    topoArea = (anterior + ALTURA_COLUNA_ABAIXO + (guardaRedes - ALTURA_COLUNA_ACIMA)) / 2;
  }
  desenharLinhasCampo(ctx, p, topoArea);
  for (const titular of dados.titulares) {
    desenharJogador(ctx, p, titular, fotoDe.get(titular.id) ?? null, centroY(titular.y));
  }

  // Suplentes numa só linha, por baixo do campo
  const suplentes = [...dados.suplentes].sort((a, b) => a.numero - b.numero);
  if (suplentes.length > 0) {
    const baixo = CAMPO.y + CAMPO.altura;
    escrever(ctx, "SUPLENTES", MARGEM, baixo + 33, { fonte: fonte(600, 20, FONTE_CORPO), cor: p.destaque, espaco: 4 });
    const lista = suplentes.map((s) => `${s.numero} ${apelido(s.nome)}`).join("   ·   ");
    const ajuste = ajustarFonte(ctx, lista, LARGURA - 2 * MARGEM, 22, 14, 400);
    escrever(ctx, encurtar(ctx, lista, LARGURA - 2 * MARGEM, ajuste.fonte), MARGEM, baixo + 66, {
      fonte: ajuste.fonte,
      cor: p.texto,
    });
  }

  return canvas;
}
