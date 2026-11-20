import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { Posicao } from "@adnh-fc/shared";
import { nomeCurto } from "../../lib/formatadores";
import { CampoLinhas, estiloDoLugar, normalizarY, PecaJogador, PecaVazia } from "./CampoOnze";

export type JogadorNoLugar = { id: number; nome: string; numero: number; fotoUrl: string | null };

export type LugarNoEditor = {
  indice: number;
  posicao: Posicao;
  x: number;
  y: number;
  jogador: JogadorNoLugar | null;
};

type Props = {
  lugares: LugarNoEditor[];
  // Lugar com a lista de escolha aberta
  seleccionado: number | null;
  // Campo escurecido por baixo da folha (telemóvel)
  escurecido: boolean;
  bloqueado: boolean;
  // Modo de mover: arrastar (ou setas) muda a posição do lugar; tocar já não abre a lista
  mover: boolean;
  aoAbrir: (indice: number, gatilho: HTMLButtonElement) => void;
  // x e y novos do lugar, como ficam guardados (y antes da normalização do campo)
  aoMover: (indice: number, x: number, y: number) => void;
};

type Arrasto = {
  indice: number;
  ponteiroX: number;
  ponteiroY: number;
  x: number;
  // y já normalizado (0 = topo do campo, 1 = base)
  yCampo: number;
  // y de todos os lugares no início do gesto: a normalização fica congelada até largar
  ys: number[];
};

const ROTULO_POSICAO: Record<Posicao, string> = {
  "guarda-redes": "Guarda-redes",
  defesa: "Defesa",
  médio: "Médio",
  avançado: "Avançado",
};

const PASSO_X = 0.02;
const PASSO_Y = 0.03;

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor));
}

// Medidas do campo em px, com as mesmas contas do CSS de .onze-jogador (left e top).
function medidasDoCampo(campo: HTMLElement): { largura: number; util: number; margemX: number } {
  const caixa = campo.getBoundingClientRect();
  const estilo = getComputedStyle(campo);
  const foto = parseFloat(estilo.getPropertyValue("--foto")) || 64;
  const folga = parseFloat(estilo.getPropertyValue("--nome-folga")) || 10;
  const largura = Math.max(1, caixa.width);
  return { largura, util: Math.max(1, caixa.height - foto - 24 - folga), margemX: foto / 2 / largura };
}

// Inverso de normalizarY: do y do campo (0 a 1) para o y guardado.
function yGuardado(ys: number[], yCampo: number): number {
  const minimo = Math.min(...ys);
  const amplitude = Math.max(...ys) - minimo;
  return amplitude < 0.05 ? yCampo : minimo + yCampo * amplitude;
}

// Mesmo desenho do campo público; cada lugar é um botão (coluna inteira: foto, disco e nome) que abre a lista de escolha.
// No modo de mover, cada lugar arrasta-se (rato e toque) ou move-se com as setas.
export function CampoEditavel({ lugares, seleccionado, escurecido, bloqueado, mover, aoAbrir, aoMover }: Props) {
  const campo = useRef<HTMLDivElement>(null);
  const arrasto = useRef<Arrasto | null>(null);
  const [congelado, definirCongelado] = useState<number[] | null>(null);
  const [arrastadoIndice, definirArrastadoIndice] = useState<number | null>(null);
  const normalizar = normalizarY(congelado ?? lugares.map((l) => l.y));
  const emMovimento = mover && !bloqueado;

  function iniciar(evento: PointerEvent<HTMLButtonElement>, lugar: LugarNoEditor) {
    if (!emMovimento || !campo.current) return;
    const { margemX } = medidasDoCampo(campo.current);
    const ys = lugares.map((l) => l.y);
    evento.currentTarget.setPointerCapture(evento.pointerId);
    arrasto.current = {
      indice: lugar.indice,
      ponteiroX: evento.clientX,
      ponteiroY: evento.clientY,
      x: limitar(lugar.x, margemX, 1 - margemX),
      yCampo: normalizarY(ys)(lugar.y),
      ys,
    };
    definirCongelado(ys);
    definirArrastadoIndice(lugar.indice);
  }

  function arrastar(evento: PointerEvent<HTMLButtonElement>, lugar: LugarNoEditor) {
    const actual = arrasto.current;
    if (!actual || actual.indice !== lugar.indice || !campo.current) return;
    const { largura, util, margemX } = medidasDoCampo(campo.current);
    const x = limitar(actual.x + (evento.clientX - actual.ponteiroX) / largura, margemX, 1 - margemX);
    const yCampo = limitar(actual.yCampo + (evento.clientY - actual.ponteiroY) / util, 0, 1);
    aoMover(lugar.indice, x, yGuardado(actual.ys, yCampo));
  }

  function largar() {
    arrasto.current = null;
    definirCongelado(null);
    definirArrastadoIndice(null);
  }

  function aoTeclar(evento: KeyboardEvent<HTMLButtonElement>, lugar: LugarNoEditor) {
    if (!emMovimento) return;
    const ys = lugares.map((l) => l.y);
    const minimo = Math.min(...ys);
    const maximo = Math.max(...ys);
    const amplitude = maximo - minimo;
    const { margemX } = campo.current ? medidasDoCampo(campo.current) : { margemX: 0.1 };
    let x = lugar.x;
    let y = lugar.y;
    if (evento.key === "ArrowLeft") x -= PASSO_X;
    else if (evento.key === "ArrowRight") x += PASSO_X;
    else if (evento.key === "ArrowUp") y -= PASSO_Y * Math.max(amplitude, 0.05);
    else if (evento.key === "ArrowDown") y += PASSO_Y * Math.max(amplitude, 0.05);
    else return;
    evento.preventDefault();
    aoMover(lugar.indice, limitar(x, margemX, 1 - margemX), amplitude < 0.05 ? y : limitar(y, minimo, maximo));
  }

  return (
    <div
      ref={campo}
      className={`campo campo--onze campo--editavel${escurecido ? " campo--escurecido" : ""}`}
      role="group"
      aria-label={
        mover ? "Campo: arraste os jogadores para mudar as posições" : "Campo: toque num lugar para escolher o jogador"
      }
    >
      <CampoLinhas />
      {lugares.map((lugar) => {
        const aberto = lugar.indice === seleccionado;
        const descricao = lugar.jogador
          ? `${ROTULO_POSICAO[lugar.posicao]}, ${nomeCurto(lugar.jogador.nome)}`
          : `${ROTULO_POSICAO[lugar.posicao]}, lugar vazio`;
        return (
          <button
            key={lugar.indice}
            type="button"
            className={`onze-jogador onze-jogador--lugar${aberto ? " onze-jogador--seleccionado" : ""}`}
            style={{
              ...estiloDoLugar(lugar.x, normalizar(lugar.y)),
              // No modo de mover o gesto pertence ao jogador, não ao scroll da página.
              ...(mover ? { touchAction: "none" as const, cursor: bloqueado ? "default" : "grab" } : {}),
              ...(lugar.indice === arrastadoIndice ? { zIndex: 2, cursor: "grabbing" } : {}),
            }}
            aria-label={mover ? `${descricao}. Setas para mover` : descricao}
            aria-haspopup={mover ? undefined : "dialog"}
            aria-expanded={mover ? undefined : aberto}
            disabled={bloqueado}
            onClick={(evento) => {
              if (!mover) aoAbrir(lugar.indice, evento.currentTarget);
            }}
            onPointerDown={(evento) => iniciar(evento, lugar)}
            onPointerMove={(evento) => arrastar(evento, lugar)}
            onPointerUp={largar}
            onPointerCancel={largar}
            onKeyDown={(evento) => aoTeclar(evento, lugar)}
          >
            {lugar.jogador ? <PecaJogador jogador={lugar.jogador} /> : <PecaVazia posicao={lugar.posicao} />}
          </button>
        );
      })}
    </div>
  );
}
