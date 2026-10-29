import { Link } from "react-router-dom";
import type { UltimoJogo } from "@adnh-fc/shared";
import { DistintivoAdversario } from "../ui/DistintivoAdversario";
import { Escudo } from "../ui/Escudo";
import { formatarMinutos, formatarPlacar, partirNome } from "../../lib/formatadores";

type Props = {
  jogo: UltimoJogo;
  nomeClube: string;
  escudoUrl: string | null;
};

export function Manchete({ jogo, nomeClube, escudoUrl }: Props) {
  const marcadores = jogo.marcadores.map((m) => `${m.nome} ${formatarMinutos(m.minutos)}`).join(" · ");
  const sofridos =
    jogo.golosSofridos.length > 0
      ? `${jogo.golosSofridos.length === 1 ? "Golo sofrido" : "Golos sofridos"}: ${formatarMinutos(jogo.golosSofridos)}`
      : "";
  const resumo = [marcadores, sofridos].filter(Boolean).join(" | ");

  return (
    <section className="manchete" aria-label="Último resultado">
      <p className="antetitulo">Último resultado · {jogo.competicao}</p>
      <div className="manchete__linha">
        <div className="manchete__equipa">
          <Escudo url={escudoUrl} className="manchete__escudo" />
          <span>
            {partirNome(nomeClube).map((linha) => (
              <span className="manchete__nome-linha" key={linha}>
                {linha}
              </span>
            ))}
          </span>
        </div>
        <p className="manchete__placar">{formatarPlacar(jogo.golosPro, jogo.golosContra)}</p>
        <div className="manchete__equipa manchete__equipa--adversario">
          <span>{jogo.adversario}</span>
          <span className="manchete__distintivo">
            <DistintivoAdversario nome={jogo.adversario} />
          </span>
        </div>
      </div>
      {resumo && <p className="manchete__marcadores">{resumo}</p>}
      <Link to={`/jogos/${jogo.id}`} className="manchete__ligacao">
        Ver o jogo completo
      </Link>
    </section>
  );
}
