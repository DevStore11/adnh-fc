import { useState, type ReactNode } from "react";

type Props = {
  antetitulo: string;
  titulo: string;
  apoio?: string;
  children: ReactNode;
};

// Duas colunas: painel marinho com a marca e, ao lado, o formulário. Em ecrãs estreitos o painel passa para cima.
// Escudo configurado no painel; se ainda não houver (ou falhar), o escudo de reserva do site.
function LogoAcesso() {
  const [reserva, definirReserva] = useState(false);
  return (
    <img
      className="acesso__logo"
      src={reserva ? "/escudo.png" : "/api/publico/clube/escudo"}
      alt="Escudo da Associação Desportiva Novo Horizonte"
      width={240}
      height={276}
      onError={() => definirReserva(true)}
    />
  );
}

export function PaginaAcesso({ antetitulo, titulo, apoio, children }: Props) {
  return (
    <div className="acesso">
      <div className="acesso__painel">
        <LogoAcesso />
        <p className="acesso__antetitulo">Área privada · Acesso</p>
        <p className="acesso__marca">ADNH-FC</p>
        <p className="acesso__clube">Associação Desportiva Novo Horizonte</p>
      </div>
      <main className="acesso__conteudo">
        <div className="acesso__formulario">
          <p className="antetitulo">{antetitulo}</p>
          <h1 className="acesso__titulo">{titulo}</h1>
          {apoio && <p className="acesso__apoio">{apoio}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
