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
  aoAbrir: (indice: number, gatilho: HTMLButtonElement) => void;
};

const ROTULO_POSICAO: Record<Posicao, string> = {
  "guarda-redes": "Guarda-redes",
  defesa: "Defesa",
  médio: "Médio",
  avançado: "Avançado",
};

// Mesmo desenho do campo público; cada lugar é um botão (coluna inteira: foto, disco e nome) que abre a lista de escolha.
export function CampoEditavel({ lugares, seleccionado, escurecido, bloqueado, aoAbrir }: Props) {
  const normalizar = normalizarY(lugares.map((l) => l.y));

  return (
    <div
      className={`campo campo--onze campo--editavel${escurecido ? " campo--escurecido" : ""}`}
      role="group"
      aria-label="Campo: toque num lugar para escolher o jogador"
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
            style={estiloDoLugar(lugar.x, normalizar(lugar.y))}
            aria-label={descricao}
            aria-haspopup="dialog"
            aria-expanded={aberto}
            disabled={bloqueado}
            onClick={(evento) => aoAbrir(lugar.indice, evento.currentTarget)}
          >
            {lugar.jogador ? <PecaJogador jogador={lugar.jogador} /> : <PecaVazia posicao={lugar.posicao} />}
          </button>
        );
      })}
    </div>
  );
}
