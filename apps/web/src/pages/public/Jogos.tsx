import { useSearchParams } from "react-router-dom";
import { useInicio } from "../../app/InicioContexto";
import { Carregando, ErroCarregar, SemDados } from "../../components/ui/Estados";
import { LinhaJogo } from "../../components/ui/LinhaJogo";
import { Secao } from "../../components/ui/Secao";
import { Seletor } from "../../components/ui/Seletor";
import { obterJogosPublicos } from "../../lib/api";
import { dividirNomeClube } from "../../lib/formatadores";
import { usarMeta } from "../../lib/usar-meta";
import { usarPedido } from "../../lib/usar-pedido";

type FiltroEstado = "todos" | "agendado" | "terminado";

export default function Jogos() {
  const [parametros, definirParametros] = useSearchParams();
  const epoca = parametros.get("epoca") ?? undefined;
  const competicao = parametros.get("competicao") ?? undefined;
  const quando = parametros.get("quando");
  const filtroEstado: FiltroEstado = quando === "agendado" || quando === "terminado" ? quando : "todos";

  const { estado: inicio } = useInicio();
  const nomeClube = inicio.fase === "pronto" ? dividirNomeClube(inicio.dados.clube.nome).principal : null;
  usarMeta(nomeClube ? `Jogos · ${nomeClube}` : null, "Calendário e resultados do clube.");

  const { estado, recarregar } = usarPedido(
    (sinal) =>
      obterJogosPublicos({ epoca, competicao, estado: filtroEstado === "todos" ? undefined : filtroEstado }, sinal),
    [epoca, competicao, filtroEstado],
  );

  function mudar(chave: string, valor: string, predefinido: string) {
    const novos = new URLSearchParams(parametros);
    if (valor === predefinido) novos.delete(chave);
    else novos.set(chave, valor);
    // Ao trocar de época a competição pode já não existir.
    if (chave === "epoca") novos.delete("competicao");
    definirParametros(novos, { replace: true });
  }

  if (estado.fase === "carregando") return <Carregando />;
  if (estado.fase === "erro") {
    return estado.estadoHttp === 404 ? <SemDados /> : <ErroCarregar aoTentar={recarregar} />;
  }

  const { dados } = estado;
  const proximos = dados.jogos.filter((jogo) => jogo.estado === "agendado").reverse();
  const resultados = dados.jogos.filter((jogo) => jogo.estado === "terminado");

  return (
    <>
      <header>
        <h1 className="titulo-pagina">Jogos {dados.epoca}</h1>
        <p className="apoio-pagina">Calendário e resultados da época.</p>
      </header>

      <div className="filtros">
        <Seletor
          rotulo="Época"
          valor={dados.epoca}
          opcoes={dados.epocas.map((valor) => ({ valor, texto: valor }))}
          aoMudar={(valor) => mudar("epoca", valor, "")}
        />
        {dados.competicoes.length > 1 && (
          <Seletor
            rotulo="Competição"
            valor={competicao ?? ""}
            opcoes={[{ valor: "", texto: "Todas" }, ...dados.competicoes.map((valor) => ({ valor, texto: valor }))]}
            aoMudar={(valor) => mudar("competicao", valor, "")}
          />
        )}
        <Seletor
          rotulo="Mostrar"
          valor={filtroEstado}
          opcoes={[
            { valor: "todos", texto: "Todos" },
            { valor: "agendado", texto: "Próximos" },
            { valor: "terminado", texto: "Resultados" },
          ]}
          aoMudar={(valor) => mudar("quando", valor, "todos")}
        />
      </div>

      {dados.jogos.length === 0 ? (
        <SemDados titulo="Sem jogos" texto="Não há jogos com estes filtros." />
      ) : (
        <>
          {proximos.length > 0 && (
            <Secao antetitulo="Próximos jogos">
              <ul className="jogos">
                {proximos.map((jogo) => (
                  <LinhaJogo key={jogo.id} jogo={jogo} />
                ))}
              </ul>
            </Secao>
          )}
          {resultados.length > 0 && (
            <Secao antetitulo="Resultados">
              <ul className="jogos">
                {resultados.map((jogo) => (
                  <LinhaJogo key={jogo.id} jogo={jogo} />
                ))}
              </ul>
            </Secao>
          )}
        </>
      )}
    </>
  );
}
