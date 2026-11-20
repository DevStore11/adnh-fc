import { useSearchParams } from "react-router-dom";
import { CampoOnze } from "../../components/campo/CampoOnze";
import { HomemDoJogo } from "../../components/cartoes/HomemDoJogo";
import { Manchete } from "../../components/cartoes/Manchete";
import { MelhoresMarcadores } from "../../components/cartoes/MelhoresMarcadores";
import { ProximoJogo } from "../../components/cartoes/ProximoJogo";
import { UltimosResultados } from "../../components/cartoes/UltimosResultados";
import { Carregando, ErroCarregar, SemDados } from "../../components/ui/Estados";
import { Secao } from "../../components/ui/Secao";
import { Seletor } from "../../components/ui/Seletor";
import { obterInicio } from "../../lib/api";
import { dividirNomeClube } from "../../lib/formatadores";
import { usarMeta } from "../../lib/usar-meta";
import { usarPedido } from "../../lib/usar-pedido";

export default function Home() {
  const [parametros, definirParametros] = useSearchParams();
  const epoca = parametros.get("epoca") ?? undefined;
  const { estado, recarregar } = usarPedido((sinal) => obterInicio(epoca, sinal), [epoca]);
  usarMeta(estado.fase === "pronto" ? estado.dados.clube.nome : null, "Resultados, plantel e estatísticas do clube.");

  if (estado.fase === "carregando") return <Carregando />;
  if (estado.fase === "erro") {
    // 404 = o clube ainda não foi gravado no painel (a API só devolve 404 quando não há clube).
    return estado.estadoHttp === 404 ? (
      <SemDados titulo="Clube em configuração" texto="O clube ainda está a ser configurado. Volte em breve." />
    ) : (
      <ErroCarregar aoTentar={recarregar} />
    );
  }

  const { clube, proximoJogo, melhoresMarcadores, ultimoJogo, ultimosResultados, ...dadosEpoca } = estado.dados;

  // Uma época vinda do URL pode não ter jogos e por isso não estar na lista: acrescenta-se para o select não ficar desalinhado.
  const epocas = dadosEpoca.epocas.includes(dadosEpoca.epoca) ? dadosEpoca.epocas : [dadosEpoca.epoca, ...dadosEpoca.epocas];

  function mudarEpoca(valor: string) {
    const novos = new URLSearchParams(parametros);
    // A época actual do clube é o padrão: não precisa de ficar no URL.
    if (valor === clube.epocaActual) novos.delete("epoca");
    else novos.set("epoca", valor);
    definirParametros(novos, { replace: true });
  }

  const seletorEpoca = epocas.length > 1 && (
    <div className="filtros">
      <Seletor
        rotulo="Época"
        valor={dadosEpoca.epoca}
        opcoes={epocas.map((valor) => ({ valor, texto: valor }))}
        aoMudar={mudarEpoca}
      />
    </div>
  );

  // O seletor aparece antes desta verificação para não desaparecer numa época sem jogos.
  if (!proximoJogo && !ultimoJogo && ultimosResultados.length === 0) {
    return (
      <>
        {seletorEpoca}
        <SemDados titulo="Sem jogos terminados nesta época." texto="Escolha outra época para ver os resultados." />
      </>
    );
  }

  const nomeClube = dividirNomeClube(clube.nome).principal;
  const onze = ultimoJogo?.onzeInicial ?? [];
  const homem = ultimoJogo?.homemDoJogo ?? null;
  const temColunaEsquerda = onze.length > 0;

  return (
    <>
      {seletorEpoca}

      {ultimoJogo && <Manchete jogo={ultimoJogo} nomeClube={nomeClube} escudoUrl={clube.escudoUrl} />}

      <div className={`home-grade${temColunaEsquerda ? " home-grade--duas" : ""}`}>
          {ultimoJogo && temColunaEsquerda && (
            <Secao
              antetitulo={`Onze inicial${ultimoJogo.formacao ? ` · ${ultimoJogo.formacao}` : ""} · vs ${ultimoJogo.adversario}`}
            >
              <CampoOnze jogadores={onze} />
              {ultimoJogo.suplentes.length > 0 && (
                <p className="suplentes">
                  Suplentes: {ultimoJogo.suplentes.map((s) => s.nome).join(", ")}
                </p>
              )}
            </Secao>
          )}
          <div className="home-grade__coluna">
            <ProximoJogo jogo={proximoJogo} nomeClube={nomeClube} />
            {homem && <HomemDoJogo homem={homem} />}
            <MelhoresMarcadores marcadores={melhoresMarcadores} />
          </div>
        </div>

      {ultimosResultados.length > 0 && <UltimosResultados resultados={ultimosResultados} />}
    </>
  );
}
