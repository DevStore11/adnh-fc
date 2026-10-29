import type { JogadorNoCampo } from "@adnh-fc/shared";
import { apelido } from "../../lib/formatadores";

// Diagrama táctico em linhas; x e y são fracções (0 a 1) do campo, com y = 0 no ataque.
export function CampoOnze({ jogadores }: { jogadores: JogadorNoCampo[] }) {
  return (
    <div className="campo" role="group" aria-label="Onze inicial em campo">
      <svg className="campo__linhas" viewBox="0 0 600 700" aria-hidden="true" focusable="false">
        <rect x="0.5" y="0.5" width="599" height="699" />
        <path d="M210 0 A90 90 0 0 0 390 0" />
        <rect x="120" y="490" width="360" height="210" />
        <rect x="216" y="623" width="168" height="77" />
        <circle className="campo__ponto" cx="300" cy="560" r="2.5" />
      </svg>
      {jogadores.map((jogador) => (
        <div
          key={jogador.id}
          className="campo__jogador"
          style={{ left: `${jogador.x * 100}%`, top: `${jogador.y * 100}%` }}
        >
          <span className="campo__numero">{jogador.numero}</span>
          <span className="campo__nome">{apelido(jogador.nome)}</span>
        </div>
      ))}
    </div>
  );
}
