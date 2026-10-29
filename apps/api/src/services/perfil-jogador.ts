import { jogadorPerfilSchema, type JogadorPerfil } from "@adnh-fc/shared";
import { obterClube } from "../db/queries/clube";
import { contarHomemDoJogo, listarJogosDoJogador, obterJogadorPerfil } from "../db/queries/perfil-jogador";

// Perfil público: só nome, foto, posição, número e números da época actual. Nada pessoal.
export async function montarPerfilJogador(db: D1Database, id: number): Promise<JogadorPerfil | null> {
  const [jogador, clube] = await Promise.all([obterJogadorPerfil(db, id), obterClube(db)]);
  if (!jogador || !clube) return null;
  const [jogos, homemDoJogo] = await Promise.all([
    listarJogosDoJogador(db, id, clube.epoca_actual),
    contarHomemDoJogo(db, id, clube.epoca_actual),
  ]);

  const soma = (campo: "golos" | "assistencias" | "amarelos" | "vermelhos") =>
    jogos.reduce((total, jogo) => total + jogo[campo], 0);

  return jogadorPerfilSchema.parse({
    clube: clube.nome,
    epoca: clube.epoca_actual,
    jogador: {
      id: jogador.id,
      nome: jogador.nome,
      numero: jogador.numero,
      posicao: jogador.posicao,
      fotoUrl: jogador.foto_versao
        ? `/api/publico/jogadores/${jogador.id}/foto?v=${encodeURIComponent(jogador.foto_versao)}`
        : null,
    },
    estatisticas: {
      jogos: jogos.length,
      titular: jogos.filter((jogo) => jogo.titular === 1).length,
      golos: soma("golos"),
      assistencias: soma("assistencias"),
      amarelos: soma("amarelos"),
      vermelhos: soma("vermelhos"),
      homemDoJogo,
    },
    jogos: jogos.slice(0, 10).map((jogo) => ({
      id: jogo.id,
      adversario: jogo.adversario,
      data: jogo.data,
      golosPro: jogo.golos_pro,
      golosContra: jogo.golos_contra,
      titular: jogo.titular === 1,
      golos: jogo.golos,
      assistencias: jogo.assistencias,
      amarelos: jogo.amarelos,
      vermelhos: jogo.vermelhos,
    })),
  });
}
