import { partirNome } from "../lib/formatadores";
import {
  ajustarEmLinhas,
  ajustarFonte,
  carregarEscudo,
  carregarImagem,
  criarTela,
  desenharCobrir,
  desenharEscudo,
  desenharFundo,
  escrever,
  FONTE_CORPO,
  FONTE_TITULO,
  fonte,
  iniciaisDe,
  MARGEM,
  maiusculas,
  nomePrincipalClube,
  paleta,
  prepararFontes,
  quebrarLinhas,
  type Paleta,
} from "./base";
import { ALTURA_RETRATO, LARGURA, type DadosHomemDoJogo } from "./tipos";

const PAINEL = { x: MARGEM, y: 150, largura: 520, altura: 860 };

function rgba(hex: string, alfa: number): string {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${canais[0]}, ${canais[1]}, ${canais[2]}, ${alfa})`;
}

// Painel da foto em duotone da cor do clube; sem foto, as iniciais do jogador em grande.
function desenharPainel(
  ctx: CanvasRenderingContext2D,
  p: Paleta,
  foto: HTMLImageElement | null,
  nome: string,
): void {
  const { x, y, largura, altura } = PAINEL;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, largura, altura);
  ctx.clip();

  if (foto) {
    desenharCobrir(ctx, foto, x, y, largura, altura);
    const veu = ctx.createLinearGradient(0, y, 0, y + altura);
    veu.addColorStop(0, rgba(p.fundo, 0.35));
    veu.addColorStop(1, rgba(p.fundo, 0.85));
    ctx.fillStyle = veu;
    ctx.fillRect(x, y, largura, altura);
  } else {
    const gradiente = ctx.createLinearGradient(0, y, 0, y + altura);
    gradiente.addColorStop(0, rgba(p.texto, 0.04));
    gradiente.addColorStop(1, rgba(p.texto, 0.2));
    ctx.fillStyle = gradiente;
    ctx.fillRect(x, y, largura, altura);
    escrever(ctx, iniciaisDe(nome), x + largura / 2, y + altura * 0.38, {
      fonte: fonte(900, 360, FONTE_TITULO),
      cor: p.texto2,
      alinhamento: "center",
      base: "middle",
    });
  }
  ctx.restore();
}

export async function gerarHomemDoJogo(dados: DadosHomemDoJogo): Promise<HTMLCanvasElement> {
  await prepararFontes();
  const p = paleta(dados.clube);
  const [escudo, foto] = await Promise.all([carregarEscudo(dados.clube), carregarImagem(dados.jogador.fotoUrl)]);
  const { canvas, ctx } = criarTela(LARGURA, ALTURA_RETRATO);
  desenharFundo(ctx, LARGURA, ALTURA_RETRATO, p);

  desenharPainel(ctx, p, foto, dados.jogador.nome);
  // Número da camisola grande, no canto do painel
  escrever(ctx, String(dados.jogador.numero), PAINEL.x + 28, PAINEL.y + PAINEL.altura - 26, {
    fonte: fonte(900, 340, FONTE_TITULO),
    cor: p.destaque,
  });

  // Coluna da direita: título, nome, descrição e números
  const xR = PAINEL.x + PAINEL.largura + 40;
  const larguraR = LARGURA - MARGEM - xR;
  escrever(ctx, "HOMEM DO JOGO", xR, PAINEL.y + 30, { fonte: fonte(600, 30, FONTE_CORPO), cor: p.destaque, espaco: 3 });

  const partes = partirNome(maiusculas(dados.jogador.nome));
  // As duas linhas do nome usam o mesmo tamanho: o da linha mais comprida.
  const tamanhoNome = Math.min(
    ...partes.map((parte) => ajustarFonte(ctx, parte, larguraR, 150, 52, 900, FONTE_TITULO).tamanho),
  );
  let y = PAINEL.y + 70 + tamanhoNome;
  for (const parte of partes) {
    escrever(ctx, parte, xR, y, { fonte: fonte(900, tamanhoNome, FONTE_TITULO), cor: p.texto });
    y += tamanhoNome * 0.95;
  }

  if (dados.descricao) {
    const fonteDescricao = fonte(400, 30, FONTE_CORPO);
    const linhas = quebrarLinhas(ctx, dados.descricao, larguraR, fonteDescricao, 5);
    let yDescricao = y + 24;
    for (const linha of linhas) {
      escrever(ctx, linha, xR, yDescricao, { fonte: fonteDescricao, cor: p.texto2 });
      yDescricao += 40;
    }
  }

  const golos = `${dados.golos} ${dados.golos === 1 ? "GOLO" : "GOLOS"}`;
  const assistencias = `${dados.assistencias} ASSIST.`;
  escrever(ctx, golos, xR, PAINEL.y + PAINEL.altura - 112, {
    fonte: ajustarFonte(ctx, golos, larguraR, 92, 48, 800, FONTE_TITULO).fonte,
    cor: p.destaque,
  });
  escrever(ctx, assistencias, xR, PAINEL.y + PAINEL.altura - 14, {
    fonte: ajustarFonte(ctx, assistencias, larguraR, 92, 48, 800, FONTE_TITULO).fonte,
    cor: p.texto,
  });

  // Rodapé: escudo, resultado e adversário
  const topoRodape = PAINEL.y + PAINEL.altura + 54;
  const larguraEscudo = desenharEscudo(ctx, escudo, MARGEM, topoRodape, 150);
  const xTexto = MARGEM + (larguraEscudo > 0 ? larguraEscudo + 32 : 0);
  const larguraTexto = LARGURA - MARGEM - xTexto;
  const resultado = `${nomePrincipalClube(dados.clube.nome)} ${dados.golosPro} – ${dados.golosContra}`;
  const linhaResultado = ajustarFonte(ctx, resultado, larguraTexto, 46, 28, 600);
  escrever(ctx, resultado, xTexto, topoRodape + 46, { fonte: linhaResultado.fonte, cor: p.texto });
  const adversario = ajustarEmLinhas(ctx, dados.adversario, larguraTexto, 2, 40, 24, 600);
  let yAdversario = topoRodape + 46 + adversario.tamanho + 8;
  for (const linha of adversario.linhas) {
    escrever(ctx, linha, xTexto, yAdversario, { fonte: adversario.fonte, cor: p.texto });
    yAdversario += adversario.tamanho + 6;
  }
  const competicao = ajustarFonte(ctx, dados.competicao, larguraTexto, 26, 16, 400);
  escrever(ctx, dados.competicao, xTexto, Math.max(yAdversario + 8, topoRodape + 140), {
    fonte: competicao.fonte,
    cor: p.texto2,
  });

  return canvas;
}
