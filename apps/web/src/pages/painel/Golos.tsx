import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { EventoJogo, JogoDetalhe, TipoEvento } from "@adnh-fc/shared";
import { PaginaJogo } from "../../components/painel/PaginaJogo";
import { ConfirmarDestrutivo } from "../../components/ui/ConfirmarDestrutivo";
import { apagarEvento, registarEvento } from "../../lib/api";
import { dividirNomeClube, sigla } from "../../lib/formatadores";
import type { ContextoJogo } from "../../lib/usar-jogo-painel";

const TIPOS_FORMULARIO: { valor: Exclude<TipoEvento, "assist">; rotulo: string }[] = [
  { valor: "golo", rotulo: "Golo" },
  { valor: "amarelo", rotulo: "Cartão amarelo" },
  { valor: "vermelho", rotulo: "Cartão vermelho" },
  { valor: "golo_sofrido", rotulo: "Golo sofrido" },
];

function contar(detalhe: JogoDetalhe, tipo: TipoEvento): number {
  return detalhe.eventos.filter((e) => e.tipo === tipo).length;
}

function Conteudo({ contexto }: { contexto: ContextoJogo }) {
  const { detalhe, aOcupar, executar } = contexto;
  const { jogo } = detalhe;
  const convocados = detalhe.jogadores.filter((j) => j.convocado);
  const nomeDe = (id: number | null) => detalhe.jogadores.find((j) => j.id === id)?.nome ?? "—";

  const [tipo, definirTipo] = useState<Exclude<TipoEvento, "assist">>("golo");
  const [jogadorId, definirJogadorId] = useState("");
  const [assistenteId, definirAssistenteId] = useState("");
  const [minuto, definirMinuto] = useState("");
  const [erroFormulario, definirErroFormulario] = useState<string | null>(null);
  const [aApagar, definirAApagar] = useState<EventoJogo | null>(null);

  const golosPro = jogo.golosPro ?? contar(detalhe, "golo");
  const golosContra = jogo.golosContra ?? contar(detalhe, "golo_sofrido");

  // A assistência de um golo (mesmo minuto) aparece na linha do golo; as restantes aparecem à parte.
  const minutosDeGolo = new Set(detalhe.eventos.filter((e) => e.tipo === "golo").map((e) => e.minuto));
  const linhas = detalhe.eventos.filter((e) => !(e.tipo === "assist" && minutosDeGolo.has(e.minuto)));

  function descricao(evento: EventoJogo): { titulo: string; apoio: string } {
    switch (evento.tipo) {
      case "golo": {
        const assistencia = detalhe.eventos.find((e) => e.tipo === "assist" && e.minuto === evento.minuto);
        return {
          titulo: nomeDe(evento.playerId),
          apoio: assistencia ? `Assistência: ${nomeDe(assistencia.playerId)}` : "Sem assistência",
        };
      }
      case "assist":
        return { titulo: nomeDe(evento.playerId), apoio: "Assistência" };
      case "amarelo":
        return { titulo: nomeDe(evento.playerId), apoio: "Cartão amarelo" };
      case "vermelho":
        return { titulo: nomeDe(evento.playerId), apoio: "Cartão vermelho" };
      case "golo_sofrido":
        return { titulo: "Golo sofrido", apoio: "Golo do adversário" };
    }
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    const minutoNumero = Number(minuto);
    if (minuto === "" || !Number.isInteger(minutoNumero) || minutoNumero < 0 || minutoNumero > 130) {
      definirErroFormulario("Indique o minuto (de 0 a 130).");
      return;
    }
    if (tipo !== "golo_sofrido" && !jogadorId) {
      definirErroFormulario("Escolha o jogador.");
      return;
    }
    definirErroFormulario(null);
    await executar((versao) =>
      registarEvento(jogo.id, {
        versao,
        tipo,
        playerId: tipo === "golo_sofrido" ? null : Number(jogadorId),
        minuto: minutoNumero,
        assistenteId: tipo === "golo" && assistenteId ? Number(assistenteId) : null,
      }),
    );
  }

  async function confirmarApagar(evento: EventoJogo) {
    const feito = await executar((versao) => apagarEvento(jogo.id, evento.id, versao));
    if (feito) definirAApagar(null);
  }

  if (convocados.length === 0) {
    return (
      <div className="estado">
        <p className="antetitulo">Falta a convocatória</p>
        <h2 className="estado__titulo">Ainda sem convocados</h2>
        <p className="estado__texto">Só jogadores convocados podem marcar, assistir ou ver cartões.</p>
        <Link to={`/painel/jogos/${jogo.id}/convocatoria`} className="botao">
          Ir para a convocatória
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="painel-grade">
        <section className="painel-bloco" aria-labelledby="golos-placar">
          <h2 className="antetitulo" id="golos-placar">
            Placar actual
          </h2>
          <div className="placar" aria-label={`${golosPro} a ${golosContra}`}>
            <span className="placar__equipa">{sigla(dividirNomeClube(detalhe.clube).principal)}</span>
            <span className="placar__golos">
              {golosPro} – {golosContra}
            </span>
            <span className="placar__equipa placar__equipa--contra">{sigla(jogo.adversario)}</span>
          </div>

          <h3 className="controlo__rotulo">Eventos registados</h3>
          {linhas.length === 0 ? (
            <p className="jogo__apoio">Ainda sem eventos. Registe o primeiro ao lado.</p>
          ) : (
            <ul className="lista-linhas">
              {linhas.map((evento) => {
                const texto = descricao(evento);
                return (
                  <li key={evento.id} className="linha">
                    <span className="linha__minuto">{evento.minuto}&apos;</span>
                    <div className="linha__texto">
                      <p className="linha__nome">{texto.titulo}</p>
                      <p className="linha__apoio">{texto.apoio}</p>
                    </div>
                    <button
                      type="button"
                      className="ligacao ligacao--botao ligacao--perigo"
                      disabled={aOcupar}
                      onClick={() => definirAApagar(evento)}
                      aria-label={`Apagar evento do minuto ${evento.minuto}`}
                    >
                      Apagar
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="painel-bloco" aria-labelledby="golos-formulario">
          <h2 className="antetitulo" id="golos-formulario">
            Registar evento
          </h2>
          <form className="formulario" onSubmit={(evento) => void aoSubmeter(evento)} noValidate>
            {erroFormulario && (
              <div className="aviso-erro" role="alert">
                <p className="aviso-erro__titulo">{erroFormulario}</p>
              </div>
            )}
            <div className="controlo">
              <label htmlFor="evento-tipo">Tipo</label>
              <select id="evento-tipo" value={tipo} onChange={(e) => definirTipo(e.target.value as typeof tipo)}>
                {TIPOS_FORMULARIO.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.rotulo}
                  </option>
                ))}
              </select>
            </div>
            {tipo !== "golo_sofrido" && (
              <div className="controlo">
                <label htmlFor="evento-jogador">{tipo === "golo" ? "Marcador (obrigatório)" : "Jogador"}</label>
                <select id="evento-jogador" value={jogadorId} onChange={(e) => definirJogadorId(e.target.value)}>
                  <option value="">Escolher…</option>
                  {convocados.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.numero} · {j.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {tipo === "golo" && (
              <div className="controlo">
                <label htmlFor="evento-assistente">Assistente (opcional)</label>
                <select id="evento-assistente" value={assistenteId} onChange={(e) => definirAssistenteId(e.target.value)}>
                  <option value="">Sem assistência</option>
                  {convocados
                    .filter((j) => String(j.id) !== jogadorId)
                    .map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.numero} · {j.nome}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div className="controlo">
              <label htmlFor="evento-minuto">Minuto</label>
              <input
                id="evento-minuto"
                type="number"
                inputMode="numeric"
                min={0}
                max={130}
                value={minuto}
                onChange={(e) => definirMinuto(e.target.value)}
              />
            </div>
            <button type="submit" className="botao" disabled={aOcupar}>
              {aOcupar ? "A registar…" : "Registar"}
            </button>
            <p className="controlo__ajuda">O placar actualiza ao registar. Só convocados podem marcar, assistir ou ver cartões.</p>
          </form>
        </section>
      </div>

      <div className="formulario__accoes jogo__rodape">
        <Link to={`/painel/jogos/${jogo.id}/escalacao`} className="botao botao--secundario">
          Voltar
        </Link>
        <Link to={`/painel/jogos/${jogo.id}/resultado`} className="botao">
          Seguinte: Fecho
        </Link>
      </div>

      {aApagar && (
        <ConfirmarDestrutivo
          titulo={`Apagar o evento do minuto ${aApagar.minuto}?`}
          texto={
            aApagar.tipo === "golo"
              ? "O golo e a respectiva assistência deixam de contar para o placar e para as estatísticas."
              : "O evento deixa de contar para as estatísticas."
          }
          rotuloConfirmar="Apagar evento"
          aOcupar={aOcupar}
          erro={null}
          aoCancelar={() => definirAApagar(null)}
          aoConfirmar={() => void confirmarApagar(aApagar)}
        />
      )}
    </div>
  );
}

export default function Golos() {
  return <PaginaJogo etapa="golos">{(contexto) => <Conteudo contexto={contexto} />}</PaginaJogo>;
}
