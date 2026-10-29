import { Link, useParams } from "react-router-dom";
import { Carregando, ErroCarregar, SemDados } from "../../components/ui/Estados";
import { Secao } from "../../components/ui/Secao";
import { obterPerfilJogador } from "../../lib/api";
import { abreviarPosicao, dividirNomeClube, formatarDataCurta, formatarPlacar, iniciais } from "../../lib/formatadores";
import { usarMeta } from "../../lib/usar-meta";
import { usarPedido } from "../../lib/usar-pedido";

const NOMES_POSICAO = {
  "guarda-redes": "Guarda-redes",
  defesa: "Defesa",
  médio: "Médio",
  avançado: "Avançado",
} as const;

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="numero">
      <dt className="numero__rotulo">{rotulo}</dt>
      <dd className="numero__valor">{valor}</dd>
    </div>
  );
}

export default function Jogador() {
  const parametros = useParams();
  const id = Number(parametros.id);
  const valido = Number.isInteger(id) && id > 0;
  const { estado, recarregar } = usarPedido((sinal) => obterPerfilJogador(id, sinal), [id]);
  const dados = estado.fase === "pronto" ? estado.dados : null;

  usarMeta(
    dados ? `${dados.jogador.nome} · ${dividirNomeClube(dados.clube).principal}` : null,
    dados
      ? `${NOMES_POSICAO[dados.jogador.posicao]}, n.º ${dados.jogador.numero}. Época ${dados.epoca}: ${dados.estatisticas.jogos} jogos, ${dados.estatisticas.golos} golos.`
      : undefined,
  );

  const naoEncontrado = <SemDados titulo="Jogador não encontrado" texto="Este jogador não existe." />;
  if (!valido) return naoEncontrado;
  if (estado.fase === "carregando") return <Carregando />;
  if (estado.fase === "erro") {
    return estado.estadoHttp === 404 ? naoEncontrado : <ErroCarregar aoTentar={recarregar} />;
  }
  if (!dados) return null;

  const { jogador, estatisticas: e, jogos, epoca } = dados;

  return (
    <>
      <header className="perfil">
        <Link to="/jogadores" className="ligacao">
          ← Plantel
        </Link>
        <div className="perfil__topo">
          <div className="perfil__foto">
            <span className="perfil__numero" aria-hidden="true">
              {jogador.numero}
            </span>
            {jogador.fotoUrl ? (
              <img src={jogador.fotoUrl} alt={jogador.nome} width={168} height={224} />
            ) : (
              <span className="perfil__iniciais" aria-hidden="true">
                {iniciais(jogador.nome)}
              </span>
            )}
          </div>
          <div>
            <p className="antetitulo">
              {NOMES_POSICAO[jogador.posicao]} · {abreviarPosicao(jogador.posicao)}
            </p>
            <h1 className="titulo-pagina">{jogador.nome}</h1>
            <p className="apoio-pagina">
              Camisola {jogador.numero} · Época {epoca}
            </p>
          </div>
        </div>
      </header>

      <Secao antetitulo={`Números da época ${epoca}`}>
        <dl className="numeros">
          <Numero valor={e.jogos} rotulo="Jogos" />
          <Numero valor={e.titular} rotulo="Titular" />
          <Numero valor={e.golos} rotulo="Golos" />
          <Numero valor={e.assistencias} rotulo="Assistências" />
          <Numero valor={e.amarelos} rotulo="Amarelos" />
          <Numero valor={e.vermelhos} rotulo="Vermelhos" />
          <Numero valor={e.homemDoJogo} rotulo="Homem do jogo" />
        </dl>
      </Secao>

      <Secao antetitulo="Últimos jogos">
        {jogos.length === 0 ? (
          <p className="apoio-pagina">Ainda sem jogos nesta época.</p>
        ) : (
          <ul className="jogos">
            {jogos.map((jogo) => {
              const partes = [
                jogo.titular ? "Titular" : "Suplente",
                jogo.golos > 0 ? `${jogo.golos} ${jogo.golos === 1 ? "golo" : "golos"}` : null,
                jogo.assistencias > 0 ? `${jogo.assistencias} assist.` : null,
                jogo.amarelos > 0 ? "amarelo" : null,
                jogo.vermelhos > 0 ? "vermelho" : null,
              ].filter(Boolean);
              return (
                <li key={jogo.id} className="jogos__linha jogos__linha--simples">
                  <span className="jogos__data">{formatarDataCurta(jogo.data)}</span>
                  <span className="jogos__texto">
                    <Link to={`/jogos/${jogo.id}`} className="jogos__adversario">
                      {jogo.adversario}
                    </Link>
                    <span className="jogos__apoio">{partes.join(" · ")}</span>
                  </span>
                  <span className="resultados__placar">{formatarPlacar(jogo.golosPro, jogo.golosContra)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Secao>
    </>
  );
}
