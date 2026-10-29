import { formatarMinutos, sigla } from "../lib/formatadores";
import {
  ajustarEmLinhas,
  ajustarFonte,
  carregarEscudo,
  criarTela,
  desenharEscudo,
  desenharFundo,
  encurtar,
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
} from "./base";
import { ALTURA_QUADRADO, ALTURA_RETRATO, LARGURA, type DadosPlacarFinal } from "./tipos";

type Medidas = {
  altura: number;
  // topo da faixa escudo · resultado · adversário
  faixaY: number;
  faixaAltura: number;
  tamanhoPlacar: number;
  nomesY: number;
  regraY: number;
  listaTopo: number;
  listaFundo: number;
  alturaMarcador: number;
  rodapeY: number;
};

const MEDIDAS: Record<"retrato" | "quadrado", Medidas> = {
  retrato: {
    altura: ALTURA_RETRATO,
    faixaY: 200,
    faixaAltura: 220,
    tamanhoPlacar: 400,
    nomesY: 500,
    regraY: 600,
    listaTopo: 640,
    listaFundo: 1190,
    alturaMarcador: 64,
    rodapeY: 1270,
  },
  quadrado: {
    altura: ALTURA_QUADRADO,
    faixaY: 160,
    faixaAltura: 170,
    tamanhoPlacar: 250,
    nomesY: 400,
    regraY: 480,
    listaTopo: 510,
    listaFundo: 900,
    alturaMarcador: 52,
    rodapeY: 990,
  },
};

type Marcador = { nome: string; minutos: number[] };

// Junta os golos do mesmo jogador numa linha só, pela ordem do primeiro golo.
function agruparMarcadores(marcadores: DadosPlacarFinal["marcadores"]): Marcador[] {
  const grupos = new Map<string, Marcador>();
  for (const m of [...marcadores].sort((a, b) => a.minuto - b.minuto)) {
    const grupo = grupos.get(m.nome);
    if (grupo) grupo.minutos.push(m.minuto);
    else grupos.set(m.nome, { nome: m.nome, minutos: [m.minuto] });
  }
  return [...grupos.values()];
}

export async function gerarPlacarFinal(dados: DadosPlacarFinal): Promise<HTMLCanvasElement> {
  await prepararFontes();
  const m = MEDIDAS[dados.formato ?? "retrato"];
  const p = paleta(dados.clube);
  const escudo = await carregarEscudo(dados.clube);
  const { canvas, ctx } = criarTela(LARGURA, m.altura);
  desenharFundo(ctx, LARGURA, m.altura, p);

  // Cabeçalho
  const cabecalho = maiusculas(`Terminado · ${dados.competicao}`);
  const ajusteCabecalho = ajustarFonte(ctx, cabecalho, LARGURA - 2 * MARGEM, 32, 18, 600, FONTE_CORPO, 4);
  escrever(ctx, cabecalho, MARGEM, 100, { fonte: ajusteCabecalho.fonte, cor: p.destaque, espaco: 4 });
  ctx.fillStyle = p.linha;
  ctx.fillRect(MARGEM, 124, LARGURA - 2 * MARGEM, 2);

  // Faixa: escudo, resultado e caixa do adversário
  const lado = m.faixaAltura;
  const larguraEscudo = desenharEscudo(ctx, escudo, MARGEM, m.faixaY, lado);
  const xCaixa = LARGURA - MARGEM - lado;
  ctx.strokeStyle = p.texto;
  ctx.lineWidth = 4;
  ctx.strokeRect(xCaixa + 2, m.faixaY + 2, lado - 4, lado - 4);
  const siglaAdversario = maiusculas(sigla(dados.adversario) || dados.adversario.slice(0, 3));
  const ajusteSigla = ajustarFonte(ctx, siglaAdversario, lado - 28, Math.round(lado * 0.5), 28, 900, FONTE_TITULO);
  escrever(ctx, siglaAdversario, xCaixa + lado / 2, m.faixaY + lado / 2, {
    fonte: ajusteSigla.fonte,
    cor: p.texto,
    alinhamento: "center",
    base: "middle",
  });

  const xPlacarIni = MARGEM + Math.max(larguraEscudo, lado * 0.6) + 16;
  const larguraPlacar = xCaixa - 16 - xPlacarIni;
  const placar = `${dados.golosPro} – ${dados.golosContra}`;
  const ajustePlacar = ajustarFonte(ctx, placar, larguraPlacar, m.tamanhoPlacar, 120, 900, FONTE_TITULO);
  escrever(ctx, placar, xPlacarIni + larguraPlacar / 2, m.faixaY + lado / 2 + ajustePlacar.tamanho * 0.04, {
    fonte: ajustePlacar.fonte,
    cor: p.destaque,
    alinhamento: "center",
    base: "middle",
  });

  // Nomes por baixo do escudo e da caixa
  const larguraNome = (LARGURA - 2 * MARGEM) / 2 - 24;
  const nomeClube = ajustarEmLinhas(ctx, maiusculas(nomePrincipalClube(dados.clube.nome)), larguraNome, 2, 44, 24, 800, FONTE_TITULO);
  nomeClube.linhas.forEach((linha, i) => {
    escrever(ctx, linha, MARGEM, m.nomesY + i * (nomeClube.tamanho + 4), { fonte: nomeClube.fonte, cor: p.texto });
  });
  const nomeAdversario = ajustarEmLinhas(ctx, maiusculas(dados.adversario), larguraNome, 2, 44, 24, 800, FONTE_TITULO);
  nomeAdversario.linhas.forEach((linha, i) => {
    escrever(ctx, linha, LARGURA - MARGEM, m.nomesY + i * (nomeAdversario.tamanho + 4), {
      fonte: nomeAdversario.fonte,
      cor: p.texto,
      alinhamento: "right",
    });
  });

  // Marcadores
  ctx.fillStyle = p.linha;
  ctx.fillRect(MARGEM, m.regraY, LARGURA - 2 * MARGEM, 2);
  const marcadores = agruparMarcadores(dados.marcadores);
  const capacidade = Math.floor((m.listaFundo - m.listaTopo) / m.alturaMarcador);
  const visiveis = marcadores.length > capacidade ? marcadores.slice(0, capacidade - 1) : marcadores;
  const colunaNome = MARGEM + 240;
  const tamanhoLinha = Math.round(m.alturaMarcador * 0.55);
  visiveis.forEach((marcador, i) => {
    const y = m.listaTopo + i * m.alturaMarcador + m.alturaMarcador / 2;
    escrever(ctx, formatarMinutos(marcador.minutos), MARGEM, y, {
      fonte: fonte(800, tamanhoLinha, FONTE_TITULO),
      cor: p.destaque,
      base: "middle",
    });
    const fonteNome = fonte(600, tamanhoLinha, FONTE_CORPO);
    escrever(ctx, encurtar(ctx, marcador.nome, LARGURA - MARGEM - colunaNome, fonteNome), colunaNome, y, {
      fonte: fonteNome,
      cor: p.texto,
      base: "middle",
    });
  });
  const escondidos = marcadores.length - visiveis.length;
  if (escondidos > 0) {
    const y = m.listaTopo + visiveis.length * m.alturaMarcador + m.alturaMarcador / 2;
    escrever(ctx, `+ ${escondidos} marcadores`, MARGEM, y, { fonte: fonte(400, tamanhoLinha, FONTE_CORPO), cor: p.texto2, base: "middle" });
  }

  // Rodapé: data e local
  const rodape = `${textoData(dados)} · ${dados.local}`;
  const ajusteRodape = ajustarFonte(ctx, rodape, LARGURA - 2 * MARGEM, 28, 18, 400);
  escrever(ctx, rodape, MARGEM, m.rodapeY, { fonte: ajusteRodape.fonte, cor: p.texto2 });

  return canvas;
}
