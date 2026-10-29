import type { KeyboardEvent, PointerEvent as EventoPonteiro, RefObject } from "react";
import { apelido } from "../../lib/formatadores";

export type JogadorNoEditor = { id: number; numero: number; nome: string; x: number; y: number };

type Props = {
  referencia: RefObject<HTMLDivElement>;
  jogadores: JogadorNoEditor[];
  seleccionadoId: number | null;
  arrastadoId: number | null;
  aoIniciarArrasto: (evento: EventoPonteiro, id: number) => void;
  aoSeleccionar: (id: number) => void;
  aoMover: (id: number, dx: number, dy: number) => void;
  aoRetirar: (id: number) => void;
};

const PASSO = 0.02;

// Mesmo desenho do campo público, mas com os jogadores arrastáveis (rato e toque) e movíveis com as setas.
export function CampoEditavel({
  referencia,
  jogadores,
  seleccionadoId,
  arrastadoId,
  aoIniciarArrasto,
  aoSeleccionar,
  aoMover,
  aoRetirar,
}: Props) {
  function aoTeclar(evento: KeyboardEvent, id: number) {
    const movimentos: Record<string, [number, number]> = {
      ArrowLeft: [-PASSO, 0],
      ArrowRight: [PASSO, 0],
      ArrowUp: [0, -PASSO],
      ArrowDown: [0, PASSO],
    };
    const movimento = movimentos[evento.key];
    if (movimento) {
      evento.preventDefault();
      aoMover(id, movimento[0], movimento[1]);
    } else if (evento.key === "Delete" || evento.key === "Backspace") {
      evento.preventDefault();
      aoRetirar(id);
    }
  }

  return (
    <div className="campo campo--editavel" ref={referencia} role="group" aria-label="Campo: arraste os jogadores">
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
          className={`campo__jogador campo__jogador--arrastavel${jogador.id === seleccionadoId ? " campo__jogador--seleccionado" : ""}${jogador.id === arrastadoId ? " campo__jogador--arrastado" : ""}`}
          style={{ left: `${jogador.x * 100}%`, top: `${jogador.y * 100}%` }}
          role="button"
          tabIndex={0}
          aria-label={`${jogador.nome}, número ${jogador.numero}. Setas para mover, Delete para passar a suplente.`}
          onPointerDown={(evento) => aoIniciarArrasto(evento, jogador.id)}
          onFocus={() => aoSeleccionar(jogador.id)}
          onKeyDown={(evento) => aoTeclar(evento, jogador.id)}
        >
          <span className="campo__numero">{jogador.numero}</span>
          <span className="campo__nome">{apelido(jogador.nome)}</span>
        </div>
      ))}
    </div>
  );
}
