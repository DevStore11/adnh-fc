import { useState } from "react";
import { Link } from "react-router-dom";
import type { JogoPainel } from "@adnh-fc/shared";
import { FormularioJogo } from "../../components/painel/FormularioJogo";
import { ConfirmarDestrutivo } from "../../components/ui/ConfirmarDestrutivo";
import { Carregando, ErroCarregar, SemDados } from "../../components/ui/Estados";
import { apagarJogo, ErroApi, obterJogosPainel } from "../../lib/api";
import { formatarDataHora, formatarDataLista, formatarPlacar } from "../../lib/formatadores";
import { usarPedido } from "../../lib/usar-pedido";

type Seleccao = { tipo: "nenhuma" } | { tipo: "novo" } | { tipo: "editar"; id: number };

// Agendados primeiro (do mais próximo para o mais distante), depois os terminados (do mais recente para o mais antigo).
function ordenar(jogos: JogoPainel[]): JogoPainel[] {
  const agendados = jogos.filter((j) => j.estado === "agendado").sort((a, b) => a.data.localeCompare(b.data));
  const terminados = jogos.filter((j) => j.estado === "terminado").sort((a, b) => b.data.localeCompare(a.data));
  return [...agendados, ...terminados];
}

export default function PainelJogos() {
  const [epoca, definirEpoca] = useState<string | undefined>(undefined);
  const { estado, recarregar, substituir } = usarPedido((sinal) => obterJogosPainel(epoca, sinal), [epoca]);
  const [seleccao, definirSeleccao] = useState<Seleccao>({ tipo: "nenhuma" });
  const [aApagar, definirAApagar] = useState<JogoPainel | null>(null);
  const [erroApagar, definirErroApagar] = useState<string | null>(null);
  const [aOcupar, definirAOcupar] = useState(false);

  const dados = estado.fase === "pronto" ? estado.dados : null;
  const jogos = dados?.jogos ?? [];
  const agendados = jogos.filter((j) => j.estado === "agendado").length;
  const seleccionado = seleccao.tipo === "editar" ? (jogos.find((j) => j.id === seleccao.id) ?? null) : null;

  function guardarNaLista(jogo: JogoPainel) {
    if (!dados) return;
    const outros = dados.jogos.filter((j) => j.id !== jogo.id);
    // Se a época do jogo mudou, ele deixa de pertencer a esta lista.
    const pertence = jogo.epoca === dados.epoca;
    substituir({
      ...dados,
      epocas: dados.epocas.includes(jogo.epoca) ? dados.epocas : [jogo.epoca, ...dados.epocas],
      jogos: ordenar(pertence ? [...outros, jogo] : outros),
    });
    definirSeleccao(pertence ? { tipo: "editar", id: jogo.id } : { tipo: "nenhuma" });
  }

  async function confirmarApagar(jogo: JogoPainel) {
    if (!dados) return;
    definirAOcupar(true);
    definirErroApagar(null);
    try {
      await apagarJogo(jogo.id);
      substituir({ ...dados, jogos: dados.jogos.filter((j) => j.id !== jogo.id) });
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
            {dados ? `${jogos.length - agendados} terminados · ${agendados} agendados · época ${dados.epoca}` : "Calendário"}
          </p>
          <h1 className="pagina-privada__titulo">Jogos</h1>
        </div>
        <button type="button" className="botao" onClick={() => definirSeleccao({ tipo: "novo" })}>
          Novo jogo
        </button>
      </header>

      <div className="painel-grade">
        <section className="painel-bloco" aria-labelledby="jogos-lista">
          <h2 className="antetitulo" id="jogos-lista">
            Calendário e resultados
          </h2>
          {dados && dados.epocas.length > 1 && (
            <div className="filtros">
              <div className="controlo">
                <label htmlFor="filtro-epoca">Época</label>
                <select
                  id="filtro-epoca"
                  value={dados.epoca}
                  onChange={(e) => {
                    definirSeleccao({ tipo: "nenhuma" });
                    definirEpoca(e.target.value);
                  }}
                >
                  {dados.epocas.map((valor) => (
                    <option key={valor} value={valor}>
                      {valor}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {estado.fase === "carregando" && <Carregando />}
          {estado.fase === "erro" && <ErroCarregar aoTentar={recarregar} />}
          {dados && jogos.length === 0 && (
            <SemDados titulo="Ainda sem jogos" texto={'Use "Novo jogo" para marcar o primeiro desta época.'} />
          )}
          {dados && jogos.length > 0 && (
            <ul className="lista-linhas">
              {ordenar(jogos).map((jogo) => (
                <li
                  key={jogo.id}
                  className={`linha${seleccao.tipo === "editar" && seleccao.id === jogo.id ? " linha--seleccionada" : ""}`}
                >
                  <span className="linha__data">{formatarDataLista(jogo.data)}</span>
                  <div className="linha__texto">
                    <p className="linha__nome">{jogo.adversario}</p>
                    <p className="linha__apoio">
                      {jogo.estado === "agendado" ? "Agendado" : "Terminado"} · {jogo.competicao} ·{" "}
                      {formatarDataHora(jogo.data)}
                    </p>
                  </div>
                  {jogo.estado === "terminado" && jogo.golosPro !== null && jogo.golosContra !== null && (
                    <span className="linha__placar">{formatarPlacar(jogo.golosPro, jogo.golosContra)}</span>
                  )}
                  <Link to={`/painel/jogos/${jogo.id}/convocatoria`} className="ligacao" aria-label={`Abrir jogo com ${jogo.adversario}`}>
                    Abrir
                  </Link>
                  <button
                    type="button"
                    className="ligacao ligacao--botao"
                    aria-label={`Editar jogo com ${jogo.adversario}`}
                    onClick={() => definirSeleccao({ tipo: "editar", id: jogo.id })}
                  >
                    Editar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {dados && seleccao.tipo !== "nenhuma" && (seleccao.tipo === "novo" || seleccionado) && (
          <section className="painel-bloco" aria-labelledby="jogos-formulario">
            <h2 className="antetitulo" id="jogos-formulario">
              {seleccao.tipo === "novo" ? "Criar jogo" : "Editar jogo"}
            </h2>
            <FormularioJogo
              // A versão faz parte da chave: ao carregar o estado actual, o formulário volta a começar com ele.
              key={seleccao.tipo === "novo" ? "novo" : `${seleccionado?.id}:${seleccionado?.versao}`}
              jogo={seleccionado}
              epocaPorOmissao={dados.epoca}
              aoGuardar={guardarNaLista}
              aoConflito={guardarNaLista}
              aoApagar={() => {
                definirErroApagar(null);
                definirAApagar(seleccionado);
              }}
              aoCancelar={() => definirSeleccao({ tipo: "nenhuma" })}
            />
          </section>
        )}
      </div>

      {aApagar && (
        <ConfirmarDestrutivo
          titulo={`Apagar o jogo com ${aApagar.adversario}?`}
          texto="Só se apaga um jogo agendado e sem convocatória nem eventos. Esta acção não pode ser desfeita."
          rotuloConfirmar="Apagar jogo"
          aOcupar={aOcupar}
          erro={erroApagar}
          aoCancelar={() => definirAApagar(null)}
          aoConfirmar={() => void confirmarApagar(aApagar)}
        />
      )}
    </div>
  );
}
