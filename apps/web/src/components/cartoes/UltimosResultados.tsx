import { Link } from "react-router-dom";
import type { ResultadoRecente } from "@adnh-fc/shared";
import { EtiquetaResultado } from "../ui/EtiquetaResultado";
import { Secao } from "../ui/Secao";
import { formatarDataCurta, formatarPlacar } from "../../lib/formatadores";

export function UltimosResultados({ resultados }: { resultados: ResultadoRecente[] }) {
  return (
    <Secao antetitulo="Últimos resultados">
      <ul className="resultados">
        {resultados.map((jogo) => (
          <li className="resultados__linha" key={jogo.id}>
            <span className="resultados__data">{formatarDataCurta(jogo.data)}</span>
            <Link to={`/jogos/${jogo.id}`} className="resultados__adversario ligacao-cartao">
              {jogo.adversario}
            </Link>
            <span className="resultados__placar">{formatarPlacar(jogo.golosPro, jogo.golosContra)}</span>
            <EtiquetaResultado resultado={jogo.resultado} />
          </li>
        ))}
      </ul>
      <Link to="/jogos" className="ligacao">
        Ver todos os jogos
      </Link>
    </Secao>
  );
}
