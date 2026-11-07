import { useState, type CSSProperties } from "react";
import type { JogadorNoCampo, Posicao } from "@adnh-fc/shared";
import { abreviarPosicao, inicialEApelido, nomeCurto } from "../../lib/formatadores";

const FOTO = 64;

export type DadosPeca = { nome: string; numero: number; fotoUrl?: string | null };

// Foto redonda com anel claro e disco com o número; sem foto (ou se ela falhar), círculo com o número grande.
// O tamanho vem da variável --foto de quem a usa (campo, lista de escolha).
export function Retrato({ jogador }: { jogador: DadosPeca }) {
  const [falhou, definirFalhou] = useState(false);
  const comFoto = Boolean(jogador.fotoUrl) && !falhou;

  if (!comFoto) {
    return (
      <span className="onze-jogador__retrato">
        <span className="onze-jogador__foto onze-jogador__foto--vazia" aria-hidden="true">
          {jogador.numero}
        </span>
      </span>
    );
  }

  return (
    <span className="onze-jogador__retrato">
      <span className="onze-jogador__foto">
        <img
          src={jogador.fotoUrl ?? undefined}
          alt={jogador.nome}
          width={FOTO}
          height={FOTO}
          loading="lazy"
          decoding="async"
          onError={() => definirFalhou(true)}
        />
      </span>
      <span className="onze-jogador__numero" aria-hidden="true">
        {jogador.numero}
      </span>
    </span>
  );
}

// Retrato e pílula com o nome (telemóvel: só o apelido; computador: inicial e apelido).
export function PecaJogador({ jogador }: { jogador: DadosPeca }) {
  return (
    <>
      <Retrato key={jogador.fotoUrl ?? "sem-foto"} jogador={jogador} />
      <span className="onze-jogador__nome" aria-hidden="true">
        <span className="onze-jogador__nome--curto">{nomeCurto(jogador.nome)}</span>
        <span className="onze-jogador__nome--longo">{inicialEApelido(jogador.nome)}</span>
      </span>
    </>
  );
}

// Lugar vazio: círculo tracejado com "+" e, por baixo, a posição.
export function PecaVazia({ posicao }: { posicao: Posicao }) {
  return (
    <>
      <span className="onze-jogador__retrato">
        <span className="onze-jogador__foto onze-jogador__foto--lugar" aria-hidden="true">
          +
        </span>
      </span>
      <span className="onze-jogador__nome onze-jogador__nome--posicao" aria-hidden="true">
        {abreviarPosicao(posicao)}
      </span>
    </>
  );
}

export function CampoLinhas() {
  return (
    <svg className="campo__linhas" viewBox="0 0 600 700" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <rect x="0.5" y="0.5" width="599" height="699" />
      <path d="M210 0 A90 90 0 0 0 390 0" />
      <rect x="120" y="574" width="360" height="126" />
    </svg>
  );
}

// A linha mais avançada fica junto ao topo e a mais recuada junto à base, para a foto, o número e o nome caberem sempre.
export function normalizarY(ys: number[]): (y: number) => number {
  const minimo = Math.min(...ys);
  const amplitude = Math.max(...ys) - minimo;
  return (y) => (amplitude < 0.05 ? 0.5 : (y - minimo) / amplitude);
}

export function estiloDoLugar(x: number, y: number): CSSProperties {
  return { "--x": x, "--y": y } as CSSProperties;
}

// Diagrama táctico em linhas; x e y são fracções (0 a 1) do campo, com y = 0 no ataque.
export function CampoOnze({ jogadores }: { jogadores: JogadorNoCampo[] }) {
  const normalizar = normalizarY(jogadores.map((j) => j.y));

  return (
    <div className="campo campo--onze" role="group" aria-label="Onze inicial em campo">
      <CampoLinhas />
      {jogadores.map((jogador) => (
        <div
          key={jogador.id}
          className="onze-jogador"
          style={estiloDoLugar(jogador.x, normalizar(jogador.y))}
          role="group"
          aria-label={`${jogador.nome}, número ${jogador.numero}`}
        >
          <PecaJogador jogador={jogador} />
        </div>
      ))}
    </div>
  );
}
