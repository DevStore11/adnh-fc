import { useEffect, useRef, useState, type PointerEvent as EventoPonteiro } from "react";
import { Link } from "react-router-dom";
import { FORMACOES, TITULARES, type Formacao, type JogadorDoJogo } from "@adnh-fc/shared";
import { CampoEditavel } from "../../components/campo/CampoEditavel";
import { SecaoImagensPainel } from "../../components/imagens/SecaoImagensPainel";
import { PaginaJogo } from "../../components/painel/PaginaJogo";
import { guardarEscalacao } from "../../lib/api";
import { distribuir, proximoEspacoLivre, sugerirOnze, type Titular } from "../../lib/formacoes";
import type { ContextoJogo } from "../../lib/usar-jogo-painel";

type Arrasto = { id: number; origem: "campo" | "suplente"; x: number; y: number };

const FORMACAO_INICIAL: Formacao = "4-3-3";
const LIMITE = 0.03;

function limitar(valor: number): number {
  return Math.min(1 - LIMITE, Math.max(LIMITE, valor));
}

function Conteudo({ contexto }: { contexto: ContextoJogo }) {
  const { detalhe, aOcupar, executar } = contexto;
  const { jogo } = detalhe;
  const convocados = detalhe.jogadores.filter((j) => j.convocado);

  const [formacao, definirFormacao] = useState<Formacao>(jogo.formacao ?? FORMACAO_INICIAL);
  const [titulares, definirTitulares] = useState<Titular[]>(() => {
    const guardados = detalhe.jogadores.filter((j) => j.titular && j.x !== null && j.y !== null);
    if (guardados.length > 0) return guardados.map((j) => ({ id: j.id, x: j.x ?? 0.5, y: j.y ?? 0.5 }));
    // Sem escalação guardada, propõe-se um onze que encaixe na formação.
    return convocados.length >= TITULARES
      ? distribuir(jogo.formacao ?? FORMACAO_INICIAL, sugerirOnze(jogo.formacao ?? FORMACAO_INICIAL, convocados))
      : [];
  });
  const [seleccionadoId, definirSeleccionadoId] = useState<number | null>(null);
  const [arrasto, definirArrasto] = useState<Arrasto | null>(null);
  const [aviso, definirAviso] = useState<string | null>(null);

  const campoRef = useRef<HTMLDivElement>(null);
  const titularesRef = useRef(titulares);
  titularesRef.current = titulares;

  const porId = new Map(detalhe.jogadores.map((j) => [j.id, j]));
  const idsTitulares = new Set(titulares.map((t) => t.id));
  const suplentes = convocados.filter((j) => !idsTitulares.has(j.id));
  const guardaRedes = titulares.filter((t) => porId.get(t.id)?.posicao === "guarda-redes").length;
  const valida = titulares.length === TITULARES && guardaRedes === 1;

  // Arrasto com rato ou toque: ouve-se a janela inteira para o gesto continuar fora do campo.
  const arrastadoId = arrasto?.id ?? null;
  const origemArrasto = arrasto?.origem ?? null;
  useEffect(() => {
    if (arrastadoId === null) return;

    const dentro = (cx: number, cy: number) => {
      const retangulo = campoRef.current?.getBoundingClientRect();
      if (!retangulo) return null;
      const estaDentro = cx >= retangulo.left && cx <= retangulo.right && cy >= retangulo.top && cy <= retangulo.bottom;
      return {
        estaDentro,
        x: limitar((cx - retangulo.left) / retangulo.width),
        y: limitar((cy - retangulo.top) / retangulo.height),
      };
    };

    const mover = (evento: PointerEvent) => {
      definirArrasto((actual) => (actual ? { ...actual, x: evento.clientX, y: evento.clientY } : actual));
    };

    const soltar = (evento: PointerEvent) => {
      const posicao = dentro(evento.clientX, evento.clientY);
      const actuais = titularesRef.current;
      if (posicao?.estaDentro) {
        if (origemArrasto === "suplente" && actuais.length >= TITULARES) {
          definirAviso("Já há 11 titulares: arraste um titular para fora do campo primeiro.");
        } else {
          definirAviso(null);
          definirTitulares([
            ...actuais.filter((t) => t.id !== arrastadoId),
            { id: arrastadoId, x: posicao.x, y: posicao.y },
          ]);
        }
      } else if (origemArrasto === "campo") {
        // Largado fora do campo: volta aos suplentes.
        definirAviso(null);
        definirTitulares(actuais.filter((t) => t.id !== arrastadoId));
      }
      definirArrasto(null);
    };

    const cancelar = () => definirArrasto(null);

    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", cancelar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", cancelar);
    };
  }, [arrastadoId, origemArrasto]);

  function iniciarArrasto(evento: EventoPonteiro, id: number, origem: "campo" | "suplente") {
    if (aOcupar) return;
    evento.preventDefault();
    definirSeleccionadoId(id);
    definirArrasto({ id, origem, x: evento.clientX, y: evento.clientY });
  }

  function escolherFormacao(nova: Formacao) {
    definirFormacao(nova);
    const actuais = titularesRef.current;
    if (actuais.length === 0 && convocados.length >= TITULARES) {
      definirTitulares(distribuir(nova, sugerirOnze(nova, convocados)));
      return;
    }
    // Os titulares actuais passam para os lugares da nova formação.
    const jogadores = actuais.map((t) => porId.get(t.id)).filter((j): j is JogadorDoJogo => j !== undefined);
    definirTitulares(distribuir(nova, jogadores));
  }

  function moverComTeclado(id: number, dx: number, dy: number) {
    definirTitulares((actuais) =>
      actuais.map((t) => (t.id === id ? { ...t, x: limitar(t.x + dx), y: limitar(t.y + dy) } : t)),
    );
  }

  function colocarEmCampo(jogador: JogadorDoJogo) {
    if (titulares.length >= TITULARES) {
      definirAviso("Já há 11 titulares: tire um titular do campo primeiro.");
      return;
    }
    definirAviso(null);
    const lugar = proximoEspacoLivre(formacao, titulares, jogador.posicao);
    definirTitulares([...titulares, { id: jogador.id, ...lugar }]);
    definirSeleccionadoId(jogador.id);
  }

  function guardar(publicada: boolean) {
    void executar((versao) =>
      guardarEscalacao(jogo.id, {
        versao,
        formacao,
        titulares,
        suplentes: suplentes.map((j) => j.id),
        publicada,
      }),
    );
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

  const noCampo = titulares.flatMap((t) => {
    const jogador = porId.get(t.id);
    return jogador ? [{ id: t.id, numero: jogador.numero, nome: jogador.nome, x: t.x, y: t.y }] : [];
  });
  const fantasma = arrasto ? porId.get(arrasto.id) : null;

  let problema: string | null = null;
  if (titulares.length !== TITULARES) problema = `Faltam ${TITULARES - titulares.length} titulares no campo.`;
  else if (guardaRedes !== 1) problema = "O onze inicial tem de ter exactamente um guarda-redes.";

  return (
    <div>
      <div className="formacoes" role="group" aria-label="Formação">
        <p className="controlo__rotulo">Formação</p>
        <div className="formacoes__botoes">
          {FORMACOES.map((valor) => (
            <button
              key={valor}
              type="button"
              className={`formacao${valor === formacao ? " formacao--activa" : ""}`}
              aria-pressed={valor === formacao}
              onClick={() => escolherFormacao(valor)}
            >
              {valor}
            </button>
          ))}
        </div>
      </div>

      <div className="painel-grade painel-grade--campo">
        <CampoEditavel
          referencia={campoRef}
          jogadores={noCampo}
          seleccionadoId={seleccionadoId}
          arrastadoId={arrastadoId}
          aoIniciarArrasto={(evento, id) => iniciarArrasto(evento, id, "campo")}
          aoSeleccionar={definirSeleccionadoId}
          aoMover={moverComTeclado}
          aoRetirar={(id) => definirTitulares((actuais) => actuais.filter((t) => t.id !== id))}
        />

        <aside className="painel-bloco" aria-label="Suplentes e acções">
          <h2 className="antetitulo">Suplentes ({suplentes.length} convocados)</h2>
          <ul className="lista-linhas">
            {suplentes.map((jogador) => (
              <li
                key={jogador.id}
                className={`linha linha--suplente${jogador.id === arrastadoId ? " linha--arrastada" : ""}`}
                onPointerDown={(evento) => iniciarArrasto(evento, jogador.id, "suplente")}
              >
                <span className="linha__numero">{jogador.numero}</span>
                <span className="linha__nome linha__texto">{jogador.nome}</span>
                <button
                  type="button"
                  className="ligacao ligacao--botao"
                  onPointerDown={(evento) => evento.stopPropagation()}
                  onClick={() => colocarEmCampo(jogador)}
                  aria-label={`Colocar ${jogador.nome} em campo`}
                >
                  Colocar em campo
                </button>
              </li>
            ))}
          </ul>

          <p className={`contador contador--medio${valida ? "" : " contador--erro"}`} aria-live="polite">
            {titulares.length}
            <span className="contador__legenda"> / {TITULARES} titulares no campo</span>
          </p>
          {aviso && <p className="aviso-erro__titulo">{aviso}</p>}
          {problema && !aviso && <p className="jogo__apoio">{problema}</p>}
          <p className="jogo__apoio">
            {jogo.escalacaoPublicada ? "Publicada: o público já vê o onze." : "Rascunho: o público ainda não vê o onze."}
          </p>

          <div className="formulario__accoes formulario__accoes--coluna">
            <button type="button" className="botao" disabled={!valida || aOcupar} onClick={() => guardar(jogo.escalacaoPublicada)}>
              {aOcupar ? "A guardar…" : "Guardar escalação"}
            </button>
            {jogo.escalacaoPublicada ? (
              <button type="button" className="botao botao--secundario" disabled={!valida || aOcupar} onClick={() => guardar(false)}>
                Retirar do público
              </button>
            ) : (
              <button type="button" className="botao botao--secundario" disabled={!valida || aOcupar} onClick={() => guardar(true)}>
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

      <p className="jogo__apoio jogo__nota">
        Arraste um círculo para mover o jogador; largado fora do campo, passa a suplente. Para pôr um suplente em campo,
        arraste-o ou use o botão. Com o teclado: setas para mover, Delete para tirar do campo.
      </p>

      <SecaoImagensPainel detalhe={detalhe} tipos={["onze-inicial"]} />

      {arrasto && fantasma && (
        <div className="fantasma" style={{ left: arrasto.x, top: arrasto.y }} aria-hidden="true">
          {fantasma.numero}
        </div>
      )}
    </div>
  );
}

export default function Escalacao() {
  return <PaginaJogo etapa="escalacao">{(contexto) => <Conteudo contexto={contexto} />}</PaginaJogo>;
}
