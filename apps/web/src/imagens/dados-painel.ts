import { CONVOCADOS_MINIMO, TITULARES, type ClubePublico, type JogadorDoJogo, type JogoDetalhe } from "@adnh-fc/shared";
import { disponivel, indisponivel, type ConjuntoImagens } from "./catalogo";
import type { ClubeImagem, JogadorImagem, JogoImagem } from "./tipos";

export function clubeParaImagem(clube: ClubePublico): ClubeImagem {
  return {
    nome: clube.nome,
    escudoUrl: clube.escudoUrl,
    corPrimaria: clube.corPrimaria,
    corSecundaria: clube.corSecundaria,
  };
}

function jogadorImagem(j: JogadorDoJogo): JogadorImagem {
  return { id: j.id, nome: j.nome, numero: j.numero, posicao: j.posicao, fotoUrl: j.fotoUrl };
}

// No painel as imagens podem ser feitas antes de publicar: dependem só de os dados existirem.
export function imagensDoPainel(detalhe: JogoDetalhe, clube: ClubeImagem): ConjuntoImagens {
  const { jogo } = detalhe;
  const base: JogoImagem = {
    clube,
    adversario: jogo.adversario,
    data: jogo.data,
    local: jogo.local,
    competicao: jogo.competicao,
  };

  const convocados = detalhe.jogadores.filter((j) => j.convocado);
  const titulares = detalhe.jogadores.filter((j) => j.titular);
  const posicoesGuardadas = titulares.every((j) => j.x !== null && j.y !== null);
  const terminado = jogo.estado === "terminado" && jogo.golosPro !== null && jogo.golosContra !== null;
  const nomeDe = new Map(detalhe.jogadores.map((j) => [j.id, j.nome]));
  const mvp = jogo.mvpPlayerId === null ? undefined : detalhe.jogadores.find((j) => j.id === jogo.mvpPlayerId);

  return {
    convocados:
      convocados.length >= CONVOCADOS_MINIMO
        ? disponivel({ ...base, jogadores: convocados.map(jogadorImagem) })
        : indisponivel(`Escolha pelo menos ${CONVOCADOS_MINIMO} convocados.`),

    "onze-inicial":
      jogo.formacao && titulares.length === TITULARES && posicoesGuardadas
        ? disponivel({
            ...base,
            formacao: jogo.formacao,
            titulares: titulares.map((j) => ({ ...jogadorImagem(j), x: j.x ?? 0.5, y: j.y ?? 0.5 })),
            suplentes: detalhe.jogadores.filter((j) => j.suplente).map(jogadorImagem),
          })
        : indisponivel("Guarde a escalação com formação e 11 titulares."),

    "homem-do-jogo":
      terminado && mvp
        ? disponivel({
            ...base,
            golosPro: jogo.golosPro ?? 0,
            golosContra: jogo.golosContra ?? 0,
            jogador: jogadorImagem(mvp),
            golos: detalhe.eventos.filter((e) => e.tipo === "golo" && e.playerId === mvp.id).length,
            assistencias: detalhe.eventos.filter((e) => e.tipo === "assist" && e.playerId === mvp.id).length,
            descricao: jogo.mvpDescricao,
          })
        : indisponivel(terminado ? "Escolha o homem do jogo." : "Termine o jogo e escolha o homem do jogo."),

    "placar-final": terminado
      ? disponivel({
          ...base,
          golosPro: jogo.golosPro ?? 0,
          golosContra: jogo.golosContra ?? 0,
          marcadores: detalhe.eventos.flatMap((e) => {
            const nome = e.tipo === "golo" && e.playerId !== null ? nomeDe.get(e.playerId) : undefined;
            return nome ? [{ minuto: e.minuto, nome }] : [];
          }),
        })
      : indisponivel("Só depois de terminar o jogo."),
  };
}
