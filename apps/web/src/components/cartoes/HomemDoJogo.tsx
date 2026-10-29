import { Link } from "react-router-dom";
import type { HomemDoJogo as Homem } from "@adnh-fc/shared";
import { Secao } from "../ui/Secao";
import { abreviarPosicao, iniciais, listarMinutos } from "../../lib/formatadores";

function tituloDe(homem: Homem): string {
  if (homem.golos > 0) return `${homem.golos} ${homem.golos === 1 ? "golo" : "golos"}`;
  if (homem.assistencias > 0) {
    return `${homem.assistencias} ${homem.assistencias === 1 ? "assistência" : "assistências"}`;
  }
  return homem.nome;
}

function descricaoDe(homem: Homem): string {
  if (homem.descricao) return homem.descricao;
  const partes: string[] = [];
  if (homem.minutosGolos.length > 0) partes.push(`Marcou aos ${listarMinutos(homem.minutosGolos)}.`);
  partes.push("Eleito pelo treinador.");
  return partes.join(" ");
}

export function HomemDoJogo({ homem }: { homem: Homem }) {
  return (
    <Secao antetitulo="Homem do jogo">
      <div className="homem__topo">
        <span className="homem__numero" aria-hidden="true">
          {homem.numero}
        </span>
        <div className="homem__foto">
          {homem.fotoUrl ? (
            <img src={homem.fotoUrl} alt={homem.nome} width={126} height={168} loading="lazy" />
          ) : (
            <span aria-hidden="true">{iniciais(homem.nome)}</span>
          )}
        </div>
        <div className="homem__texto">
          <h3 className="homem__titulo">{tituloDe(homem)}</h3>
          <p className="homem__descricao">{descricaoDe(homem)}</p>
        </div>
      </div>
      <div className="homem__ficha">
        <p className="homem__posicao">{abreviarPosicao(homem.posicao)}</p>
        <p className="homem__nome">
          <Link to={`/jogadores/${homem.id}`} className="ligacao-texto">
            {homem.nome}
          </Link>
        </p>
        <p className="homem__numeros">
          Golos {homem.golos} · Assist. {homem.assistencias}
        </p>
      </div>
    </Secao>
  );
}
