import { Link } from "react-router-dom";
import type { JogadorPlantel } from "@adnh-fc/shared";
import { abreviarPosicao, iniciais } from "../../lib/formatadores";

export function CartaoJogador({ jogador }: { jogador: JogadorPlantel }) {
  return (
    <li className="cartao-jogador">
      <div className="cartao-jogador__imagem">
        <span className="cartao-jogador__numero" aria-hidden="true">
          {jogador.numero}
        </span>
        <div className="cartao-jogador__foto">
          {jogador.fotoUrl ? (
            <img src={jogador.fotoUrl} alt="" width={126} height={168} loading="lazy" />
          ) : (
            <span aria-hidden="true">{iniciais(jogador.nome)}</span>
          )}
        </div>
      </div>
      <p className="cartao-jogador__posicao">{abreviarPosicao(jogador.posicao)}</p>
      <p className="cartao-jogador__nome">
        <span className="so-leitores">Número {jogador.numero}, </span>
        <Link to={`/jogadores/${jogador.id}`} className="ligacao-cartao">
          {jogador.nome}
        </Link>
      </p>
      <p className="cartao-jogador__numeros">
        Golos {jogador.golos} · Assist. {jogador.assistencias}
      </p>
    </li>
  );
}
