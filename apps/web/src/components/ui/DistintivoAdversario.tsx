import { useState } from "react";
import { urlEscudoAdversario } from "../../lib/api";
import { iniciais } from "../../lib/formatadores";

// Escudo do adversário; sem escudo carregado (ou se falhar), as iniciais.
export function DistintivoAdversario({ nome, pequeno = false }: { nome: string; pequeno?: boolean }) {
  const [falhou, definirFalhou] = useState(false);
  const classe = `distintivo-adversario${pequeno ? " distintivo-adversario--pequeno" : ""}`;

  if (falhou) {
    return (
      <span className={classe} aria-hidden="true">
        {iniciais(nome)}
      </span>
    );
  }
  return (
    <span className={`${classe} distintivo-adversario--escudo`} aria-hidden="true">
      <img
        key={nome}
        src={urlEscudoAdversario(nome)}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => definirFalhou(true)}
      />
    </span>
  );
}
