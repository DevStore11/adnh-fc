import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { POSICOES, type JogoPublico } from "@adnh-fc/shared";
import { CampoOnze } from "../../components/campo/CampoOnze";
import { HomemDoJogo } from "../../components/cartoes/HomemDoJogo";
import { CartaoImagem } from "../../components/imagens/CartaoImagem";
import { Carregando, ErroCarregar, SemDados } from "../../components/ui/Estados";
import { Secao } from "../../components/ui/Secao";
import type { TipoImagem } from "../../imagens/catalogo";
import { imagensPublicas } from "../../imagens/dados-publicos";
import { obterJogoPublico } from "../../lib/api";
import {
  dividirNomeClube,
  formatarDataLonga,
  formatarHora,
  formatarPlacar,
  tituloGrupo,
} from "../../lib/formatadores";
import { usarMeta } from "../../lib/usar-meta";
import { usarPedido } from "../../lib/usar-pedido";

const ORDEM: TipoImagem[] = ["placar-final", "homem-do-jogo", "onze-inicial", "convocados"];

const ROTULO_EVENTO: Record<JogoPublico["eventos"][number]["tipo"], string> = {
  golo: "Golo",
  assist: "Assistência",
  amarelo: "Cartão amarelo",
  vermelho: "Cartão vermelho",
  golo_sofrido: "Golo sofrido",
};

function ListaEventos({ eventos }: { eventos: JogoPublico["eventos"] }) {
  return (
    <ol className="eventos">
      {eventos.map((evento, indice) => (
        <li key={indice} className={`eventos__linha eventos__linha--${evento.tipo}`}>
          <span className="eventos__minuto">{evento.minuto}'</span>
          <span className="eventos__tipo">{ROTULO_EVENTO[evento.tipo]}</span>
          {evento.nome && <span className="eventos__nome">{evento.nome}</span>}
        </li>
      ))}
    </ol>
  );
}

export default function Jogo() {
  const parametros = useParams();
  const id = Number(parametros.id);
  const valido = Number.isInteger(id) && id > 0;
  const { estado, recarregar } = usarPedido((sinal) => obterJogoPublico(id, sinal), [id]);
  const dados = estado.fase === "pronto" ? estado.dados : null;
  const conjunto = useMemo(() => (dados ? imagensPublicas(dados) : null), [dados]);

  const nomeClube = dados ? dividirNomeClube(dados.clube.nome).principal : null;
  const terminado = dados ? dados.jogo.golosPro !== null && dados.jogo.golosContra !== null : false;
  const titulo = dados
    ? terminado
      ? `${nomeClube} ${formatarPlacar(dados.jogo.golosPro ?? 0, dados.jogo.golosContra ?? 0)} ${dados.jogo.adversario}`
      : `${nomeClube} vs ${dados.jogo.adversario}`
    : null;
  usarMeta(titulo, dados ? `${dados.jogo.competicao} · ${formatarDataLonga(dados.jogo.data)} · ${dados.jogo.local}` : undefined);

  if (!valido) return <SemDados titulo="Jogo não encontrado" texto="Este jogo não existe." />;
  if (estado.fase === "carregando") return <Carregando />;
  if (estado.fase === "erro") {
    return estado.estadoHttp === 404 ? (
      <SemDados titulo="Jogo não encontrado" texto="Este jogo não existe." />
    ) : (
      <ErroCarregar aoTentar={recarregar} />
    );
  }
  if (!dados || !conjunto) return null;

  const { jogo, clube, onze, convocados, homemDoJogo, eventos } = dados;
  const publicadas = ORDEM.filter((tipo) => conjunto[tipo].dados);
  const homem = homemDoJogo
    ? {
        ...homemDoJogo.jogador,
        golos: homemDoJogo.golos,
        assistencias: homemDoJogo.assistencias,
        minutosGolos: eventos
          .filter((e) => e.tipo === "golo" && e.nome === homemDoJogo.jogador.nome)
          .map((e) => e.minuto),
        descricao: homemDoJogo.descricao,
      }
    : null;
  const grupos = POSICOES.map((posicao) => ({
    posicao,
    jogadores: (convocados ?? []).filter((j) => j.posicao === posicao),
  })).filter((grupo) => grupo.jogadores.length > 0);

  return (
    <>
      <header className="jogo-publico__cabecalho">
        <Link to="/jogos" className="ligacao">
          ← Jogos
        </Link>
        <p className="antetitulo">{jogo.competicao}</p>
        <h1 className="jogo-publico__titulo">
          {nomeClube} vs {jogo.adversario}
        </h1>
        {terminado && (
          <p className="jogo-publico__placar">{formatarPlacar(jogo.golosPro ?? 0, jogo.golosContra ?? 0)}</p>
        )}
        <p className="apoio-pagina">
          {formatarDataLonga(jogo.data)} · {formatarHora(jogo.data)} · {jogo.local}
        </p>
        {!terminado && <p className="apoio-pagina">{clube.nome} ainda não jogou esta partida.</p>}
      </header>

      {eventos.length > 0 && (
        <Secao antetitulo="Eventos do jogo">
          <ListaEventos eventos={eventos} />
        </Secao>
      )}

      {(onze || homem) && (
        <div className={`home-grade${onze && homem ? " home-grade--duas" : ""}`}>
          {onze && (
            <Secao antetitulo={`Onze inicial · ${onze.formacao}`}>
              <CampoOnze jogadores={onze.titulares} />
              {onze.suplentes.length > 0 && (
                <p className="suplentes">
                  Suplentes:{" "}
                  {onze.suplentes.map((s, i) => (
                    <span key={s.id}>
                      {i > 0 && ", "}
                      <Link to={`/jogadores/${s.id}`} className="ligacao-texto">
                        {s.nome}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </Secao>
          )}
          {homem && <HomemDoJogo homem={homem} />}
        </div>
      )}

      {convocados && (
        <Secao antetitulo={`Convocatória · ${convocados.length} jogadores`}>
          {grupos.map((grupo) => (
            <div key={grupo.posicao} className="convocatoria">
              <h3 className="convocatoria__titulo">{tituloGrupo(grupo.posicao)}</h3>
              <ul className="convocatoria__lista">
                {grupo.jogadores
                  .slice()
                  .sort((a, b) => a.numero - b.numero)
                  .map((j) => (
                    <li key={j.id}>
                      <span className="convocatoria__numero">{j.numero}</span>
                      <Link to={`/jogadores/${j.id}`} className="ligacao-texto">
                        {j.nome}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </Secao>
      )}

      {publicadas.length > 0 && (
        <Secao antetitulo="Imagens para partilhar">
          <div className="imagens__grelha">
            {publicadas.map((tipo) => (
              <CartaoImagem key={tipo} tipo={tipo} conjunto={conjunto} modo="publico" />
            ))}
          </div>
        </Secao>
      )}
    </>
  );
}
