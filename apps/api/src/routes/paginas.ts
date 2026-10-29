import type { Context } from "hono";
import type { Posicao } from "@adnh-fc/shared";
import { obterClube } from "../db/queries/clube";
import { obterJogoCompleto } from "../db/queries/jogo-detalhe";
import type { Ambiente } from "../db/schema";
import { montarPerfilJogador } from "../services/perfil-jogador";

// Páginas HTML públicas: o navegador corre a SPA, mas o WhatsApp e outras aplicações só lêem o HTML inicial.
// Por isso o servidor acrescenta aqui o título e as meta-tags de partilha (Open Graph) de cada página.

type Meta = { titulo: string; descricao: string };

const FUSO = "Africa/Maputo";
const NOMES_POSICAO: Record<Posicao, string> = {
  "guarda-redes": "Guarda-redes",
  defesa: "Defesa",
  médio: "Médio",
  avançado: "Avançado",
};

export function escapar(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function dataExtenso(iso: string): string {
  const formatar = (opcoes: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("pt-MZ", { timeZone: FUSO, ...opcoes }).format(new Date(iso));
  return `${formatar({ weekday: "long", day: "numeric", month: "long" })} às ${formatar({ hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

async function metaDaPagina(db: D1Database, caminho: string, nomeClube: string): Promise<Meta> {
  const jogo = /^\/jogos\/(\d+)$/.exec(caminho);
  if (jogo) {
    const dados = await obterJogoCompleto(db, Number(jogo[1]));
    if (dados) {
      if (dados.estado === "terminado" && dados.golos_pro !== null && dados.golos_contra !== null) {
        return {
          titulo: `${nomeClube} ${dados.golos_pro}–${dados.golos_contra} ${dados.adversario}`,
          descricao: `Resultado final · ${dados.competicao} · ${dataExtenso(dados.data)}`,
        };
      }
      return {
        titulo: `${nomeClube} vs ${dados.adversario}`,
        descricao: `${dados.competicao} · ${dataExtenso(dados.data)} · ${dados.local}`,
      };
    }
  }

  const jogador = /^\/jogadores\/(\d+)$/.exec(caminho);
  if (jogador) {
    const perfil = await montarPerfilJogador(db, Number(jogador[1]));
    if (perfil) {
      const { estatisticas: e } = perfil;
      return {
        titulo: `${perfil.jogador.nome} · ${nomeClube}`,
        descricao: `${NOMES_POSICAO[perfil.jogador.posicao]}, n.º ${perfil.jogador.numero} · Época ${perfil.epoca}: ${e.jogos} ${e.jogos === 1 ? "jogo" : "jogos"}, ${e.golos} ${e.golos === 1 ? "golo" : "golos"}, ${e.assistencias} ${e.assistencias === 1 ? "assistência" : "assistências"}`,
      };
    }
  }

  switch (caminho) {
    case "/jogadores":
      return { titulo: `Plantel · ${nomeClube}`, descricao: `Os jogadores de ${nomeClube}, com golos e assistências.` };
    case "/jogos":
      return { titulo: `Jogos · ${nomeClube}`, descricao: `Calendário e resultados de ${nomeClube}.` };
    case "/estatisticas":
      return { titulo: `Estatísticas · ${nomeClube}`, descricao: `Artilheiros, assistências, presenças e cartões de ${nomeClube}.` };
    default:
      return { titulo: nomeClube, descricao: `Resultados, plantel e estatísticas de ${nomeClube}.` };
  }
}

export async function servirPagina(c: Context<Ambiente>): Promise<Response> {
  const url = new URL(c.req.url);
  const resposta = await c.env.ASSETS.fetch(new Request(new URL("/", url).toString()));
  if (!resposta.ok || !(resposta.headers.get("Content-Type") ?? "").includes("text/html")) return resposta;

  let meta: Meta | null = null;
  let imagem = "/escudo.png";
  let nomeClube = "";
  try {
    const clube = await obterClube(c.env.DB);
    if (clube) {
      nomeClube = clube.nome;
      if (clube.tem_escudo) imagem = "/api/publico/clube/escudo";
      meta = await metaDaPagina(c.env.DB, url.pathname.replace(/\/+$/, "") || "/", clube.nome);
    }
  } catch {
    meta = null;
  }
  // Sem dados ou com erro, a página segue como está: a SPA trata do resto.
  if (!meta) return resposta;

  const { titulo: tituloTexto, descricao: descricaoTexto } = meta;
  const titulo = escapar(tituloTexto);
  const descricao = escapar(descricaoTexto);
  const tags = [
    `<meta name="description" content="${descricao}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapar(nomeClube)}" />`,
    `<meta property="og:title" content="${titulo}" />`,
    `<meta property="og:description" content="${descricao}" />`,
    `<meta property="og:url" content="${escapar(url.origin + url.pathname)}" />`,
    `<meta property="og:image" content="${escapar(url.origin + imagem)}" />`,
    `<meta property="og:locale" content="pt_PT" />`,
    `<meta name="twitter:card" content="summary" />`,
  ].join("\n    ");

  return new HTMLRewriter()
    .on("title", { element: (e) => void e.setInnerContent(tituloTexto) })
    .on("head", { element: (e) => void e.append(`\n    ${tags}\n  `, { html: true }) })
    .transform(resposta);
}
