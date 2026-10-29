import { Link } from "react-router-dom";
import type { JogoListaPublico } from "@adnh-fc/shared";
import { EtiquetaResultado } from "./EtiquetaResultado";
import { formatarDataCurta, formatarHora, formatarPlacar } from "../../lib/formatadores";

// Linha do calendário: a linha toda é uma ligação para o jogo (o nome do adversário estende-se por cima).
export function LinhaJogo({ jogo }: { jogo: JogoListaPublico }) {
  const terminado = jogo.golosPro !== null && jogo.golosContra !== null;
  return (
    <li className="jogos__linha">
      <span className="jogos__data">{formatarDataCurta(jogo.data)}</span>
      <span className="jogos__texto">
        <Link to={`/jogos/${jogo.id}`} className="jogos__adversario">
          {jogo.adversario}
        </Link>
        <span className="jogos__apoio">
          {jogo.competicao} · {jogo.local}
        </span>
      </span>
      {terminado ? (
        <>
          <span className="resultados__placar">{formatarPlacar(jogo.golosPro as number, jogo.golosContra as number)}</span>
          {jogo.resultado && <EtiquetaResultado resultado={jogo.resultado} />}
        </>
      ) : (
        <span className="jogos__hora">{formatarHora(jogo.data)}</span>
      )}
    </li>
  );
}
