import { useEffect, useId, useRef } from "react";

type Props = {
  titulo: string;
  texto: string;
  rotuloConfirmar: string;
  aOcupar: boolean;
  erro: string | null;
  aoConfirmar: () => void;
  aoCancelar: () => void;
};

// Confirmação obrigatória em acções destrutivas: nome do alvo por extenso e botão de confirmação a vermelho.
export function ConfirmarDestrutivo({ titulo, texto, rotuloConfirmar, aOcupar, erro, aoConfirmar, aoCancelar }: Props) {
  const referencia = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = referencia.current;
    if (dialogo && !dialogo.open) dialogo.showModal();
    return () => {
      if (dialogo?.open) dialogo.close();
    };
  }, []);

  return (
    <dialog
      ref={referencia}
      className="modal"
      aria-labelledby={idTitulo}
      onCancel={(evento) => {
        evento.preventDefault();
        if (!aOcupar) aoCancelar();
      }}
    >
      <p className="modal__antetitulo">Acção destrutiva</p>
      <h2 className="modal__titulo" id={idTitulo}>
        {titulo}
      </h2>
      <p className="modal__texto">{texto}</p>
      {erro && (
        <p className="modal__erro" role="alert">
          {erro}
        </p>
      )}
      <div className="modal__accoes">
        <button type="button" className="botao botao--secundario" onClick={aoCancelar} disabled={aOcupar}>
          Cancelar
        </button>
        <button type="button" className="botao botao--perigo" onClick={aoConfirmar} disabled={aOcupar}>
          {aOcupar ? "A processar…" : rotuloConfirmar}
        </button>
      </div>
    </dialog>
  );
}
