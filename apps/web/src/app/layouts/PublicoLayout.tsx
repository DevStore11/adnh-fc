import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { InicioProvider, useInicio } from "../InicioContexto";
import { Escudo } from "../../components/ui/Escudo";
import { dividirNomeClube } from "../../lib/formatadores";

const ESCUDO_RESERVA = "/escudo.png";

// Resolve quando a imagem está carregada (ou falhou), para o escudo e o nome aparecerem juntos.
function useImagemPronta(url: string | null): boolean {
  const [pronta, definirPronta] = useState(false);

  useEffect(() => {
    definirPronta(false);
    if (!url) return;
    const imagem = new Image();
    const concluir = () => definirPronta(true);
    imagem.onload = concluir;
    imagem.onerror = concluir;
    imagem.src = url;
    return () => {
      imagem.onload = null;
      imagem.onerror = null;
    };
  }, [url]);

  return pronta;
}

function EsqueletoMarca() {
  return (
    <div className="cabecalho__esqueleto" aria-hidden="true">
      <span className="cabecalho__esqueleto-escudo" />
      <span className="cabecalho__esqueleto-texto">
        <span className="cabecalho__esqueleto-linha" />
        <span className="cabecalho__esqueleto-linha cabecalho__esqueleto-linha--grande" />
      </span>
    </div>
  );
}

function Cabecalho() {
  const { estado } = useInicio();
  const clube = estado.fase === "pronto" ? estado.dados.clube : null;
  const urlEscudo = clube ? (clube.escudoUrl ?? ESCUDO_RESERVA) : null;
  const escudoPronto = useImagemPronta(urlEscudo);
  const aCarregar = estado.fase === "carregando" || (clube !== null && !escudoPronto);
  const nome = dividirNomeClube(clube?.nome ?? "ADNH-FC");

  return (
    <header className="cabecalho">
      {aCarregar ? (
        <EsqueletoMarca />
      ) : (
        <Link to="/" className="cabecalho__marca">
          <Escudo url={clube?.escudoUrl ?? null} className="cabecalho__escudo" />
          <span>
            {nome.prefixo && <span className="cabecalho__antetitulo">{nome.prefixo}</span>}
            <span className="cabecalho__nome">{nome.principal}</span>
          </span>
        </Link>
      )}
      <nav className="nav" aria-label="Principal">
        <NavLink to="/" end>
          Início
        </NavLink>
        <NavLink to="/jogadores">Plantel</NavLink>
        <NavLink to="/jogos">Jogos</NavLink>
        <NavLink to="/estatisticas">Estatísticas</NavLink>
      </nav>
    </header>
  );
}

function Rodape() {
  return (
    <footer className="rodape">
      <div>
        <p>A.D. Novo Horizonte · Maputo, Moçambique</p>
        <p>Página pública do clube · /c/novo-horizonte</p>
      </div>
      <Link to="/entrar">Entrar</Link>
    </footer>
  );
}

export default function PublicoLayout() {
  return (
    <InicioProvider>
      <div className="contentor">
        <Cabecalho />
        <main className="pagina">
          <Outlet />
        </main>
        <Rodape />
      </div>
    </InicioProvider>
  );
}
