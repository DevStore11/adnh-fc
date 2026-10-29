import { useState } from "react";
import {
  ESTADOS_JOGADOR,
  POSICOES,
  type EstadoJogador,
  type JogadorPainel,
  type Posicao,
} from "@adnh-fc/shared";
import { FormularioJogador } from "../../components/painel/FormularioJogador";
import { ConfirmarDestrutivo } from "../../components/ui/ConfirmarDestrutivo";
import { Carregando, ErroCarregar, SemDados } from "../../components/ui/Estados";
import { apagarJogador, ErroApi, obterJogadoresPainel } from "../../lib/api";
import { abreviarPosicao, iniciais, tituloGrupo } from "../../lib/formatadores";
import { usarPedido } from "../../lib/usar-pedido";

type Seleccao = { tipo: "nenhuma" } | { tipo: "novo" } | { tipo: "editar"; id: number };

function ordenar(lista: JogadorPainel[]): JogadorPainel[] {
  return [...lista].sort((a, b) => Number(b.activo) - Number(a.activo) || a.numero - b.numero);
}

function rotuloEstado(estado: EstadoJogador): string {
  return `${estado.charAt(0).toUpperCase()}${estado.slice(1)}`;
}

export default function PainelJogadores() {
  const [posicao, definirPosicao] = useState<Posicao | "">("");
  const [estadoFiltro, definirEstadoFiltro] = useState<EstadoJogador | "">("");
  const { estado, recarregar, substituir } = usarPedido(
    (sinal) =>
      obterJogadoresPainel({ posicao: posicao || undefined, estado: estadoFiltro || undefined }, sinal),
    [posicao, estadoFiltro],
  );
  const [seleccao, definirSeleccao] = useState<Seleccao>({ tipo: "nenhuma" });
  const [aApagar, definirAApagar] = useState<JogadorPainel | null>(null);
  const [erroApagar, definirErroApagar] = useState<string | null>(null);
  const [aOcupar, definirAOcupar] = useState(false);

  const jogadores = estado.fase === "pronto" ? estado.dados.jogadores : [];
  const activos = jogadores.filter((j) => j.activo).length;
  const seleccionado =
    seleccao.tipo === "editar" ? (jogadores.find((j) => j.id === seleccao.id) ?? null) : null;

  function guardarNaLista(jogador: JogadorPainel) {
    const outros = jogadores.filter((j) => j.id !== jogador.id);
    // Com filtros activos, só entra na lista se ainda corresponder a eles.
    const corresponde =
      (!posicao || jogador.posicao === posicao) && (!estadoFiltro || jogador.estado === estadoFiltro);
    substituir({ jogadores: ordenar(corresponde ? [...outros, jogador] : outros) });
    definirSeleccao(corresponde ? { tipo: "editar", id: jogador.id } : { tipo: "nenhuma" });
  }

  async function confirmarApagar(jogador: JogadorPainel) {
    definirAOcupar(true);
    definirErroApagar(null);
    try {
      await apagarJogador(jogador.id);
      substituir({ jogadores: jogadores.filter((j) => j.id !== jogador.id) });
      definirAApagar(null);
      definirSeleccao({ tipo: "nenhuma" });
    } catch (falha) {
      definirErroApagar(
        falha instanceof ErroApi && falha.estado === 409
          ? falha.message
          : "Não foi possível apagar. Verifique a ligação e tente de novo.",
      );
    } finally {
      definirAOcupar(false);
    }
  }

  return (
    <div className="pagina-privada">
      <header className="pagina-privada__cabeca">
        <div>
          <p className="antetitulo">
            {estado.fase === "pronto" ? `${jogadores.length} jogadores · ${activos} activos` : "Plantel"}
          </p>
          <h1 className="pagina-privada__titulo">Jogadores</h1>
        </div>
        <button type="button" className="botao" onClick={() => definirSeleccao({ tipo: "novo" })}>
          Novo jogador
        </button>
      </header>

      <div className="painel-grade">
        <section className="painel-bloco" aria-labelledby="jogadores-lista">
          <h2 className="antetitulo" id="jogadores-lista">
            Plantel
          </h2>
          <div className="filtros">
            <div className="controlo">
              <label htmlFor="filtro-posicao">Posição</label>
              <select
                id="filtro-posicao"
                value={posicao}
                onChange={(e) => definirPosicao(e.target.value as Posicao | "")}
              >
                <option value="">Todas</option>
                {POSICOES.map((valor) => (
                  <option key={valor} value={valor}>
                    {tituloGrupo(valor)}
                  </option>
                ))}
              </select>
            </div>
            <div className="controlo">
              <label htmlFor="filtro-estado">Estado</label>
              <select
                id="filtro-estado"
                value={estadoFiltro}
                onChange={(e) => definirEstadoFiltro(e.target.value as EstadoJogador | "")}
              >
                <option value="">Todos</option>
                {ESTADOS_JOGADOR.map((valor) => (
                  <option key={valor} value={valor}>
                    {rotuloEstado(valor)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {estado.fase === "carregando" && <Carregando />}
          {estado.fase === "erro" && <ErroCarregar aoTentar={recarregar} />}
          {estado.fase === "pronto" && jogadores.length === 0 && (
            <SemDados
              titulo={posicao || estadoFiltro ? "Sem resultados" : "Ainda sem jogadores"}
              texto={
                posicao || estadoFiltro
                  ? "Nenhum jogador corresponde aos filtros."
                  : "Use \"Novo jogador\" para inscrever o primeiro."
              }
            />
          )}
          {estado.fase === "pronto" && jogadores.length > 0 && (
            <ul className="lista-linhas">
              {jogadores.map((jogador) => (
                <li
                  key={jogador.id}
                  className={`linha${seleccao.tipo === "editar" && seleccao.id === jogador.id ? " linha--seleccionada" : ""}${jogador.activo ? "" : " linha--inactiva"}`}
                >
                  <span className="linha__numero">{jogador.numero}</span>
                  <span className="linha__foto" aria-hidden="true">
                    {jogador.fotoUrl ? <img src={jogador.fotoUrl} alt="" loading="lazy" /> : iniciais(jogador.nome)}
                  </span>
                  <div className="linha__texto">
                    <p className="linha__nome">{jogador.nome}</p>
                    <p className="linha__apoio">
                      {abreviarPosicao(jogador.posicao)} · {jogador.golos} golos · {jogador.assistencias} assist.
                    </p>
                    {(!jogador.activo || jogador.estado !== "activo") && (
                      <div className="linha__carimbos">
                        {!jogador.activo && <span className="carimbo carimbo--pendente">Inactivo</span>}
                        {jogador.estado === "lesionado" && <span className="carimbo carimbo--pendente">Lesionado</span>}
                        {jogador.estado === "suspenso" && <span className="carimbo carimbo--suspenso">Suspenso</span>}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="ligacao ligacao--botao"
                    aria-label={`Editar ${jogador.nome}`}
                    onClick={() => definirSeleccao({ tipo: "editar", id: jogador.id })}
                  >
                    Editar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {seleccao.tipo !== "nenhuma" && (
          <section className="painel-bloco" aria-labelledby="jogadores-formulario">
            <h2 className="antetitulo" id="jogadores-formulario">
              {seleccao.tipo === "novo" ? "Novo jogador" : "Editar jogador"}
            </h2>
            {(seleccao.tipo === "novo" || seleccionado) && (
              <FormularioJogador
                key={seleccao.tipo === "novo" ? "novo" : `${seleccionado?.id}:${seleccionado?.fotoUrl ?? ""}`}
                jogador={seleccionado}
                aoGuardar={guardarNaLista}
                aoApagar={() => {
                  definirErroApagar(null);
                  definirAApagar(seleccionado);
                }}
                aoCancelar={() => definirSeleccao({ tipo: "nenhuma" })}
              />
            )}
          </section>
        )}
      </div>

      {aApagar && (
        <ConfirmarDestrutivo
          titulo={`Apagar ${aApagar.nome}?`}
          texto="O jogador deixa de existir no plantel. Se já tiver convocatórias ou eventos, não pode ser apagado: marque-o como inactivo."
          rotuloConfirmar={`Apagar ${aApagar.nome}`}
          aOcupar={aOcupar}
          erro={erroApagar}
          aoCancelar={() => definirAApagar(null)}
          aoConfirmar={() => void confirmarApagar(aApagar)}
        />
      )}
    </div>
  );
}
