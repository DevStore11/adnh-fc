import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import type { JogadorDoJogo, Posicao } from "@adnh-fc/shared";
import { motivoDeRecusa, simularColocacao, type Lugar, type OnzePorLugar } from "../../lib/formacoes";
import { abreviarPosicao } from "../../lib/formatadores";
import { ConfirmarDestrutivo } from "../ui/ConfirmarDestrutivo";
import { Retrato } from "./CampoOnze";

const A_PARTIR_DE_1024 = "(min-width: 1024px)";

// A partir de 1024 px a lista é um painel ao lado do campo; abaixo disso é uma folha por baixo.
export function usarPainelLateral(): boolean {
  return useSyncExternalStore(
    (aviso) => {
      const consulta = window.matchMedia(A_PARTIR_DE_1024);
      consulta.addEventListener("change", aviso);
      return () => consulta.removeEventListener("change", aviso);
    },
    () => window.matchMedia(A_PARTIR_DE_1024).matches,
    () => false,
  );
}

const POSICAO_SINGULAR: Record<Posicao, string> = {
  "guarda-redes": "guarda-redes",
  defesa: "defesa",
  médio: "médio",
  avançado: "avançado",
};

const POSICAO_PLURAL: Record<Posicao, string> = {
  "guarda-redes": "guarda-redes",
  defesa: "defesas",
  médio: "médios",
  avançado: "avançados",
};

function maiuscula(texto: string): string {
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)}`;
}

function porNumero(a: JogadorDoJogo, b: JogadorDoJogo): number {
  return a.numero - b.numero;
}

type Props = {
  painel: boolean;
  lugar: Lugar;
  lugares: Lugar[];
  onze: OnzePorLugar;
  jogadores: Map<number, JogadorDoJogo>;
  convocados: JogadorDoJogo[];
  conviteConvocatoria: string;
  aoEscolher: (jogadorId: number) => void;
  aoRetirar: () => void;
  aoFechar: () => void;
};

type LinhaProps = {
  jogador: JogadorDoJogo;
  apoio: string;
  accao: string;
  motivo: string | null;
  aoEscolher: () => void;
};

// A linha inteira é o alvo de toque (mínimo 48 px).
function Linha({ jogador, apoio, accao, motivo, aoEscolher }: LinhaProps) {
  return (
    <li>
      <button type="button" className="linha-escolha" disabled={motivo !== null} onClick={aoEscolher}>
        <span className="linha-escolha__retrato">
          <Retrato jogador={jogador} />
        </span>
        <span className="linha-escolha__texto">
          <span className="linha-escolha__nome">{jogador.nome}</span>
          <span className={`linha-escolha__apoio${motivo ? " linha-escolha__apoio--motivo" : ""}`}>{motivo ?? apoio}</span>
        </span>
        <span className="linha-escolha__accao">{accao}</span>
      </button>
    </li>
  );
}

export function EscolherJogador({
  painel,
  lugar,
  lugares,
  onze,
  jogadores,
  convocados,
  conviteConvocatoria,
  aoEscolher,
  aoRetirar,
  aoFechar,
}: Props) {
  const idTitulo = useId();
  const corpo = useRef<HTMLDivElement>(null);
  const botaoRetirar = useRef<HTMLButtonElement>(null);
  const [aConfirmar, definirAConfirmar] = useState(false);

  // Ao abrir (ou ao passar a outro lugar) o foco vai para a lista.
  useEffect(() => {
    corpo.current?.focus();
  }, [lugar.indice]);

  const idNoLugar = onze[lugar.indice];
  const noLugar = idNoLugar === null ? null : (jogadores.get(idNoLugar) ?? null);
  const posicaoDe = (id: number) => jogadores.get(id)?.posicao;
  const motivoPara = (jogadorId: number) =>
    motivoDeRecusa(lugares, onze, simularColocacao(onze, lugar.indice, jogadorId), posicaoDe);

  const noOnze = new Set(onze.filter((id): id is number => id !== null));
  const fora = convocados.filter((j) => !noOnze.has(j.id)).sort(porNumero);
  const daPosicao = fora.filter((j) => j.posicao === lugar.posicao);
  const outras = fora.filter((j) => j.posicao !== lugar.posicao);
  const dentro = onze.flatMap((id, indice) => {
    const jogador = id !== null && indice !== lugar.indice ? jogadores.get(id) : undefined;
    return jogador ? [{ jogador, lugar: lugares[indice] }] : [];
  });
  dentro.sort((a, b) => porNumero(a.jogador, b.jogador));

  const nomePosicao = POSICAO_SINGULAR[lugar.posicao];
  const ocupado = noLugar !== null;
  const titulo = `${ocupado ? "Trocar" : "Escolher"} ${nomePosicao}`;
  const primeiroNome = noLugar?.nome.split(/\s+/)[0] ?? "";
  const semConvocados = fora.length === 0;

  return (
    <>
      {!painel && <div className="folha__fundo" aria-hidden="true" onClick={aoFechar} />}
      <div className={`folha${painel ? " folha--painel" : ""}`} role="dialog" aria-labelledby={idTitulo}>
        <div className="folha__cabecalho">
          <p className="antetitulo">
            {ocupado ? "Lugar ocupado" : "Lugar vazio"} · {maiuscula(nomePosicao)}
          </p>
          <div className="folha__titulo-linha">
            <h2 className="folha__titulo" id={idTitulo}>
              {titulo}
            </h2>
            <button type="button" className="ligacao ligacao--botao" onClick={aoFechar}>
              Fechar
            </button>
          </div>
        </div>

        <div className="folha__corpo" ref={corpo} tabIndex={-1}>
          {noLugar && (
            <section className="folha__agora" aria-labelledby={`${idTitulo}-agora`}>
              <h3 className="folha__seccao folha__seccao--neutra" id={`${idTitulo}-agora`}>
                Neste lugar agora
              </h3>
              <div className="folha__agora-linha">
                <span className="linha-escolha__retrato">
                  <Retrato jogador={noLugar} />
                </span>
                <span className="linha-escolha__texto">
                  <span className="linha-escolha__nome">{noLugar.nome}</span>
                  <span className="linha-escolha__apoio">{maiuscula(POSICAO_SINGULAR[lugar.posicao])} · neste lugar</span>
                </span>
              </div>
              <button type="button" className="folha__retirar" ref={botaoRetirar} onClick={() => definirAConfirmar(true)}>
                Retirar do onze
              </button>
              <p className="jogo__apoio">Escolher outro jogador na lista substitui {primeiroNome}.</p>
            </section>
          )}

          {semConvocados ? (
            <section className="folha__vazio" aria-labelledby={`${idTitulo}-vazio`}>
              <h3 className="folha__vazio-titulo" id={`${idTitulo}-vazio`}>
                Não há convocados para escolher.
              </h3>
              <p className="jogo__apoio">
                Ou todos os convocados já estão no onze, ou ainda não convocou ninguém para este jogo.
              </p>
              <Link to={conviteConvocatoria} className="botao">
                Ir à convocatória
              </Link>
            </section>
          ) : (
            <>
              {daPosicao.length > 0 && (
                <section aria-labelledby={`${idTitulo}-posicao`}>
                  <h3 className="folha__seccao" id={`${idTitulo}-posicao`}>
                    {ocupado ? "Substituir por" : maiuscula(POSICAO_PLURAL[lugar.posicao])} ·{" "}
                    {ocupado ? `${POSICAO_PLURAL[lugar.posicao]} fora do onze` : "ainda fora do onze"}
                  </h3>
                  <ul className="folha__lista">
                    {daPosicao.map((jogador) => (
                      <Linha
                        key={jogador.id}
                        jogador={jogador}
                        apoio={`Convocado${jogador.fotoUrl ? "" : " · sem foto"}`}
                        accao={abreviarPosicao(jogador.posicao)}
                        motivo={motivoPara(jogador.id)}
                        aoEscolher={() => aoEscolher(jogador.id)}
                      />
                    ))}
                  </ul>
                </section>
              )}
              {outras.length > 0 && (
                <section aria-labelledby={`${idTitulo}-outras`}>
                  <h3 className="folha__seccao folha__seccao--neutra" id={`${idTitulo}-outras`}>
                    Outras posições
                  </h3>
                  <ul className="folha__lista">
                    {outras.map((jogador) => (
                      <Linha
                        key={jogador.id}
                        jogador={jogador}
                        apoio={`Convocado${jogador.fotoUrl ? "" : " · sem foto"}`}
                        accao={abreviarPosicao(jogador.posicao)}
                        motivo={motivoPara(jogador.id)}
                        aoEscolher={() => aoEscolher(jogador.id)}
                      />
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          {dentro.length > 0 && (
            <section aria-labelledby={`${idTitulo}-onze`}>
              <h3 className="folha__seccao folha__seccao--neutra" id={`${idTitulo}-onze`}>
                Já no onze · {ocupado ? "escolher troca os dois" : "escolher move o jogador para aqui"}
              </h3>
              <ul className="folha__lista">
                {dentro.map(({ jogador, lugar: lugarDele }) => (
                  <Linha
                    key={jogador.id}
                    jogador={jogador}
                    apoio={`Joga agora como ${abreviarPosicao(lugarDele.posicao)}`}
                    accao={ocupado ? "Trocar" : "Mover"}
                    motivo={motivoPara(jogador.id)}
                    aoEscolher={() => aoEscolher(jogador.id)}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {aConfirmar && noLugar && (
        <ConfirmarDestrutivo
          titulo={`Retirar ${primeiroNome} do onze?`}
          texto={`${noLugar.nome} (${noLugar.numero}) deixa o lugar de ${nomePosicao}, que fica vazio. Continua convocado e pode escolhê-lo outra vez.`}
          rotuloConfirmar="Retirar do onze"
          aOcupar={false}
          erro={null}
          aoConfirmar={() => {
            definirAConfirmar(false);
            aoRetirar();
          }}
          aoCancelar={() => {
            definirAConfirmar(false);
            // O foco volta ao botão que abriu a confirmação.
            botaoRetirar.current?.focus();
          }}
        />
      )}
    </>
  );
}
