import type { JogoPublico } from "@adnh-fc/shared";
import { disponivel, indisponivel, type ConjuntoImagens } from "./catalogo";
import { clubeParaImagem } from "./dados-painel";
import type { JogoImagem } from "./tipos";

// Na página pública só há imagens do que o gestor já publicou (o servidor não envia o resto).
export function imagensPublicas(publico: JogoPublico): ConjuntoImagens {
  const { jogo } = publico;
  const base: JogoImagem = {
    clube: clubeParaImagem(publico.clube),
    adversario: jogo.adversario,
    data: jogo.data,
    local: jogo.local,
    competicao: jogo.competicao,
  };
  const resultado = jogo.estado === "terminado" && jogo.golosPro !== null && jogo.golosContra !== null;
  const golosPro = jogo.golosPro ?? 0;
  const golosContra = jogo.golosContra ?? 0;

  return {
    convocados: publico.convocados
      ? disponivel({ ...base, jogadores: publico.convocados })
      : indisponivel("Convocatória ainda não publicada."),
    "onze-inicial": publico.onze
      ? disponivel({ ...base, ...publico.onze })
      : indisponivel("Onze inicial ainda não publicado."),
    "homem-do-jogo":
      resultado && publico.homemDoJogo
        ? disponivel({
            ...base,
            golosPro,
            golosContra,
            jogador: publico.homemDoJogo.jogador,
            golos: publico.homemDoJogo.golos,
            assistencias: publico.homemDoJogo.assistencias,
            descricao: publico.homemDoJogo.descricao,
          })
        : indisponivel("Sem homem do jogo."),
    "placar-final": resultado
      ? disponivel({ ...base, golosPro, golosContra, marcadores: publico.marcadores })
      : indisponivel("O jogo ainda não terminou."),
  };
}
