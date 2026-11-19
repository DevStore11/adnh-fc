import { useInicio } from "../../app/InicioContexto";
import { CampoOnze } from "../../components/campo/CampoOnze";
import { HomemDoJogo } from "../../components/cartoes/HomemDoJogo";
import { Manchete } from "../../components/cartoes/Manchete";
import { MelhoresMarcadores } from "../../components/cartoes/MelhoresMarcadores";
import { ProximoJogo } from "../../components/cartoes/ProximoJogo";
import { UltimosResultados } from "../../components/cartoes/UltimosResultados";
import { Carregando, ErroCarregar, SemDados } from "../../components/ui/Estados";
import { Secao } from "../../components/ui/Secao";
import { dividirNomeClube } from "../../lib/formatadores";
import { usarMeta } from "../../lib/usar-meta";

export default function Home() {
  const { estado, recarregar } = useInicio();
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

  const { clube, proximoJogo, melhoresMarcadores, ultimoJogo, ultimosResultados } = estado.dados;
  if (!proximoJogo && !ultimoJogo && ultimosResultados.length === 0) return <SemDados />;

  const nomeClube = dividirNomeClube(clube.nome).principal;
  const onze = ultimoJogo?.onzeInicial ?? [];
  const homem = ultimoJogo?.homemDoJogo ?? null;
  const temColunaEsquerda = onze.length > 0;

  return (
    <>
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
            {homem && <HomemDoJogo homem={homem} />}
            <ProximoJogo jogo={proximoJogo} nomeClube={nomeClube} />
            <MelhoresMarcadores marcadores={melhoresMarcadores} />
          </div>
        </div>

      {ultimosResultados.length > 0 && <UltimosResultados resultados={ultimosResultados} />}
    </>
  );
}
