import { Link } from "react-router-dom";
import type { MelhorMarcador } from "@adnh-fc/shared";
import { Secao } from "../ui/Secao";
import { nomeCurto } from "../../lib/formatadores";

export function MelhoresMarcadores({ marcadores }: { marcadores: MelhorMarcador[] }) {
  return (
    <Secao antetitulo="Melhores marcadores">
      {marcadores.length === 0 ? (
        <div>
          <p className="marcadores__vazio">Ainda ninguém marcou esta época.</p>
          <p className="marcadores__vazio-apoio">
            Os melhores marcadores aparecem aqui assim que houver golos registados.
          </p>
        </div>
      ) : (
        <>
          <p className="marcadores__colunas" aria-hidden="true">
            <span>Golos</span>
            <span>Assist.</span>
          </p>
          <ol className="marcadores">
            {marcadores.map((marcador, indice) => (
              <li className="marcadores__linha" key={marcador.id}>
                <span className="marcadores__posicao" aria-hidden="true">
                  {indice + 1}
                </span>
                <Link to={`/jogadores/${marcador.id}`} className="marcadores__nome ligacao-cartao">
                  {nomeCurto(marcador.nome)}
                </Link>
                <span className="marcadores__numero">
                  {marcador.golos}
                  <span className="so-leitores"> golos</span>
                </span>
                <span className="marcadores__numero">
                  {marcador.assistencias}
                  <span className="so-leitores"> assistências</span>
                </span>
                <span className="marcadores__seta" aria-hidden="true">
                  ›
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </Secao>
  );
}
