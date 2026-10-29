import { useId } from "react";

type Props = {
  rotulo: string;
  valor: string;
  opcoes: { valor: string; texto: string }[];
  aoMudar: (valor: string) => void;
};

export function Seletor({ rotulo, valor, opcoes, aoMudar }: Props) {
  const id = useId();
  return (
    <div className="filtro">
      <label htmlFor={id} className="filtro__rotulo">
        {rotulo}
      </label>
      <select id={id} className="filtro__select" value={valor} onChange={(e) => aoMudar(e.target.value)}>
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.texto}
          </option>
        ))}
      </select>
    </div>
  );
}
