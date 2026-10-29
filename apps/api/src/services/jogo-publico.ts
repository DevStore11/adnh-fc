import { jogoPublicoSchema, type JogoPublico } from "@adnh-fc/shared";
import { obterClube } from "../db/queries/clube";
import { listarEventos, listarJogadoresDoJogo, obterJogoCompleto } from "../db/queries/jogo-detalhe";
import { listarEventosPublicos } from "../db/queries/publico-jogos";

function lerPosicao(texto: string | null): { x: number; y: number } | null {
  if (!texto) return null;
  try {
    const { x, y } = JSON.parse(texto) as { x?: unknown; y?: unknown };
    return typeof x === "number" && typeof y === "number" ? { x, y } : null;
  } catch {
    return null;
  }
}

// Dados públicos de um jogo. A convocatória e o onze só saem depois de publicados; marcadores e homem do jogo,
// só com o jogo terminado.
export async function montarJogoPublico(db: D1Database, id: number): Promise<JogoPublico | null> {
  const [jogo, clube] = await Promise.all([obterJogoCompleto(db, id), obterClube(db)]);
  if (!jogo || !clube) return null;
  const [jogadores, eventos, eventosPublicos] = await Promise.all([
    listarJogadoresDoJogo(db, id),
    listarEventos(db, id),
    jogo.estado === "terminado" ? listarEventosPublicos(db, id) : Promise.resolve([]),
  ]);

  const publico = (j: (typeof jogadores)[number]) => ({
    id: j.id,
    nome: j.nome,
    numero: j.numero,
    posicao: j.posicao,
    fotoUrl: j.foto_versao ? `/api/publico/jogadores/${j.id}/foto?v=${encodeURIComponent(j.foto_versao)}` : null,
  });
  const terminado = jogo.estado === "terminado";

  const convocados = jogo.convocatoria_publicada === 1 ? jogadores.filter((j) => j.convocado === 1).map(publico) : null;

  const titulares = jogadores.flatMap((j) => {
    const posicao = j.titular === 1 ? lerPosicao(j.posicao_campo) : null;
    return posicao ? [{ ...publico(j), ...posicao }] : [];
  });
  const onze =
    jogo.escalacao_publicada === 1 && jogo.formacao && titulares.length > 0
      ? { formacao: jogo.formacao, titulares, suplentes: jogadores.filter((j) => j.suplente === 1).map(publico) }
      : null;

  const golos = terminado ? eventos.filter((e) => e.tipo === "golo" && e.player_id !== null) : [];
  const nomeDe = new Map(jogadores.map((j) => [j.id, j.nome]));
  const marcadores = golos.flatMap((e) => {
    const nome = nomeDe.get(e.player_id as number);
    return nome ? [{ minuto: e.minuto, nome }] : [];
  });

  const mvp = terminado && jogo.mvp_player_id !== null ? jogadores.find((j) => j.id === jogo.mvp_player_id) : undefined;
  const homemDoJogo = mvp
    ? {
        jogador: publico(mvp),
        golos: eventos.filter((e) => e.tipo === "golo" && e.player_id === mvp.id).length,
        assistencias: eventos.filter((e) => e.tipo === "assist" && e.player_id === mvp.id).length,
        descricao: jogo.mvp_descricao,
      }
    : null;

  return jogoPublicoSchema.parse({
    clube: {
      nome: clube.nome,
      escudoUrl: clube.tem_escudo ? "/api/publico/clube/escudo" : null,
      corPrimaria: clube.cor_primaria,
      corSecundaria: clube.cor_secundaria,
      epocaActual: clube.epoca_actual,
    },
    jogo: {
      id: jogo.id,
      adversario: jogo.adversario,
      data: jogo.data,
      local: jogo.local,
      competicao: jogo.competicao,
      estado: jogo.estado,
      golosPro: terminado ? jogo.golos_pro : null,
      golosContra: terminado ? jogo.golos_contra : null,
    },
    convocados,
    onze,
    marcadores,
    eventos: eventosPublicos,
    homemDoJogo,
  });
}
