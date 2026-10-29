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

export function ErroCarregar({ aoTentar }: { aoTentar: () => void }) {
  return (
    <div className="estado estado--erro" role="alert">
      <p className="antetitulo">Erro</p>
      <h2 className="estado__titulo">Não foi possível carregar</h2>
      <p className="estado__texto">Verifique a ligação e tente de novo. Os dados não foram alterados.</p>
      <button type="button" className="botao" onClick={aoTentar}>
        Tentar de novo
      </button>
    </div>
  );
}

export function SemDados() {
  return (
    <div className="estado">
      <p className="antetitulo">Vazio</p>
      <h2 className="estado__titulo">Ainda sem jogos</h2>
      <p className="estado__texto">Quando o treinador marcar o primeiro jogo, aparece aqui.</p>
    </div>
  );
}
