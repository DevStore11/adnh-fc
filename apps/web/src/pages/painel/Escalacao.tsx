import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { FORMACOES, TITULARES, type Formacao, type JogadorDoJogo } from "@adnh-fc/shared";
import { CampoEditavel, type LugarNoEditor } from "../../components/campo/CampoEditavel";
import { EscolherJogador, usarPainelLateral } from "../../components/campo/EscolherJogador";
import { SecaoImagensPainel } from "../../components/imagens/SecaoImagensPainel";
import { PaginaJogo } from "../../components/painel/PaginaJogo";
import { guardarEscalacao } from "../../lib/api";
import {
  atribuirALugares,
  distribuir,
  lugaresDaFormacao,
  simularColocacao,
  sugerirOnze,
  type OnzePorLugar,
} from "../../lib/formacoes";
import { abreviarPosicao } from "../../lib/formatadores";
import type { ContextoJogo } from "../../lib/usar-jogo-painel";

const FORMACAO_INICIAL: Formacao = "4-3-3";

function Conteudo({ contexto }: { contexto: ContextoJogo }) {
  const { detalhe, aOcupar, executar } = contexto;
  const { jogo } = detalhe;
  const convocados = detalhe.jogadores.filter((j) => j.convocado);
  const terminado = jogo.estado === "terminado";

  const [formacao, definirFormacao] = useState<Formacao>(jogo.formacao ?? FORMACAO_INICIAL);
  // O onze é um jogador (id) por lugar da formação.
  const [onze, definirOnze] = useState<OnzePorLugar>(() => {
    const inicial = jogo.formacao ?? FORMACAO_INICIAL;
    const guardados = detalhe.jogadores
      .filter((j) => j.titular && j.x !== null && j.y !== null)
      .map((j) => ({ id: j.id, x: j.x ?? 0.5, y: j.y ?? 0.5 }));
    if (guardados.length > 0) return atribuirALugares(inicial, guardados);
    // Sem escalação guardada, propõe-se um onze que encaixe na formação.
    return convocados.length >= TITULARES
      ? atribuirALugares(inicial, distribuir(inicial, sugerirOnze(inicial, convocados)))
      : lugaresDaFormacao(inicial).map(() => null);
  });
  const [lugarAberto, definirLugarAberto] = useState<number | null>(null);
  const gatilho = useRef<HTMLElement | null>(null);
  const painelLateral = usarPainelLateral();

  const lugares = useMemo(() => lugaresDaFormacao(formacao), [formacao]);
  const porId = new Map(detalhe.jogadores.map((j) => [j.id, j]));
  const idsNoOnze = onze.filter((id): id is number => id !== null);
  const suplentes = convocados.filter((j) => !idsNoOnze.includes(j.id));
  const guardaRedes = idsNoOnze.filter((id) => porId.get(id)?.posicao === "guarda-redes").length;
  const valida = idsNoOnze.length === TITULARES && guardaRedes === 1;

  function fechar() {
    definirLugarAberto(null);
    // O foco volta ao lugar que abriu a lista.
    gatilho.current?.focus();
  }

  function abrir(indice: number, botao: HTMLButtonElement) {
    if (terminado || aOcupar) return;
    gatilho.current = botao;
    definirLugarAberto(indice);
    if (!painelLateral) {
      // A folha cobre cerca de 56% do ecrã: o lugar tocado sobe para a parte visível por cima dela.
      const caixa = botao.getBoundingClientRect();
      const limite = window.innerHeight * 0.44;
      if (caixa.bottom > limite - 8 || caixa.top < 8) {
        window.scrollBy({ top: caixa.top + caixa.height / 2 - limite / 2, behavior: "instant" });
      }
    }
  }

  function escolher(jogadorId: number) {
    if (lugarAberto === null) return;
    definirOnze(simularColocacao(onze, lugarAberto, jogadorId));
    fechar();
  }

  function retirar() {
    if (lugarAberto === null) return;
    definirOnze(onze.map((id, indice) => (indice === lugarAberto ? null : id)));
    fechar();
  }

  function escolherFormacao(nova: Formacao) {
    definirFormacao(nova);
    definirLugarAberto(null);
    if (idsNoOnze.length === 0 && convocados.length >= TITULARES) {
      definirOnze(atribuirALugares(nova, distribuir(nova, sugerirOnze(nova, convocados))));
      return;
    }
    // Os titulares actuais passam para os lugares da nova formação.
    const jogadores = idsNoOnze.map((id) => porId.get(id)).filter((j): j is JogadorDoJogo => j !== undefined);
    definirOnze(atribuirALugares(nova, distribuir(nova, jogadores)));
  }

  function guardar(publicada: boolean) {
    definirLugarAberto(null);
    void executar((versao) =>
      guardarEscalacao(jogo.id, {
        versao,
        formacao,
        titulares: lugares.flatMap((lugar) => {
          const id = onze[lugar.indice];
          return id === null ? [] : [{ id, x: lugar.x, y: lugar.y }];
        }),
        suplentes: suplentes.map((j) => j.id),
        publicada,
      }),
    );
  }

  // Escape fecha a lista, salvo se a confirmação de "Retirar do onze" estiver aberta (essa trata do seu Escape).
  function aoTeclar(evento: KeyboardEvent) {
    if (evento.key !== "Escape" || lugarAberto === null) return;
    if ((evento.target as HTMLElement).closest("dialog.modal")) return;
    evento.preventDefault();
    fechar();
  }

  if (convocados.length < TITULARES) {
    return (
      <div className="estado">
        <p className="antetitulo">Falta a convocatória</p>
        <h2 className="estado__titulo">Convoque pelo menos 11 jogadores</h2>
        <p className="estado__texto">A escalação só pode ser feita com jogadores convocados.</p>
        <Link to={`/painel/jogos/${jogo.id}/convocatoria`} className="botao">
          Ir para a convocatória
        </Link>
      </div>
    );
  }

  const noEditor: LugarNoEditor[] = lugares.map((lugar) => {
    const id = onze[lugar.indice];
    const jogador = id === null ? undefined : porId.get(id);
    return {
      ...lugar,
      jogador: jogador ? { id: jogador.id, nome: jogador.nome, numero: jogador.numero, fotoUrl: jogador.fotoUrl } : null,
    };
  });
  const lugarSeleccionado = lugarAberto === null ? null : lugares[lugarAberto];

  let problema: string | null = null;
  if (idsNoOnze.length !== TITULARES) problema = `Faltam ${TITULARES - idsNoOnze.length} titulares no campo.`;
  else if (guardaRedes !== 1) problema = "O onze inicial tem de ter exactamente um guarda-redes.";

  const lista = lugarSeleccionado && (
    <EscolherJogador
      painel={painelLateral}
      lugar={lugarSeleccionado}
      lugares={lugares}
      onze={onze}
      jogadores={porId}
      convocados={convocados}
      conviteConvocatoria={`/painel/jogos/${jogo.id}/convocatoria`}
      aoEscolher={escolher}
      aoRetirar={retirar}
      aoFechar={fechar}
    />
  );

  return (
    <div onKeyDown={aoTeclar}>
      <div className="formacoes" role="group" aria-label="Formação">
        <p className="controlo__rotulo">Formação</p>
        <div className="formacoes__botoes">
          {FORMACOES.map((valor) => (
            <button
              key={valor}
              type="button"
              className={`formacao${valor === formacao ? " formacao--activa" : ""}`}
              aria-pressed={valor === formacao}
              disabled={terminado || aOcupar}
              onClick={() => escolherFormacao(valor)}
            >
              {valor}
            </button>
          ))}
        </div>
      </div>

      {terminado && <p className="jogo__apoio jogo__nota">Jogo terminado: a escalação já não pode ser alterada.</p>}

      <div className="painel-grade painel-grade--campo">
        <div>
          <CampoEditavel
            lugares={noEditor}
            seleccionado={lugarAberto}
            escurecido={lugarAberto !== null && !painelLateral}
            bloqueado={terminado || aOcupar}
            aoAbrir={abrir}
          />
          {!painelLateral && lista}
        </div>

        <div className="escalacao__lateral">
          {painelLateral && lista}

          <aside className="painel-bloco" aria-label="Suplentes e acções">
            <h2 className="antetitulo">Suplentes ({suplentes.length} convocados)</h2>
            <ul className="lista-linhas">
              {suplentes.map((jogador) => (
                <li key={jogador.id} className="linha">
                  <span className="linha__numero">{jogador.numero}</span>
                  <span className="linha__nome linha__texto">{jogador.nome}</span>
                  <span className="convocado__posicao">{abreviarPosicao(jogador.posicao)}</span>
                </li>
              ))}
            </ul>

            <p className={`contador contador--medio${valida ? "" : " contador--erro"}`} aria-live="polite">
              {idsNoOnze.length}
              <span className="contador__legenda"> / {TITULARES} titulares no campo</span>
            </p>
            {problema ? (
              <p className="jogo__apoio">{problema}</p>
            ) : (
              <p className="jogo__apoio">Onze completo. Toque num jogador para trocar ou retirar.</p>
            )}
            <p className="jogo__apoio">
              {jogo.escalacaoPublicada ? "Publicada: o público já vê o onze." : "Rascunho: o público ainda não vê o onze."}
            </p>

            <div className="formulario__accoes formulario__accoes--coluna">
              <button
                type="button"
                className="botao"
                disabled={!valida || aOcupar || terminado}
                onClick={() => guardar(jogo.escalacaoPublicada)}
              >
                {aOcupar ? "A guardar…" : "Guardar escalação"}
              </button>
              {jogo.escalacaoPublicada ? (
                <button
                  type="button"
                  className="botao botao--secundario"
                  disabled={!valida || aOcupar || terminado}
                  onClick={() => guardar(false)}
                >
                  Retirar do público
                </button>
              ) : (
                <button
                  type="button"
                  className="botao botao--secundario"
                  disabled={!valida || aOcupar || terminado}
                  onClick={() => guardar(true)}
                >
                  Guardar e publicar
                </button>
              )}
              <div className="formulario__accoes">
                <Link to={`/painel/jogos/${jogo.id}/convocatoria`} className="botao botao--secundario">
                  Voltar
                </Link>
                <Link to={`/painel/jogos/${jogo.id}/golos`} className="botao botao--secundario">
                  Seguinte: Golos
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <p className="jogo__apoio jogo__nota">
        Toque num lugar do campo para escolher ou trocar o jogador. Os lugares vazios têm +. Nada se arrasta.
      </p>

      <SecaoImagensPainel detalhe={detalhe} tipos={["onze-inicial"]} />
    </div>
  );
}

export default function Escalacao() {
  return <PaginaJogo etapa="escalacao">{(contexto) => <Conteudo contexto={contexto} />}</PaginaJogo>;
}
