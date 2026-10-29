import { useEffect, useState } from "react";
import { POSICOES, type Plantel } from "@adnh-fc/shared";
import { CartaoJogador } from "../../components/cartoes/CartaoJogador";
import { CarregandoCartoes, ErroCarregar, SemDados } from "../../components/ui/Estados";
import { Secao } from "../../components/ui/Secao";
import { ErroApi, obterPlantel } from "../../lib/api";
import { useInicio } from "../../app/InicioContexto";
import { dividirNomeClube, formatarDataCurta, tituloGrupo } from "../../lib/formatadores";
import { usarMeta } from "../../lib/usar-meta";

type EstadoPlantel =
  | { fase: "carregando" }
  | { fase: "erro"; estadoHttp: number }
  | { fase: "pronto"; dados: Plantel };

function linhaDeApoio(dados: Plantel): string {
  const total = dados.jogadores.length;
  const inscritos = `${total} ${total === 1 ? "jogador inscrito" : "jogadores inscritos"} na época ${dados.epoca}.`;
  const ate = dados.ultimoJogoData
    ? `Golos e assistências até ao jogo de ${formatarDataCurta(dados.ultimoJogoData)}.`
    : "Golos e assistências da época ainda sem jogos.";
  return `${inscritos} ${ate}`;
}

export default function Jogadores() {
  const { estado: inicio } = useInicio();
  usarMeta(
    inicio.fase === "pronto" ? `Plantel · ${dividirNomeClube(inicio.dados.clube.nome).principal}` : null,
    "Os jogadores do clube, com golos e assistências.",
  );
  const [estado, definirEstado] = useState<EstadoPlantel>({ fase: "carregando" });
  const [tentativa, definirTentativa] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    definirEstado({ fase: "carregando" });
    obterPlantel(controlador.signal).then(
      (dados) => definirEstado({ fase: "pronto", dados }),
      (erro: unknown) => {
        if (controlador.signal.aborted) return;
        definirEstado({ fase: "erro", estadoHttp: erro instanceof ErroApi ? erro.estado : 0 });
      },
    );
    return () => controlador.abort();
  }, [tentativa]);

  if (estado.fase === "carregando") return <CarregandoCartoes />;

  const vazio = (
    <SemDados
      titulo="Plantel ainda por publicar"
      texto="A direcção ainda não inscreveu jogadores para esta época."
    />
  );
  if (estado.fase === "erro") {
    return estado.estadoHttp === 404 ? (
      vazio
    ) : (
      <ErroCarregar
        aoTentar={() => definirTentativa((n) => n + 1)}
        texto="Verifique a ligação e tente de novo."
      />
    );
  }

  const { dados } = estado;
  if (dados.jogadores.length === 0) return vazio;

  const grupos = POSICOES.map((posicao) => ({
    posicao,
    jogadores: dados.jogadores.filter((jogador) => jogador.posicao === posicao),
  })).filter((grupo) => grupo.jogadores.length > 0);

  return (
    <>
      <header>
        <h1 className="plantel__titulo">Plantel {dados.epoca}</h1>
        <p className="plantel__apoio">{linhaDeApoio(dados)}</p>
      </header>
      {grupos.map((grupo) => (
        <Secao key={grupo.posicao} antetitulo={tituloGrupo(grupo.posicao)}>
          <ul className="plantel__grade">
            {grupo.jogadores.map((jogador) => (
              <CartaoJogador key={jogador.id} jogador={jogador} />
            ))}
          </ul>
        </Secao>
      ))}
    </>
  );
}
