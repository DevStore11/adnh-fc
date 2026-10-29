export function Carregando() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="so-leitores">A carregar…</span>
      {[0, 1, 2, 3, 4].map((linha) => (
        <div className="carregando__linha" key={linha} aria-hidden="true">
          <span className="carregando__barra" />
          <span className="carregando__barra" />
          <span className="carregando__barra" />
        </div>
      ))}
    </div>
  );
}

export function CarregandoCartoes() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="so-leitores">A carregar…</span>
      <div className="plantel__grade" aria-hidden="true">
        {[0, 1, 2, 3].map((cartao) => (
          <div className="esqueleto-cartao" key={cartao}>
            <span className="esqueleto-cartao__imagem" />
            <span className="esqueleto-cartao__linha" />
            <span className="esqueleto-cartao__linha esqueleto-cartao__linha--curta" />
          </div>
        ))}
      </div>
    </div>
  );
}

type PropsErro = {
  aoTentar: () => void;
  texto?: string;
};

export function ErroCarregar({
  aoTentar,
  texto = "Verifique a ligação e tente de novo. Os dados não foram alterados.",
}: PropsErro) {
  return (
    <div className="estado estado--erro" role="alert">
      <p className="antetitulo">Erro</p>
      <h2 className="estado__titulo">Não foi possível carregar</h2>
      <p className="estado__texto">{texto}</p>
      <button type="button" className="botao" onClick={aoTentar}>
        Tentar de novo
      </button>
    </div>
  );
}

type PropsVazio = {
  titulo?: string;
  texto?: string;
};

export function SemDados({
  titulo = "Ainda sem jogos",
  texto = "Quando o treinador marcar o primeiro jogo, aparece aqui.",
}: PropsVazio) {
  return (
    <div className="estado">
      <p className="antetitulo">Vazio</p>
      <h2 className="estado__titulo">{titulo}</h2>
      <p className="estado__texto">{texto}</p>
    </div>
  );
}
