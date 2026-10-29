import { RotaPrivada } from "../AuthContexto";
import CascaPrivada from "./CascaPrivada";

const ITENS = [
  { para: "/admin/gestores", texto: "Gestores" },
  { para: "/admin/clube", texto: "Clube" },
  { para: "/admin/actividade", texto: "Actividade" },
];

export default function AdminLayout() {
  return (
    <RotaPrivada papeis={["admin"]}>
      <CascaPrivada antetitulo="Área privada · Admin" navegacao="Administração" itens={ITENS} />
    </RotaPrivada>
  );
}
