import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  convocatoriaEntradaSchema,
  escalacaoEntradaSchema,
  eventoEntradaSchema,
  resultadoEntradaSchema,
  versaoEntradaSchema,
  type AccaoAuditoria,
  type JogoDetalhe,
} from "@adnh-fc/shared";
import type { Ambiente } from "../db/schema";
import { instrucaoAuditoria } from "../lib/auditoria";
import { obterIp } from "../lib/ip";
import { montarDetalhe } from "../services/jogo-detalhe";

// Rotas de gestão de um jogo, montadas em /api/painel/jogos. Usam a sessão e o papel do router do painel.
export const painelJogo = new Hono<Ambiente>();

type Colunas = Record<string, string | number | null>;

function lerId(valor: string): number {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new HTTPException(400, { message: "Pedido inválido" });
  return id;
}

async function lerCorpo(c: Context<Ambiente>): Promise<unknown> {
  return c.req.json().catch(() => null);
}

function conflito(c: Context<Ambiente>, detalhe: JogoDetalhe) {
  return c.json({ erro: "Outro gestor alterou este jogo", codigo: "versao_desactualizada", detalhe }, 409);
}

async function obterDetalheOu404(db: D1Database, id: number): Promise<JogoDetalhe> {
  const detalhe = await montarDetalhe(db, id);
  if (!detalhe) throw new HTTPException(404, { message: "Não encontrado" });
  return detalhe;
}

type Alteracao = {
  accao: AccaoAuditoria;
  // colunas de matches alteradas em conjunto com o incremento da versão (nomes fixos no código, valores por parâmetro)
  colunas?: Colunas;
  instrucoes: D1PreparedStatement[];
};

// Aplica uma alteração só se a versão ainda for a que o gestor viu. A condição fica no próprio UPDATE,
// por isso dois pedidos em simultâneo nunca passam ambos. Devolve null em caso de conflito.
async function aplicar(
  c: Context<Ambiente>,
  id: number,
  versao: number,
  alteracao: Alteracao,
): Promise<JogoDetalhe | null> {
  const db = c.env.DB;
  const colunas = Object.entries(alteracao.colunas ?? {});
  const definicoes = ["versao = versao + 1", ...colunas.map(([nome]) => `${nome} = ?`)].join(", ");

  const reserva = await db
    .prepare(`UPDATE matches SET ${definicoes} WHERE id = ? AND versao = ?`)
    .bind(...colunas.map(([, valor]) => valor), id, versao)
    .run();
  if (reserva.meta.changes === 0) return null;

  await db.batch([
    ...alteracao.instrucoes,
    instrucaoAuditoria(db, {
      userId: c.get("utilizador").id,
      accao: alteracao.accao,
      entidade: "jogo",
      entidadeId: id,
      ip: obterIp(c),
    }),
  ]);
  return obterDetalheOu404(db, id);
}

// Verificações comuns antes de alterar: o jogo existe e a versão enviada é a actual.
async function preparar(c: Context<Ambiente>, versao: number) {
  const id = lerId(c.req.param("id") ?? "");
  const detalhe = await obterDetalheOu404(c.env.DB, id);
  return { id, detalhe, desactualizado: detalhe.jogo.versao !== versao };
}

async function concluir(c: Context<Ambiente>, id: number, versao: number, alteracao: Alteracao, estado = 200) {
  const resultado = await aplicar(c, id, versao, alteracao);
  if (!resultado) return conflito(c, await obterDetalheOu404(c.env.DB, id));
  return c.json(resultado, estado as 200);
}

painelJogo.get("/:id", async (c) => {
  const id = lerId(c.req.param("id"));
  return c.json(await obterDetalheOu404(c.env.DB, id));
});

// Convocatória

painelJogo.put("/:id/convocatoria", async (c) => {
  const corpo = convocatoriaEntradaSchema.safeParse(await lerCorpo(c));
  if (!corpo.success) throw new HTTPException(400, { message: "A convocatória deve ter entre 11 e 22 jogadores" });
  const { versao, jogadores, publicada } = corpo.data;
  const db = c.env.DB;
  const { id, detalhe, desactualizado } = await preparar(c, versao);
  if (desactualizado) return conflito(c, detalhe);

  const porId = new Map(detalhe.jogadores.map((j) => [j.id, j]));
  for (const jogadorId of jogadores) {
    const jogador = porId.get(jogadorId);
    if (!jogador || !jogador.activo || jogador.estado !== "activo") {
      throw new HTTPException(400, { message: "Só jogadores activos (não lesionados nem suspensos) podem ser convocados" });
    }
  }

  const retirados = detalhe.jogadores.filter((j) => j.convocado && !jogadores.includes(j.id));
  for (const retirado of retirados) {
    if (detalhe.eventos.some((e) => e.playerId === retirado.id)) {
      throw new HTTPException(409, {
        message: `${retirado.nome} tem eventos registados neste jogo e não pode sair da convocatória`,
      });
    }
  }

  const colunas: Colunas = { convocatoria_publicada: publicada ? 1 : 0 };
  // Sem um titular, a escalação deixa de estar completa: deixa de ser pública até ser refeita.
  if (retirados.some((j) => j.titular)) colunas.escalacao_publicada = 0;
  if (retirados.some((j) => j.id === detalhe.jogo.mvpPlayerId)) colunas.mvp_player_id = null;

  return concluir(c, id, versao, {
    accao: "jogo_convocatoria",
    colunas,
    instrucoes: [
      ...jogadores.map((jogadorId) =>
        db
          .prepare(
            `INSERT INTO match_squad (match_id, player_id, convocado) VALUES (?, ?, 1)
             ON CONFLICT (match_id, player_id) DO UPDATE SET convocado = 1`,
          )
          .bind(id, jogadorId),
      ),
      ...retirados.map((j) => db.prepare("DELETE FROM match_squad WHERE match_id = ? AND player_id = ?").bind(id, j.id)),
    ],
  });
});

// Escalação

painelJogo.put("/:id/escalacao", async (c) => {
  const corpo = escalacaoEntradaSchema.safeParse(await lerCorpo(c));
  if (!corpo.success) throw new HTTPException(400, { message: "A escalação deve ter exactamente 11 titulares" });
  const { versao, formacao, titulares, suplentes, publicada } = corpo.data;
  const db = c.env.DB;
  const { id, detalhe, desactualizado } = await preparar(c, versao);
  if (desactualizado) return conflito(c, detalhe);

  const convocados = new Map(detalhe.jogadores.filter((j) => j.convocado).map((j) => [j.id, j]));
  if (![...titulares.map((t) => t.id), ...suplentes].every((jogadorId) => convocados.has(jogadorId))) {
    throw new HTTPException(400, { message: "Só jogadores convocados podem ser escalados" });
  }
  const guardaRedes = titulares.filter((t) => convocados.get(t.id)?.posicao === "guarda-redes").length;
  if (guardaRedes !== 1) {
    throw new HTTPException(400, { message: "O onze inicial tem de ter exactamente um guarda-redes" });
  }

  return concluir(c, id, versao, {
    accao: "jogo_escalacao",
    colunas: { formacao, escalacao_publicada: publicada ? 1 : 0 },
    instrucoes: [
      db.prepare("UPDATE match_squad SET titular = 0, suplente = 0, posicao_campo = NULL WHERE match_id = ?").bind(id),
      ...titulares.map((t) =>
        db
          .prepare("UPDATE match_squad SET titular = 1, posicao_campo = ? WHERE match_id = ? AND player_id = ?")
          .bind(JSON.stringify({ x: t.x, y: t.y }), id, t.id),
      ),
      ...suplentes.map((jogadorId) =>
        db.prepare("UPDATE match_squad SET suplente = 1 WHERE match_id = ? AND player_id = ?").bind(id, jogadorId),
      ),
    ],
  });
});

// Resultado

function contar(detalhe: JogoDetalhe, tipo: "golo" | "golo_sofrido"): number {
  return detalhe.eventos.filter((e) => e.tipo === tipo).length;
}

painelJogo.put("/:id/resultado", async (c) => {
  const corpo = resultadoEntradaSchema.safeParse(await lerCorpo(c));
  if (!corpo.success) throw new HTTPException(400, { message: "Dados do resultado inválidos" });
  const { versao, golosPro, golosContra, mvpPlayerId, mvpDescricao } = corpo.data;
  const { id, detalhe, desactualizado } = await preparar(c, versao);
  if (desactualizado) return conflito(c, detalhe);

  if (contar(detalhe, "golo") > golosPro) {
    throw new HTTPException(409, { message: "Há mais golos registados do que o placar indica" });
  }
  if (contar(detalhe, "golo_sofrido") > golosContra) {
    throw new HTTPException(409, { message: "Há mais golos sofridos registados do que o placar indica" });
  }
  if (mvpPlayerId !== null && !detalhe.jogadores.some((j) => j.id === mvpPlayerId && j.convocado)) {
    throw new HTTPException(400, { message: "O homem do jogo tem de ser um jogador convocado" });
  }

  return concluir(c, id, versao, {
    accao: "jogo_resultado",
    colunas: {
      estado: "terminado",
      golos_pro: golosPro,
      golos_contra: golosContra,
      mvp_player_id: mvpPlayerId,
      mvp_descricao: mvpDescricao ? mvpDescricao : null,
    },
    instrucoes: [],
  });
});

// Eventos

painelJogo.post("/:id/eventos", async (c) => {
  const corpo = eventoEntradaSchema.safeParse(await lerCorpo(c));
  if (!corpo.success) throw new HTTPException(400, { message: "Dados do evento inválidos" });
  const { versao, tipo, playerId, minuto, assistenteId } = corpo.data;
  const db = c.env.DB;
  const { id, detalhe, desactualizado } = await preparar(c, versao);
  if (desactualizado) return conflito(c, detalhe);

  for (const jogadorId of [playerId, assistenteId]) {
    if (jogadorId != null && !detalhe.jogadores.some((j) => j.id === jogadorId && j.convocado)) {
      throw new HTTPException(400, { message: "Só jogadores convocados podem ter eventos" });
    }
  }

  // Com o jogo terminado, o número de golos registados não pode passar o placar.
  const { golosPro, golosContra } = detalhe.jogo;
  if (tipo === "golo" && golosPro !== null && contar(detalhe, "golo") + 1 > golosPro) {
    throw new HTTPException(409, { message: "O número de golos registados não pode exceder o placar" });
  }
  if (tipo === "golo_sofrido" && golosContra !== null && contar(detalhe, "golo_sofrido") + 1 > golosContra) {
    throw new HTTPException(409, { message: "O número de golos sofridos registados não pode exceder o placar" });
  }

  const inserir = "INSERT INTO match_events (match_id, player_id, tipo, minuto) VALUES (?, ?, ?, ?)";
  return concluir(
    c,
    id,
    versao,
    {
      accao: "jogo_evento_registado",
      instrucoes: [
        db.prepare(inserir).bind(id, playerId ?? null, tipo, minuto),
        ...(assistenteId != null ? [db.prepare(inserir).bind(id, assistenteId, "assist", minuto)] : []),
      ],
    },
    201,
  );
});

painelJogo.delete("/:id/eventos/:eventoId", async (c) => {
  const corpo = versaoEntradaSchema.safeParse(await lerCorpo(c));
  if (!corpo.success) throw new HTTPException(400, { message: "Pedido inválido" });
  const { versao } = corpo.data;
  const eventoId = lerId(c.req.param("eventoId"));
  const db = c.env.DB;
  const { id, detalhe, desactualizado } = await preparar(c, versao);
  if (desactualizado) return conflito(c, detalhe);

  const evento = detalhe.eventos.find((e) => e.id === eventoId);
  if (!evento) throw new HTTPException(404, { message: "Não encontrado" });

  return concluir(c, id, versao, {
    accao: "jogo_evento_apagado",
    instrucoes: [
      db.prepare("DELETE FROM match_events WHERE id = ? AND match_id = ?").bind(eventoId, id),
      // A assistência de um golo (mesmo minuto) sai com ele.
      ...(evento.tipo === "golo"
        ? [
            db
              .prepare("DELETE FROM match_events WHERE match_id = ? AND tipo = 'assist' AND minuto = ?")
              .bind(id, evento.minuto),
          ]
        : []),
    ],
  });
});
