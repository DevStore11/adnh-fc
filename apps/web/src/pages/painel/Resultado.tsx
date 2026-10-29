import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { SecaoImagensPainel } from "../../components/imagens/SecaoImagensPainel";
import { PaginaJogo } from "../../components/painel/PaginaJogo";
import { guardarResultado } from "../../lib/api";
import type { ContextoJogo } from "../../lib/usar-jogo-painel";

function Conteudo({ contexto }: { contexto: ContextoJogo }) {
  const { detalhe, aOcupar, executar } = contexto;
  const { jogo } = detalhe;
  const convocados = detalhe.jogadores.filter((j) => j.convocado);
  const golosRegistados = detalhe.eventos.filter((e) => e.tipo === "golo").length;
  const sofridosRegistados = detalhe.eventos.filter((e) => e.tipo === "golo_sofrido").length;

  const [golosPro, definirGolosPro] = useState(String(jogo.golosPro ?? golosRegistados));
  const [golosContra, definirGolosContra] = useState(String(jogo.golosContra ?? sofridosRegistados));
  const [mvp, definirMvp] = useState<number | null>(jogo.mvpPlayerId);
  const [descricao, definirDescricao] = useState(jogo.mvpDescricao ?? "");
  const [erro, definirErro] = useState<string | null>(null);

  const terminado = jogo.estado === "terminado";

  function resumo(id: number): string {
    const golos = detalhe.eventos.filter((e) => e.playerId === id && e.tipo === "golo").length;
    const assistencias = detalhe.eventos.filter((e) => e.playerId === id && e.tipo === "assist").length;
    const partes = [
      golos > 0 ? `${golos} ${golos === 1 ? "golo" : "golos"}` : null,
      assistencias > 0 ? `${assistencias} ${assistencias === 1 ? "assistência" : "assistências"}` : null,
    ].filter(Boolean);
    return partes.length > 0 ? partes.join(", ") : "sem registo";
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    const pro = Number(golosPro);
    const contra = Number(golosContra);
    if (![pro, contra].every((n) => Number.isInteger(n) && n >= 0 && n <= 99)) {
      definirErro("Os golos têm de ser números inteiros entre 0 e 99.");
      return;
    }
    if (pro < golosRegistados) {
      definirErro(`Há ${golosRegistados} golos registados: o placar não pode ser inferior.`);
      return;
    }
    if (contra < sofridosRegistados) {
      definirErro(`Há ${sofridosRegistados} golos sofridos registados: o placar não pode ser inferior.`);
      return;
    }
    definirErro(null);
    await executar((versao) =>
      guardarResultado(jogo.id, {
        versao,
        golosPro: pro,
        golosContra: contra,
        mvpPlayerId: mvp,
        mvpDescricao: descricao.trim() === "" ? null : descricao.trim(),
      }),
    );
  }

  return (
    <form onSubmit={(evento) => void aoSubmeter(evento)} noValidate>
      <div className="painel-grade">
        <section className="painel-bloco" aria-labelledby="fecho-mvp">
          <h2 className="antetitulo" id="fecho-mvp">
            Homem do jogo
          </h2>
          {convocados.length === 0 ? (
            <p className="jogo__apoio">Sem convocados: escolha primeiro a convocatória.</p>
          ) : (
            <fieldset className="controlo--grupo">
              <legend className="so-leitores">Homem do jogo</legend>
              <ul className="lista-linhas">
                {convocados.map((jogador) => (
                  <li key={jogador.id} className={`linha${mvp === jogador.id ? " linha--seleccionada" : ""}`}>
                    <label className="convocado">
                      <input
                        type="radio"
                        name="mvp"
                        checked={mvp === jogador.id}
                        onChange={() => definirMvp(jogador.id)}
                      />
                      <span className="convocado__caixa convocado__caixa--radio" aria-hidden="true" />
                      <span className="linha__numero">{jogador.numero}</span>
                      <span className="linha__texto">
                        <span className="linha__nome">{jogador.nome}</span>
                        <span className="linha__apoio linha__apoio--bloco">{resumo(jogador.id)}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}
          {mvp !== null && (
            <button type="button" className="ligacao ligacao--botao" onClick={() => definirMvp(null)}>
              Sem homem do jogo
            </button>
          )}
          <div className="controlo">
            <label htmlFor="fecho-descricao">Descrição (opcional)</label>
            <input
              id="fecho-descricao"
              value={descricao}
              maxLength={200}
              onChange={(e) => definirDescricao(e.target.value)}
            />
            <p className="controlo__ajuda">Aparece na página pública, por exemplo: «Dois golos e uma assistência».</p>
          </div>
          <p className="jogo__apoio">Só jogadores convocados podem ser escolhidos.</p>
        </section>

        <section className="painel-bloco" aria-labelledby="fecho-resultado">
          <h2 className="antetitulo" id="fecho-resultado">
            {terminado ? "Resultado final" : "Terminar jogo"}
          </h2>
          {erro && (
            <div className="aviso-erro" role="alert">
              <p className="aviso-erro__titulo">{erro}</p>
            </div>
          )}
          <div className="formulario">
            <div className="controlo">
              <label htmlFor="fecho-pro">Golos do {detalhe.clube}</label>
              <input
                id="fecho-pro"
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                value={golosPro}
                onChange={(e) => definirGolosPro(e.target.value)}
              />
              <p className="controlo__ajuda">{golosRegistados} registados na etapa dos golos.</p>
            </div>
            <div className="controlo">
              <label htmlFor="fecho-contra">Golos do adversário</label>
              <input
                id="fecho-contra"
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                value={golosContra}
                onChange={(e) => definirGolosContra(e.target.value)}
              />
              <p className="controlo__ajuda">{sofridosRegistados} golos sofridos registados com minuto.</p>
            </div>
            <p className="controlo__ajuda">Ao terminar, o jogo entra nas estatísticas do clube.</p>
            <button type="submit" className="botao" disabled={aOcupar}>
              {aOcupar ? "A guardar…" : terminado ? "Guardar resultado" : "Terminar jogo"}
            </button>
          </div>
        </section>
      </div>

      <div className="formulario__accoes jogo__rodape">
        <Link to={`/painel/jogos/${jogo.id}/golos`} className="botao botao--secundario">
          Voltar
        </Link>
      </div>

      <SecaoImagensPainel detalhe={detalhe} tipos={["homem-do-jogo", "placar-final", "onze-inicial", "convocados"]} />
    </form>
  );
}

export default function Resultado() {
  return <PaginaJogo etapa="resultado">{(contexto) => <Conteudo contexto={contexto} />}</PaginaJogo>;
}
