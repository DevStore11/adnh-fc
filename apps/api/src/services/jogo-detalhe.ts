import { jogoDetalheSchema, type JogoDetalhe } from "@adnh-fc/shared";
import {
  listarEventos,
  listarJogadoresDoJogo,
  obterJogoCompleto,
  obterNomeClube,
} from "../db/queries/jogo-detalhe";

function lerPosicao(texto: string | null): { x: number; y: number } | null {
  if (!texto) return null;
  try {
    const { x, y } = JSON.parse(texto) as { x?: unknown; y?: unknown };
    return typeof x === "number" && typeof y === "number" ? { x, y } : null;
  } catch {
    return null;
  }
}

// Estado completo de um jogo para o painel: dados, jogadores com a sua situação e eventos.
export async function montarDetalhe(db: D1Database, id: number): Promise<JogoDetalhe | null> {
  const jogo = await obterJogoCompleto(db, id);
  if (!jogo) return null;
  const [jogadores, eventos, clube] = await Promise.all([
    listarJogadoresDoJogo(db, id),
    listarEventos(db, id),
    obterNomeClube(db),
  ]);

  return jogoDetalheSchema.parse({
    clube,
    jogo: {
      id: jogo.id,
      adversario: jogo.adversario,
      data: jogo.data,
      local: jogo.local,
      competicao: jogo.competicao,
      epoca: jogo.epoca,
      estado: jogo.estado,
      golosPro: jogo.golos_pro,
      golosContra: jogo.golos_contra,
      versao: jogo.versao,
      formacao: jogo.formacao,
      mvpPlayerId: jogo.mvp_player_id,
      mvpDescricao: jogo.mvp_descricao,
      convocatoriaPublicada: jogo.convocatoria_publicada === 1,
      escalacaoPublicada: jogo.escalacao_publicada === 1,
    },
    jogadores: jogadores.map((j) => {
      const posicao = lerPosicao(j.posicao_campo);
      return {
        id: j.id,
        nome: j.nome,
        numero: j.numero,
        posicao: j.posicao,
        estado: j.estado,
        activo: j.activo === 1,
        convocado: j.convocado === 1,
        titular: j.titular === 1,
        suplente: j.suplente === 1,
        x: posicao?.x ?? null,
        y: posicao?.y ?? null,
        fotoUrl: j.foto_versao
          ? `/api/publico/jogadores/${j.id}/foto?v=${encodeURIComponent(j.foto_versao)}`
          : null,
      };
    }),
    eventos: eventos.map((e) => ({ id: e.id, tipo: e.tipo, playerId: e.player_id, minuto: e.minuto })),
  });
}
