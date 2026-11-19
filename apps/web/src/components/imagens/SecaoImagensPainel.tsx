import { useEffect, useMemo, useState } from "react";
import { LADO_MAXIMO_IMAGEM, LIMITE_IMAGEM_CONVOCADOS_BYTES, type JogoDetalhe } from "@adnh-fc/shared";
import { obterInicio, publicarImagemConvocados, retirarImagemConvocados } from "../../lib/api";
import { comprimirParaWebp, ErroImagem } from "../../lib/comprimir-imagem";
import { usarPedido } from "../../lib/usar-pedido";
import { gerarImagem, type ConjuntoImagens, type TipoImagem } from "../../imagens/catalogo";
import { clubeParaImagem, imagensDoPainel } from "../../imagens/dados-painel";
import { CartaoImagem } from "./CartaoImagem";

type Props = {
  detalhe: JogoDetalhe;
  tipos: TipoImagem[];
  titulo?: string;
};

// Publica no site a imagem dos convocados (a mesma que se descarrega daqui); ao retirá-la, o site volta à lista.
function PublicarConvocados({ detalhe, conjunto }: { detalhe: JogoDetalhe; conjunto: ConjuntoImagens }) {
  const [publicada, definirPublicada] = useState(detalhe.jogo.convocadosImagemPublicada);
  const [aOcupar, definirAOcupar] = useState(false);
  const [mensagem, definirMensagem] = useState<{ texto: string; erro: boolean } | null>(null);
  const id = detalhe.jogo.id;

  // Guardar a convocatória alterada retira a imagem no servidor: segue-se o que o servidor diz.
  useEffect(() => {
    definirPublicada(detalhe.jogo.convocadosImagemPublicada);
  }, [detalhe]);

  async function publicar() {
    definirAOcupar(true);
    definirMensagem(null);
    try {
      const gerada = await gerarImagem("convocados", conjunto);
      const ficheiro = new File([gerada.blob], "convocados.png", { type: gerada.blob.type || "image/png" });
      const imagem = await comprimirParaWebp(ficheiro, Math.max(LADO_MAXIMO_IMAGEM, 1350), LIMITE_IMAGEM_CONVOCADOS_BYTES);
      await publicarImagemConvocados(id, { imagem });
      definirPublicada(true);
      definirMensagem({ texto: "Imagem publicada: já aparece na página do jogo.", erro: false });
    } catch (falha) {
      console.error("[imagens] falha ao publicar os convocados", falha);
      definirMensagem({
        texto: falha instanceof ErroImagem || falha instanceof Error ? falha.message : "Não foi possível publicar a imagem.",
        erro: true,
      });
    } finally {
      definirAOcupar(false);
    }
  }

  async function retirar() {
    definirAOcupar(true);
    definirMensagem(null);
    try {
      await retirarImagemConvocados(id);
      definirPublicada(false);
      definirMensagem({ texto: "Imagem retirada do site.", erro: false });
    } catch {
      definirMensagem({ texto: "Não foi possível retirar a imagem.", erro: true });
    } finally {
      definirAOcupar(false);
    }
  }

  const convocatoriaPublica = detalhe.jogo.convocatoriaPublicada;
  return (
    <div className="imagens__publicar">
      <h3 className="antetitulo">No site</h3>
      <p className="jogo__apoio">
        {publicada
          ? "A imagem dos convocados está publicada na página do jogo."
          : convocatoriaPublica
            ? "A imagem ainda não está no site."
            : "Publique primeiro a convocatória para poder publicar a imagem."}
      </p>
      <div className="formulario__accoes">
        <button type="button" className="botao" disabled={aOcupar || !convocatoriaPublica} onClick={() => void publicar()}>
          {aOcupar ? "A publicar…" : publicada ? "Publicar de novo" : "Publicar imagem no site"}
        </button>
        {publicada && (
          <button type="button" className="botao botao--secundario" disabled={aOcupar} onClick={() => void retirar()}>
            Retirar do site
          </button>
        )}
      </div>
      {mensagem && (
        <p className={mensagem.erro ? "aviso-erro__titulo" : "aviso-ok"} role={mensagem.erro ? "alert" : "status"}>
          {mensagem.texto}
        </p>
      )}
    </div>
  );
}

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
          <p className="aviso-erro__titulo">
            {estado.estadoHttp === 404
              ? "O clube ainda não foi configurado. Um administrador tem de gravar os dados do clube antes de gerar imagens."
              : "Não foi possível carregar os dados do clube."}
          </p>
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
      {conjunto && tipos.includes("convocados") && <PublicarConvocados detalhe={detalhe} conjunto={conjunto} />}
    </section>
  );
}
