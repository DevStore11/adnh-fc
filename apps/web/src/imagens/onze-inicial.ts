import { apelido } from "../lib/formatadores";
import {
  ajustarEmLinhas,
  ajustarFonte,
  carregarEscudo,
  criarTela,
  desenharEscudo,
  desenharFundo,
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
import { ALTURA_RETRATO, LARGURA, type DadosOnzeInicial } from "./tipos";

const CAMPO = { x: MARGEM, y: 450, largura: LARGURA - 2 * MARGEM, altura: 680 };
const RAIO = 34;

// Mesmas linhas do campo do site (viewBox 600×700), esticadas à área do campo.
function desenharLinhasCampo(ctx: CanvasRenderingContext2D, p: Paleta): void {
  const { x, y, largura, altura } = CAMPO;
  const sx = largura / 600;
  const sy = altura / 700;
  ctx.strokeStyle = p.linha;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, largura, altura);
  ctx.beginPath();
  ctx.ellipse(x + 300 * sx, y, 90 * sx, 90 * sy, 0, 0, Math.PI);
  ctx.stroke();
  ctx.strokeRect(x + 120 * sx, y + 490 * sy, 360 * sx, 210 * sy);
  ctx.strokeRect(x + 216 * sx, y + 623 * sy, 168 * sx, 77 * sy);
  ctx.fillStyle = p.linha;
  ctx.beginPath();
  ctx.arc(x + 300 * sx, y + 560 * sy, 3, 0, Math.PI * 2);
  ctx.fill();
}

function desenharJogador(
  ctx: CanvasRenderingContext2D,
  p: Paleta,
  jogador: { numero: number; nome: string; x: number; y: number },
): void {
  const px = CAMPO.x + Math.min(0.94, Math.max(0.06, jogador.x)) * CAMPO.largura;
  const py = CAMPO.y + Math.min(0.9, Math.max(0.07, jogador.y)) * CAMPO.altura;

  ctx.fillStyle = p.texto;
  ctx.beginPath();
  ctx.arc(px, py, RAIO, 0, Math.PI * 2);
  ctx.fill();
  escrever(ctx, String(jogador.numero), px, py + 1, {
    fonte: fonte(800, jogador.numero > 9 ? 40 : 44, FONTE_TITULO),
    cor: p.fundo,
    alinhamento: "center",
    base: "middle",
  });

  // Nome pelo apelido, em maiúsculas; os mais longos encolhem até caberem.
  const nome = maiusculas(apelido(jogador.nome));
  const ajuste = ajustarFonte(ctx, nome, 176, 26, 16, 600, FONTE_CORPO, 1);
  escrever(ctx, nome, px, py + RAIO + 8, {
    fonte: ajuste.fonte,
    cor: p.texto,
    alinhamento: "center",
    base: "top",
    espaco: 1,
  });
}

export async function gerarOnzeInicial(dados: DadosOnzeInicial): Promise<HTMLCanvasElement> {
  await prepararFontes();
  const p = paleta(dados.clube);
  const escudo = await carregarEscudo(dados.clube);
  const { canvas, ctx } = criarTela(LARGURA, ALTURA_RETRATO);
  desenharFundo(ctx, LARGURA, ALTURA_RETRATO, p);

  // Cabeçalho: escudo, "ONZE INICIAL" e nome do clube
  const alturaEscudo = 128;
  const larguraEscudo = desenharEscudo(ctx, escudo, MARGEM, 64, alturaEscudo);
  const xTexto = MARGEM + (larguraEscudo > 0 ? larguraEscudo + 28 : 0);
  escrever(ctx, "ONZE INICIAL", xTexto, 64 + 22, {
    fonte: fonte(600, 32, FONTE_CORPO),
    cor: p.destaque,
    espaco: 4,
  });
  const nomeClube = maiusculas(nomePrincipalClube(dados.clube.nome));
  const ajusteNome = ajustarFonte(ctx, nomeClube, LARGURA - MARGEM - xTexto, 92, 48, 900, FONTE_TITULO);
  escrever(ctx, nomeClube, xTexto, 64 + alturaEscudo - 6, { fonte: ajusteNome.fonte, cor: p.texto });

  // Formação em grande, com o adversário e a data ao lado
  const formacao = dados.formacao.replaceAll("-", "–");
  const fonteFormacao = fonte(900, 170, FONTE_TITULO);
  escrever(ctx, formacao, MARGEM, 410, { fonte: fonteFormacao, cor: p.destaque });
  const xBloco = MARGEM + medir(ctx, formacao, fonteFormacao) + 56;
  const larguraBloco = LARGURA - MARGEM - xBloco;

  const vs = ajustarEmLinhas(ctx, maiusculas(`vs ${dados.adversario}`), larguraBloco, 2, 40, 24, 600);
  let y = 292;
  for (const linha of vs.linhas) {
    escrever(ctx, linha, xBloco, y, { fonte: vs.fonte, cor: p.texto });
    y += vs.tamanho + 8;
  }
  const data = ajustarFonte(ctx, textoData(dados), larguraBloco, 28, 18, 400);
  escrever(ctx, textoData(dados), xBloco, y + 10, { fonte: data.fonte, cor: p.texto2 });
  const local = ajustarFonte(ctx, dados.local, larguraBloco, 28, 18, 400);
  escrever(ctx, dados.local, xBloco, y + 10 + local.tamanho + 8, { fonte: local.fonte, cor: p.texto2 });

  // Campo com os titulares nas posições guardadas
  desenharLinhasCampo(ctx, p);
  for (const titular of dados.titulares) desenharJogador(ctx, p, titular);

  // Suplentes por baixo
  const suplentes = [...dados.suplentes].sort((a, b) => a.numero - b.numero);
  if (suplentes.length > 0) {
    escrever(ctx, "SUPLENTES", MARGEM, 1166, { fonte: fonte(600, 26, FONTE_CORPO), cor: p.destaque, espaco: 4 });
    const lista = suplentes.map((s) => `${s.numero} ${apelido(s.nome)}`).join("   ·   ");
    const ajuste = ajustarEmLinhas(ctx, lista, LARGURA - 2 * MARGEM, 3, 30, 18, 400);
    ajuste.linhas.forEach((linha, indice) => {
      escrever(ctx, linha, MARGEM, 1206 + indice * (ajuste.tamanho + 10), { fonte: ajuste.fonte, cor: p.texto });
    });
  }

  return canvas;
}
