import { POSICOES, type Posicao } from "@adnh-fc/shared";
import {
  ajustarEmLinhas,
  ajustarFonte,
  carregarEscudo,
  carregarImagem,
  criarTela,
  desenharAvatar,
  desenharCobrir,
  desenharEscudo,
  desenharFundo,
  escrever,
  FONTE_CORPO,
  FONTE_TITULO,
  fonte,
  MARGEM,
  maiusculas,
  nomePrincipalClube,
  paleta,
  prepararFontes,
  textoData,
  type Paleta,
} from "./base";
import { ALTURA_RETRATO, LARGURA, type DadosConvocados, type JogadorImagem } from "./tipos";

const TITULOS: Record<Posicao, string> = {
  "guarda-redes": "GUARDA-REDES",
  defesa: "DEFESAS",
  médio: "MÉDIOS",
  avançado: "AVANÇADOS",
};

const LISTA_TOPO = 490;
const LISTA_FUNDO = 1290;
const ESPACO_COLUNAS = 48;
const PESO_TITULO_GRUPO = 1.2;

type Grupo = { posicao: Posicao; jogadores: JogadorImagem[] };

// Reparte os grupos por duas colunas, sem os partir, para ficarem com alturas parecidas.
function repartir(grupos: Grupo[]): [Grupo[], Grupo[]] {
  const peso = (g: Grupo) => g.jogadores.length + PESO_TITULO_GRUPO;
  const total = grupos.reduce((soma, g) => soma + peso(g), 0);
  const esquerda: Grupo[] = [];
  const direita: Grupo[] = [];
  let acumulado = 0;
  for (const grupo of grupos) {
    if (acumulado + peso(grupo) / 2 <= total / 2) esquerda.push(grupo);
    else direita.push(grupo);
    acumulado += peso(grupo);
  }
  return [esquerda, direita];
}

function alturaColuna(grupos: Grupo[]): number {
  return grupos.reduce((soma, g) => soma + g.jogadores.length + PESO_TITULO_GRUPO, 0);
}

function desenharLinha(
  ctx: CanvasRenderingContext2D,
  p: Paleta,
  jogador: JogadorImagem,
  foto: HTMLImageElement | null,
  x: number,
  y: number,
  larguraColuna: number,
  alturaLinha: number,
): void {
  const diametro = Math.min(56, alturaLinha - 10);
  const cy = y + (alturaLinha - diametro) / 2;
  if (foto) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + diametro / 2, cy + diametro / 2, diametro / 2, 0, Math.PI * 2);
    ctx.clip();
    desenharCobrir(ctx, foto, x, cy, diametro, diametro);
    ctx.restore();
  } else {
    desenharAvatar(ctx, jogador.nome, x, cy, diametro, diametro, p, true);
  }

  const xNumero = x + diametro + 16;
  escrever(ctx, String(jogador.numero), xNumero, y + alturaLinha / 2 + 1, {
    fonte: fonte(800, Math.round(Math.min(44, alturaLinha * 0.62)), FONTE_TITULO),
    cor: p.destaque,
    base: "middle",
  });
  const xNome = xNumero + 58;
  const nome = ajustarFonte(ctx, jogador.nome, x + larguraColuna - xNome, Math.round(Math.min(30, alturaLinha * 0.5)), 16, 600);
  escrever(ctx, jogador.nome, xNome, y + alturaLinha / 2 + 1, { fonte: nome.fonte, cor: p.texto, base: "middle" });
}

export async function gerarConvocados(dados: DadosConvocados): Promise<HTMLCanvasElement> {
  await prepararFontes();
  const p = paleta(dados.clube);
  const [escudo, fotos] = await Promise.all([
    carregarEscudo(dados.clube),
    Promise.all(dados.jogadores.map((j) => carregarImagem(j.fotoUrl))),
  ]);
  const fotoDe = new Map(dados.jogadores.map((j, indice) => [j.id, fotos[indice]]));
  const { canvas, ctx } = criarTela(LARGURA, ALTURA_RETRATO);
  desenharFundo(ctx, LARGURA, ALTURA_RETRATO, p);

  // Cabeçalho
  const alturaEscudo = 128;
  const larguraEscudo = desenharEscudo(ctx, escudo, MARGEM, 64, alturaEscudo);
  const xTexto = MARGEM + (larguraEscudo > 0 ? larguraEscudo + 28 : 0);
  escrever(ctx, `CONVOCATÓRIA · ${dados.jogadores.length} JOGADORES`, xTexto, 64 + 22, {
    fonte: fonte(600, 30, FONTE_CORPO),
    cor: p.destaque,
    espaco: 3,
  });
  const nomeClube = maiusculas(nomePrincipalClube(dados.clube.nome));
  const ajusteNome = ajustarFonte(ctx, nomeClube, LARGURA - MARGEM - xTexto, 92, 48, 900, FONTE_TITULO);
  escrever(ctx, nomeClube, xTexto, 64 + alturaEscudo - 6, { fonte: ajusteNome.fonte, cor: p.texto });

  // Adversário, data e local
  const vs = ajustarEmLinhas(ctx, maiusculas(`vs ${dados.adversario}`), LARGURA - 2 * MARGEM, 2, 56, 30, 800, FONTE_TITULO);
  let y = 290;
  for (const linha of vs.linhas) {
    escrever(ctx, linha, MARGEM, y, { fonte: vs.fonte, cor: p.texto });
    y += vs.tamanho + 6;
  }
  const apoio = `${textoData(dados)} · ${dados.local}`;
  const ajusteApoio = ajustarFonte(ctx, apoio, LARGURA - 2 * MARGEM, 28, 18, 400);
  escrever(ctx, apoio, MARGEM, y + 14, { fonte: ajusteApoio.fonte, cor: p.texto2 });

  // Jogadores por posição, em duas colunas
  const grupos: Grupo[] = POSICOES.map((posicao) => ({
    posicao,
    jogadores: dados.jogadores.filter((j) => j.posicao === posicao).sort((a, b) => a.numero - b.numero),
  })).filter((g) => g.jogadores.length > 0);

  const colunas = repartir(grupos);
  const unidades = Math.max(1, alturaColuna(colunas[0]), alturaColuna(colunas[1]));
  const alturaLinha = Math.min(64, (LISTA_FUNDO - LISTA_TOPO) / unidades);
  const larguraColuna = (LARGURA - 2 * MARGEM - ESPACO_COLUNAS) / 2;

  colunas.forEach((coluna, indice) => {
    const x = MARGEM + indice * (larguraColuna + ESPACO_COLUNAS);
    let cursor = LISTA_TOPO;
    for (const grupo of coluna) {
      const alturaTitulo = alturaLinha * PESO_TITULO_GRUPO;
      escrever(ctx, TITULOS[grupo.posicao], x, cursor + alturaTitulo - 14, {
        fonte: fonte(600, 22, FONTE_CORPO),
        cor: p.destaque,
        espaco: 3,
      });
      ctx.fillStyle = p.linha;
      ctx.fillRect(x, cursor + alturaTitulo - 6, larguraColuna, 2);
      cursor += alturaTitulo;
      for (const jogador of grupo.jogadores) {
        desenharLinha(ctx, p, jogador, fotoDe.get(jogador.id) ?? null, x, cursor, larguraColuna, alturaLinha);
        cursor += alturaLinha;
      }
    }
  });

  return canvas;
}
