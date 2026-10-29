import type { ReactNode } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import type { JogoDetalhe } from "@adnh-fc/shared";
import { Carregando, ErroCarregar } from "../ui/Estados";
import { formatarDataLonga, formatarHora } from "../../lib/formatadores";
import { usarJogoPainel, type ContextoJogo } from "../../lib/usar-jogo-painel";

export type Etapa = "convocatoria" | "escalacao" | "golos" | "resultado";

const ETAPAS: { chave: Etapa; titulo: string }[] = [
  { chave: "convocatoria", titulo: "Convocatória" },
  { chave: "escalacao", titulo: "Escalação" },
  { chave: "golos", titulo: "Golos" },
  { chave: "resultado", titulo: "Fecho" },
];

function etapaFeita(chave: Etapa, d: JogoDetalhe): boolean {
  switch (chave) {
    case "convocatoria":
      return d.jogadores.filter((j) => j.convocado).length >= 11;
    case "escalacao":
      return d.jogadores.filter((j) => j.titular).length === 11;
    case "golos":
      return d.eventos.length > 0 || d.jogo.estado === "terminado";
    case "resultado":
      return d.jogo.estado === "terminado";
  }
}

type Props = {
  etapa: Etapa;
  children: (contexto: ContextoJogo) => ReactNode;
};

// Cabeçalho do jogo, indicador de etapas e avisos comuns às quatro páginas de gestão do jogo.
export function PaginaJogo({ etapa, children }: Props) {
  const parametros = useParams();
  const id = Number(parametros.id);
  const valido = Number.isInteger(id) && id > 0;
  const { estado, recarregar, conflito, carregarActual, erro, aOcupar, executar } = usarJogoPainel(valido ? id : 0);

  if (!valido) {
    return <ErroCarregar aoTentar={() => undefined} texto="Jogo não encontrado." />;
  }
  if (estado.fase === "carregando") return <Carregando />;
  if (estado.fase === "erro") {
    return estado.estadoHttp === 404 ? (
      <div className="pagina-privada">
        <Link to="/painel/jogos" className="ligacao">
          ← Jogos
        </Link>
        <ErroCarregar aoTentar={recarregar} texto="Este jogo já não existe." />
      </div>
    ) : (
      <ErroCarregar aoTentar={recarregar} />
    );
  }

  const detalhe = estado.dados;
  const { jogo } = detalhe;

  return (
    <div className="pagina-privada">
      <div>
        <Link to="/painel/jogos" className="ligacao">
          ← Jogos
        </Link>
        <h1 className="pagina-privada__titulo pagina-privada__titulo--jogo">
          {detalhe.clube} vs {jogo.adversario}
        </h1>
        <p className="jogo__apoio">
          {formatarDataLonga(jogo.data)} · {formatarHora(jogo.data)} · {jogo.local}
        </p>
      </div>

      <nav className="etapas" aria-label="Etapas do jogo">
        {ETAPAS.map((item, indice) => {
          const feita = etapaFeita(item.chave, detalhe);
          return (
            <NavLink
              key={item.chave}
              to={`/painel/jogos/${jogo.id}/${item.chave}`}
              className={`etapa${feita ? " etapa--feita" : ""}${item.chave === etapa ? " etapa--actual" : ""}`}
              aria-current={item.chave === etapa ? "step" : undefined}
            >
              <span className="etapa__numero">
                {indice + 1}
                {feita && <span className="etapa__feito">Feito</span>}
              </span>
              <span className="etapa__titulo">{item.titulo}</span>
            </NavLink>
          );
        })}
      </nav>

      {conflito && (
        <div className="aviso-conflito" role="alert">
          <p className="aviso-conflito__titulo">Outro gestor alterou este jogo</p>
          <p className="aviso-conflito__texto">
            As suas alterações não foram guardadas. Carregue a versão actual e volte a fazer a alteração.
          </p>
          <button type="button" className="botao" onClick={carregarActual}>
            Carregar versão actual
          </button>
        </div>
      )}
      {erro && (
        <div className="aviso-erro" role="alert">
          <p className="aviso-erro__titulo">{erro}</p>
        </div>
      )}

      {/* A versão faz parte da chave: depois de guardar ou de carregar a versão actual, o conteúdo recomeça com ela. */}
      <div key={jogo.versao}>{children({ detalhe, aOcupar, erro, executar })}</div>
    </div>
  );
}
