import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CONVOCADOS_MAXIMO,
  CONVOCADOS_MINIMO,
  POSICOES,
  type JogadorDoJogo,
} from "@adnh-fc/shared";
import { SecaoImagensPainel } from "../../components/imagens/SecaoImagensPainel";
import { PaginaJogo } from "../../components/painel/PaginaJogo";
import { Secao } from "../../components/ui/Secao";
import { guardarConvocatoria } from "../../lib/api";
import { abreviarPosicao, tituloGrupo } from "../../lib/formatadores";
import type { ContextoJogo } from "../../lib/usar-jogo-painel";

// Só jogadores activos e em condições (estado "activo") podem ser convocados.
function elegivel(jogador: JogadorDoJogo): boolean {
  return jogador.activo && jogador.estado === "activo";
}

function motivo(jogador: JogadorDoJogo): string | null {
  if (!jogador.activo) return "Inactivo";
  if (jogador.estado === "lesionado") return "Lesionado";
  if (jogador.estado === "suspenso") return "Suspenso";
  return null;
}

function Conteudo({ contexto }: { contexto: ContextoJogo }) {
  const { detalhe, aOcupar, executar } = contexto;
  const { jogo } = detalhe;
  const [seleccionados, definirSeleccionados] = useState(
    () => new Set(detalhe.jogadores.filter((j) => j.convocado).map((j) => j.id)),
  );

  const lista = detalhe.jogadores.filter((j) => elegivel(j) || j.convocado);
  const disponiveis = lista.filter(elegivel).length;
  const total = seleccionados.size;
  const impedidos = lista.filter((j) => seleccionados.has(j.id) && !elegivel(j));
  const valida = total >= CONVOCADOS_MINIMO && total <= CONVOCADOS_MAXIMO && impedidos.length === 0;

  function alternar(id: number) {
    definirSeleccionados((anterior) => {
      const novo = new Set(anterior);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function guardar(publicada: boolean) {
    void executar((versao) =>
      guardarConvocatoria(jogo.id, { versao, jogadores: [...seleccionados], publicada }),
    );
  }

  let estadoTexto = "Convocatória válida";
  if (total < CONVOCADOS_MINIMO) estadoTexto = `Faltam ${CONVOCADOS_MINIMO - total} para o mínimo`;
  else if (total > CONVOCADOS_MAXIMO) estadoTexto = `Máximo de ${CONVOCADOS_MAXIMO} convocados`;
  else if (impedidos.length > 0) estadoTexto = `Desmarque ${impedidos.map((j) => j.nome).join(", ")}`;

  return (
    <>
    <div className="painel-grade painel-grade--jogo">
      <div>
        {POSICOES.map((posicao) => {
          const grupo = lista.filter((j) => j.posicao === posicao);
          if (grupo.length === 0) return null;
          return (
            <Secao key={posicao} antetitulo={tituloGrupo(posicao)}>
              <ul className="lista-linhas">
                {grupo.map((jogador) => {
                  const marcado = seleccionados.has(jogador.id);
                  const bloqueado = !elegivel(jogador) && !marcado;
                  return (
                    <li key={jogador.id} className="linha linha--convocatoria">
                      <label className="convocado">
                        <input
                          type="checkbox"
                          checked={marcado}
                          disabled={bloqueado || aOcupar}
                          onChange={() => alternar(jogador.id)}
                        />
                        <span className="convocado__caixa" aria-hidden="true" />
                        <span className="linha__numero">{jogador.numero}</span>
                        <span className={`linha__nome${marcado ? "" : " linha__nome--suave"}`}>{jogador.nome}</span>
                        {motivo(jogador) && <span className="carimbo carimbo--pendente">{motivo(jogador)}</span>}
                        <span className="convocado__posicao">{abreviarPosicao(jogador.posicao)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </Secao>
          );
        })}
      </div>

      <aside className="painel-bloco" aria-label="Resumo da convocatória">
        <h2 className="antetitulo">Convocados</h2>
        <p className={`contador${total < CONVOCADOS_MINIMO ? " contador--erro" : ""}`} aria-live="polite">
          {total}
        </p>
        <p className="jogo__apoio">
          de {disponiveis} jogadores disponíveis · mínimo {CONVOCADOS_MINIMO} · máximo {CONVOCADOS_MAXIMO}
        </p>
        <p className={valida ? "aviso-ok" : "aviso-erro__titulo"}>{estadoTexto}</p>
        <p className="jogo__apoio">
          {jogo.convocatoriaPublicada ? "Publicada: o público já a pode ver." : "Rascunho: o público ainda não a vê."}
        </p>

        <div className="formulario__accoes formulario__accoes--coluna">
          <button type="button" className="botao" disabled={!valida || aOcupar} onClick={() => guardar(jogo.convocatoriaPublicada)}>
            {aOcupar ? "A guardar…" : "Guardar convocatória"}
          </button>
          {jogo.convocatoriaPublicada ? (
            <button type="button" className="botao botao--secundario" disabled={!valida || aOcupar} onClick={() => guardar(false)}>
              Retirar do público
            </button>
          ) : (
            <button type="button" className="botao botao--secundario" disabled={!valida || aOcupar} onClick={() => guardar(true)}>
              Guardar e publicar
            </button>
          )}
          <Link to={`/painel/jogos/${jogo.id}/escalacao`} className="botao botao--secundario">
            Seguinte: Escalação
          </Link>
        </div>
      </aside>
    </div>
    <SecaoImagensPainel detalhe={detalhe} tipos={["convocados"]} />
    </>
  );
}

export default function Convocatoria() {
  return <PaginaJogo etapa="convocatoria">{(contexto) => <Conteudo contexto={contexto} />}</PaginaJogo>;
}
