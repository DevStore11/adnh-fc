import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContexto";

type Item = { para: string; texto: string };

type Props = {
  antetitulo: string;
  navegacao: string;
  itens: Item[];
};

// Faixa marinho com a marca e o utilizador, separadores por baixo e o conteúdo da página.
export default function CascaPrivada({ antetitulo, navegacao, itens }: Props) {
  const { estado, terminarSessao } = useAuth();
  const nome = estado.fase === "autenticado" ? estado.utilizador.nome : "";

  return (
    <div className="privado">
      <header className="privado__topo">
        <div className="privado__marca">
          <p className="privado__antetitulo">{antetitulo}</p>
          <p className="privado__nome">ADNH-FC</p>
        </div>
        <div className="privado__utilizador">
          <span>{nome}</span>
          <button type="button" className="privado__sair" onClick={() => void terminarSessao()}>
            Sair
          </button>
        </div>
      </header>
      <nav className="privado__nav" aria-label={navegacao}>
        {itens.map((item) => (
          <NavLink key={item.para} to={item.para}>
            {item.texto}
          </NavLink>
        ))}
      </nav>
      <main className="privado__conteudo">
        <Outlet />
      </main>
    </div>
  );
}
