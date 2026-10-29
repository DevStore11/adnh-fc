import type { ReactNode } from "react";

type Props = {
  antetitulo: string;
  titulo: string;
  apoio?: string;
  children: ReactNode;
};

// Duas colunas: painel marinho com a marca e, ao lado, o formulário. Em ecrãs estreitos o painel passa para cima.
export function PaginaAcesso({ antetitulo, titulo, apoio, children }: Props) {
  return (
    <div className="acesso">
      <div className="acesso__painel">
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
