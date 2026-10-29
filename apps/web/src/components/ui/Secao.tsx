import { useId, type ReactNode } from "react";

type Props = {
  antetitulo: string;
  children: ReactNode;
};

// Régua grossa de 4 px com antetítulo, como em todas as secções do design.
export function Secao({ antetitulo, children }: Props) {
  const id = useId();
  return (
    <section className="secao" aria-labelledby={id}>
      <h2 className="antetitulo" id={id}>
        {antetitulo}
      </h2>
      {children}
    </section>
  );
}
