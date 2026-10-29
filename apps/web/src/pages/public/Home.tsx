import { useInicio } from "../../app/InicioContexto";
import { CampoOnze } from "../../components/campo/CampoOnze";
import { HomemDoJogo } from "../../components/cartoes/HomemDoJogo";
import { Manchete } from "../../components/cartoes/Manchete";
import { ProximoJogo } from "../../components/cartoes/ProximoJogo";
import { UltimosResultados } from "../../components/cartoes/UltimosResultados";
import { Carregando, ErroCarregar, SemDados } from "../../components/ui/Estados";
import { Secao } from "../../components/ui/Secao";
import { dividirNomeClube } from "../../lib/formatadores";

export default function Home() {
  const { estado, recarregar } = useInicio();

  if (estado.fase === "carregando") return <Carregando />;
  if (estado.fase === "erro") {
    return estado.estadoHttp === 404 ? <SemDados /> : <ErroCarregar aoTentar={recarregar} />;
  }

  const { clube, proximoJogo, ultimoJogo, ultimosResultados } = estado.dados;
  if (!proximoJogo && !ultimoJogo && ultimosResultados.length === 0) return <SemDados />;

  const nomeClube = dividirNomeClube(clube.nome).principal;
  const onze = ultimoJogo?.onzeInicial ?? [];
  const homem = ultimoJogo?.homemDoJogo ?? null;
  const temColunaDireita = homem !== null || proximoJogo !== null;
  const temColunaEsquerda = onze.length > 0;

  return (
    <>
      {ultimoJogo && <Manchete jogo={ultimoJogo} nomeClube={nomeClube} escudoUrl={clube.escudoUrl} />}

      {(temColunaEsquerda || temColunaDireita) && (
        <div className={`home-grade${temColunaEsquerda && temColunaDireita ? " home-grade--duas" : ""}`}>
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
          {temColunaDireita && (
            <div className="home-grade__coluna">
              {homem && <HomemDoJogo homem={homem} />}
              {proximoJogo && <ProximoJogo jogo={proximoJogo} nomeClube={nomeClube} />}
            </div>
          )}
        </div>
      )}

      {ultimosResultados.length > 0 && <UltimosResultados resultados={ultimosResultados} />}
    </>
  );
}
