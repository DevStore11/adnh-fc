// Número da camisola em selo marinho com neon, colado ao canto inferior esquerdo da foto.
// O pai tem de ser `position: relative`; o número é decorativo (o nome do jogador já o inclui).
export function SeloNumero({ numero }: { numero: number }) {
  return (
    <span className="selo-numero" aria-hidden="true">
      {numero}
    </span>
  );
}
