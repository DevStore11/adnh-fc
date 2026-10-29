import { useMemo } from "react";
import type { JogoDetalhe } from "@adnh-fc/shared";
import { obterInicio } from "../../lib/api";
import { usarPedido } from "../../lib/usar-pedido";
import type { TipoImagem } from "../../imagens/catalogo";
import { clubeParaImagem, imagensDoPainel } from "../../imagens/dados-painel";
import { CartaoImagem } from "./CartaoImagem";

type Props = {
  detalhe: JogoDetalhe;
  tipos: TipoImagem[];
  titulo?: string;
};

// Imagens para partilhar, geradas no navegador. O escudo e as cores do clube vêm dos dados públicos do clube.
export function SecaoImagensPainel({ detalhe, tipos, titulo = "Imagens para partilhar" }: Props) {
  const { estado, recarregar } = usarPedido((sinal) => obterInicio(sinal));
  const clube = estado.fase === "pronto" ? estado.dados.clube : null;
  const conjunto = useMemo(
    () => (clube ? imagensDoPainel(detalhe, clubeParaImagem(clube)) : null),
    [detalhe, clube],
  );

  return (
    <section className="painel-bloco imagens" aria-labelledby="imagens-titulo">
      <h2 className="antetitulo" id="imagens-titulo">
        {titulo}
      </h2>
      <p className="jogo__apoio">As imagens usam o que está guardado. Descarregue ou partilhe directamente para o WhatsApp.</p>
      {estado.fase === "carregando" &&<p className="jogo__apoio">A preparar…</p>}
      {estado.fase === "erro" && (
        <div className="aviso-erro" role="alert">
          <p className="aviso-erro__titulo">Não foi possível carregar os dados do clube.</p>
          <button type="button" className="ligacao ligacao--botao" onClick={recarregar}>
            Tentar de novo
          </button>
        </div>
      )}
      {conjunto && (
        <div className="imagens__grelha">
          {tipos.map((tipo) => (
            <CartaoImagem key={tipo} tipo={tipo} conjunto={conjunto} modo="painel" />
          ))}
        </div>
      )}
    </section>
  );
}
