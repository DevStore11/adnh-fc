import { RotaPrivada } from "../AuthContexto";
import CascaPrivada from "./CascaPrivada";

const ITENS = [
  { para: "/painel/jogadores", texto: "Jogadores" },
  { para: "/painel/jogos", texto: "Jogos" },
];

export default function PainelLayout() {
  return (
    <RotaPrivada papeis={["admin", "gestor"]}>
      <CascaPrivada antetitulo="Área privada · Gestor" navegacao="Painel" itens={ITENS} />
    </RotaPrivada>
  );
}
