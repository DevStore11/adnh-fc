import { iniciais } from "../../lib/formatadores";

export function DistintivoAdversario({ nome }: { nome: string }) {
  return (
    <span className="distintivo-adversario" aria-hidden="true">
      {iniciais(nome)}
    </span>
  );
}
