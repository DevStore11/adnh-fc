import { Link, useSearchParams } from "react-router-dom";
import type { Estatisticas as DadosEstatisticas } from "@adnh-fc/shared";
import { EtiquetaResultado } from "../../components/ui/EtiquetaResultado";
import { Carregando, ErroCarregar, SemDados } from "../../components/ui/Estados";
import { Secao } from "../../components/ui/Secao";
import { Seletor } from "../../components/ui/Seletor";
import { obterEstatisticas } from "../../lib/api";
import { dividirNomeClube } from "../../lib/formatadores";
import { usarMeta } from "../../lib/usar-meta";
import { usarPedido } from "../../lib/usar-pedido";

type Linha = { id: number; nome: string; valor: number };

function Classificacao({ titulo, rotulo, linhas }: { titulo: string; rotulo: string; linhas: Linha[] }) {
  return (
    <Secao antetitulo={titulo}>
      {linhas.length === 0 ? (
        <p className="apoio-pagina">Sem registos.</p>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Jogador</th>
              <th scope="col" className="tabela__num">
                {rotulo}
              </th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, indice) => (
              <tr key={linha.id}>
                <td className="tabela__pos">{indice + 1}</td>
                <td>
                  <Link to={`/jogadores/${linha.id}`} className="ligacao-texto">
                    {linha.nome}
                  </Link>
                </td>
                <td className="tabela__num tabela__destaque">{linha.valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Secao>
  );
}

function Resumo({ resumo }: { resumo: DadosEstatisticas["resumo"] }) {
  const itens = [
    ["Jogos", resumo.jogos],
    ["Vitórias", resumo.vitorias],
    ["Empates", resumo.empates],
    ["Derrotas", resumo.derrotas],
    ["Golos marcados", resumo.golosPro],
    ["Golos sofridos", resumo.golosContra],
  ] as const;
  return (
    <dl className="numeros">
      {itens.map(([rotulo, valor]) => (
        <div className="numero" key={rotulo}>
          <dt className="numero__rotulo">{rotulo}</dt>
          <dd className="numero__valor">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Estatisticas() {
  const [parametros, definirParametros] = useSearchParams();
  const epoca = parametros.get("epoca") ?? undefined;
  const { estado, recarregar } = usarPedido((sinal) => obterEstatisticas(epoca, sinal), [epoca]);
  const dados = estado.fase === "pronto" ? estado.dados : null;

  usarMeta(
    dados ? `Estatísticas · ${dividirNomeClube(dados.clube).principal}` : null,
    "Artilheiros, assistências, presenças e cartões da época.",
  );

  if (estado.fase === "carregando") return <Carregando />;
  if (estado.fase === "erro") {
    return estado.estadoHttp === 404 ? <SemDados /> : <ErroCarregar aoTentar={recarregar} />;
  }
  if (!dados) return null;

  return (
    <>
      <header>
        <h1 className="titulo-pagina">Estatísticas {dados.epoca}</h1>
        <p className="apoio-pagina">Contam só os jogos terminados.</p>
      </header>

      {dados.epocas.length > 1 && (
        <div className="filtros">
          <Seletor
            rotulo="Época"
            valor={dados.epoca}
            opcoes={dados.epocas.map((valor) => ({ valor, texto: valor }))}
            aoMudar={(valor) => definirParametros({ epoca: valor }, { replace: true })}
          />
        </div>
      )}

      {dados.resumo.jogos === 0 ? (
        <SemDados
          titulo="Ainda sem jogos terminados"
          texto="Quando houver resultados nesta época, as estatísticas aparecem aqui."
        />
      ) : (
        <>
          <Secao antetitulo="Resumo da época">
            <Resumo resumo={dados.resumo} />
            {dados.forma.length > 0 && (
              <div className="forma">
                <p className="forma__rotulo">Forma (últimos {dados.forma.length})</p>
                <ul className="forma__lista">
                  {dados.forma.map((resultado, indice) => (
                    <li key={indice}>
                      <EtiquetaResultado resultado={resultado} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Secao>

          <div className="estatisticas-grade">
            <Classificacao titulo="Artilheiros" rotulo="Golos" linhas={dados.artilheiros} />
            <Classificacao titulo="Assistências" rotulo="Assist." linhas={dados.assistentes} />
            <Classificacao titulo="Presenças" rotulo="Jogos" linhas={dados.presencas} />
            <Secao antetitulo="Cartões">
              {dados.cartoes.length === 0 ? (
                <p className="apoio-pagina">Sem registos.</p>
              ) : (
                <table className="tabela">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Jogador</th>
                      <th scope="col" className="tabela__num">
                        Amarelos
                      </th>
                      <th scope="col" className="tabela__num">
                        Vermelhos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.cartoes.map((linha, indice) => (
                      <tr key={linha.id}>
                        <td className="tabela__pos">{indice + 1}</td>
                        <td>
                          <Link to={`/jogadores/${linha.id}`} className="ligacao-texto">
                            {linha.nome}
                          </Link>
                        </td>
                        <td className="tabela__num">{linha.amarelos}</td>
                        <td className="tabela__num">{linha.vermelhos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Secao>
          </div>
        </>
      )}
    </>
  );
}
