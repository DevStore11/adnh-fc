import { Link } from "react-router-dom";
import type { HomemDoJogo as Homem } from "@adnh-fc/shared";
import { Secao } from "../ui/Secao";
import { SeloNumero } from "../ui/SeloNumero";
import { abreviarPosicao, iniciais, listarMinutos } from "../../lib/formatadores";

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
        <div className="homem__cromo">
          <div className="homem__foto">
            {homem.fotoUrl ? (
              <img src={homem.fotoUrl} alt={homem.nome} width={180} height={168} loading="lazy" />
            ) : (
              <span aria-hidden="true">{iniciais(homem.nome)}</span>
            )}
            <SeloNumero numero={homem.numero} />
          </div>
          <p className="homem__posicao">{abreviarPosicao(homem.posicao)}</p>
          <p className="homem__nome">
            <span className="so-leitores">Número {homem.numero}, </span>
            <Link to={`/jogadores/${homem.id}`} className="ligacao-texto">
              {homem.nome}
            </Link>
          </p>
        </div>
        <div className="homem__texto">
          <dl className="homem__estatisticas">
            <div className="homem__estatistica">
              <dt className="homem__rotulo homem__rotulo--golos">{homem.golos === 1 ? "Golo" : "Golos"}</dt>
              <dd className="homem__valor">{homem.golos}</dd>
            </div>
            <div className="homem__estatistica">
              <dt className="homem__rotulo">Assist.</dt>
              <dd className="homem__valor">{homem.assistencias}</dd>
            </div>
          </dl>
          <p className="homem__descricao">{descricaoDe(homem)}</p>
        </div>
      </div>
    </Secao>
  );
}
