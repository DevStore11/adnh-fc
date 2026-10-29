import type { Resultado } from "@adnh-fc/shared";

const DESCRICAO: Record<Resultado, string> = { V: "Vitória", E: "Empate", D: "Derrota" };

export function EtiquetaResultado({ resultado }: { resultado: Resultado }) {
  return (
    <span className={`etiqueta-resultado etiqueta-resultado--${resultado.toLowerCase()}`}>
      <span aria-hidden="true">{resultado}</span>
      <span className="so-leitores">{DESCRICAO[resultado]}</span>
    </span>
  );
}
