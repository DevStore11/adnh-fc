import type { ProximoJogo as Proximo } from "@adnh-fc/shared";
import { Secao } from "../ui/Secao";
import { contagemJogo, criarCalendarioIcs, formatarDataLonga, formatarHora } from "../../lib/formatadores";

function descarregarCalendario(jogo: Proximo, nomeClube: string) {
  const ficheiro = criarCalendarioIcs(jogo, `${nomeClube} vs ${jogo.adversario}`);
  const endereco = URL.createObjectURL(new Blob([ficheiro], { type: "text/calendar;charset=utf-8" }));
  const ligacao = document.createElement("a");
  ligacao.href = endereco;
  ligacao.download = `jogo-${jogo.id}.ics`;
  document.body.append(ligacao);
  ligacao.click();
  ligacao.remove();
  URL.revokeObjectURL(endereco);
}

export function ProximoJogo({ jogo, nomeClube }: { jogo: Proximo | null; nomeClube: string }) {
  if (!jogo) {
    return (
      <Secao antetitulo="Próximo jogo">
        <p className="proximo__vazio">Ainda não há jogo marcado.</p>
        <p className="proximo__meta">A direcção ainda não marcou o próximo jogo. Volta cá em breve.</p>
      </Secao>
    );
  }
  const contagem = contagemJogo(jogo.data);

  return (
    <Secao antetitulo="Próximo jogo">
      {contagem && <p className="proximo__contagem">{contagem}</p>}
      <p className="proximo__data">{formatarDataLonga(jogo.data)}</p>
      <p className="proximo__jogo">
        {nomeClube} vs {jogo.adversario}
      </p>
      <p className="proximo__meta">
        {formatarHora(jogo.data)} · {jogo.local} · {jogo.competicao}
      </p>
      {contagem && (
        <button type="button" className="botao-contorno" onClick={() => descarregarCalendario(jogo, nomeClube)}>
          Adicionar ao calendário
        </button>
      )}
    </Secao>
  );
}
