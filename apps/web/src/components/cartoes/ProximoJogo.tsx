import type { ProximoJogo as Proximo } from "@adnh-fc/shared";
import { Secao } from "../ui/Secao";
import { formatarDataLonga, formatarHora } from "../../lib/formatadores";

export function ProximoJogo({ jogo, nomeClube }: { jogo: Proximo; nomeClube: string }) {
  return (
    <Secao antetitulo="Próximo jogo">
      <p className="proximo__data">{formatarDataLonga(jogo.data)}</p>
      <p className="proximo__jogo">
        {nomeClube} vs {jogo.adversario}
      </p>
      <p className="proximo__meta">
        {formatarHora(jogo.data)} · {jogo.local} · {jogo.competicao}
      </p>
    </Secao>
  );
}
