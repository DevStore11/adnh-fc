import { useCallback, useEffect, useRef, useState } from "react";
import {
  gerarImagem,
  TITULOS_IMAGEM,
  type ConjuntoImagens,
  type Gerada,
  type TipoImagem,
} from "../../imagens/catalogo";
import type { FormatoPlacar } from "../../imagens/tipos";

type Props = {
  tipo: TipoImagem;
  conjunto: ConjuntoImagens;
  // painel: gera ao clicar e permite partilhar; publico: gera logo e só descarrega
  modo: "painel" | "publico";
};

type Estado =
  | { fase: "inicial" }
  | { fase: "a-gerar" }
  // mensagem: frase já pensada para o utilizador, ou null para usar o texto genérico
  | { fase: "erro"; mensagem: string | null }
  | { fase: "pronta"; gerada: Gerada; pre: string };

const MENSAGEM_GENERICA = "Não foi possível gerar a imagem.";

// Só as mensagens que o próprio código lança (Error simples, em português) são mostradas; erros do navegador
// (TypeError, DOMException, RangeError…) são técnicos e ficam só na consola.
function mensagemParaUtilizador(erro: unknown): string | null {
  if (!(erro instanceof Error) || erro.name !== "Error") return null;
  return erro.message && erro.message !== MENSAGEM_GENERICA ? erro.message : null;
}

// A pré-visualização usa um data URL: a política de segurança do site só deixa carregar imagens 'self' e data:.
function paraDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader();
    leitor.onload = () => resolver(String(leitor.result));
    leitor.onerror = () => rejeitar(leitor.error);
    leitor.readAsDataURL(blob);
  });
}

function descarregar(gerada: Gerada): void {
  const url = URL.createObjectURL(gerada.blob);
  const ligacao = document.createElement("a");
  ligacao.href = url;
  ligacao.download = gerada.nome;
  document.body.append(ligacao);
  ligacao.click();
  ligacao.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function podePartilhar(gerada: Gerada): File | null {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function" || !navigator.share) return null;
  // Alguns navegadores lançam em vez de devolver false: nesse caso só se oferece descarregar.
  try {
    const ficheiro = new File([gerada.blob], gerada.nome, { type: "image/png" });
    return navigator.canShare({ files: [ficheiro] }) ? ficheiro : null;
  } catch {
    return null;
  }
}

export function CartaoImagem({ tipo, conjunto, modo }: Props) {
  const [estado, definirEstado] = useState<Estado>({ fase: "inicial" });
  const [formato, definirFormato] = useState<FormatoPlacar>("retrato");
  const [aviso, definirAviso] = useState<string | null>(null);
  const geracao = useRef(0);
  const titulo = TITULOS_IMAGEM[tipo];
  const entrada = conjunto[tipo];
  const dados = entrada.dados;

  const gerar = useCallback(
    async (formatoPlacar: FormatoPlacar) => {
      const minha = ++geracao.current;
      definirAviso(null);
      definirEstado({ fase: "a-gerar" });
      try {
        const gerada = await gerarImagem(tipo, conjunto, formatoPlacar);
        const pre = await paraDataUrl(gerada.blob);
        if (minha === geracao.current) definirEstado({ fase: "pronta", gerada, pre });
      } catch (erro) {
        console.error("[imagens] falha ao gerar", tipo, erro);
        if (minha === geracao.current) definirEstado({ fase: "erro", mensagem: mensagemParaUtilizador(erro) });
      }
    },
    [tipo, conjunto],
  );

  // Se os dados mudarem (ex.: outra versão do jogo), a imagem antiga deixa de valer.
  useEffect(() => {
    geracao.current += 1;
    if (!dados) {
      definirEstado({ fase: "inicial" });
      return;
    }
    if (modo === "publico") void gerar("retrato");
    else definirEstado({ fase: "inicial" });
  }, [dados, modo, gerar]);

  function aoMudarFormato(novo: FormatoPlacar) {
    definirFormato(novo);
    if (estado.fase === "pronta" || estado.fase === "erro") void gerar(novo);
  }

  async function aoPartilhar(gerada: Gerada) {
    const ficheiro = podePartilhar(gerada);
    if (!ficheiro) {
      descarregar(gerada);
      definirAviso("Este navegador não partilha ficheiros: a imagem foi descarregada.");
      return;
    }
    try {
      await navigator.share({ files: [ficheiro], title: titulo });
    } catch (erro) {
      // Cancelar a partilha não é um erro.
      if (!(erro instanceof DOMException && erro.name === "AbortError")) definirAviso("Não foi possível partilhar.");
    }
  }

  const idTitulo = `imagem-${tipo}`;
  const partilhavel = modo === "painel" && estado.fase === "pronta" && podePartilhar(estado.gerada) !== null;

  return (
    <section className={`cartao-imagem${dados ? "" : " cartao-imagem--indisponivel"}`} aria-labelledby={idTitulo}>
      <div className="cartao-imagem__cabecalho">
        <h3 className="antetitulo" id={idTitulo}>
          {titulo}
        </h3>
        {!dados && <p className="jogo__apoio">{entrada.motivo}</p>}
      </div>

      {dados && tipo === "placar-final" && (
        <fieldset className="cartao-imagem__formato">
          <legend className="so-leitores">Formato do placar</legend>
          <label>
            <input
              type="radio"
              name={`${idTitulo}-formato`}
              checked={formato === "retrato"}
              onChange={() => aoMudarFormato("retrato")}
            />
            <span>Vertical 1080×1350</span>
          </label>
          <label>
            <input
              type="radio"
              name={`${idTitulo}-formato`}
              checked={formato === "quadrado"}
              onChange={() => aoMudarFormato("quadrado")}
            />
            <span>Quadrado 1080×1080</span>
          </label>
        </fieldset>
      )}

      {dados && estado.fase === "inicial" && modo === "painel" && (
        <button type="button" className="botao botao--secundario" onClick={() => void gerar(formato)}>
          Gerar imagem
        </button>
      )}
      {dados && estado.fase === "a-gerar" && (
        <p className="jogo__apoio" role="status">
          A gerar a imagem…
        </p>
      )}
      {dados && estado.fase === "erro" && (
        <div className="aviso-erro" role="alert">
          <p className="aviso-erro__titulo">{estado.mensagem ?? MENSAGEM_GENERICA}</p>
          {estado.mensagem === null && <p className="jogo__apoio">Tente de novo; se persistir, avise o administrador.</p>}
          <button type="button" className="ligacao ligacao--botao" onClick={() => void gerar(formato)}>
            Tentar de novo
          </button>
        </div>
      )}
      {dados && estado.fase === "pronta" && (
        <>
          <img
            className="cartao-imagem__previa"
            src={estado.pre}
            alt={`${titulo}: pré-visualização`}
            width={1080}
            height={formato === "quadrado" && tipo === "placar-final" ? 1080 : 1350}
          />
          <div className="cartao-imagem__accoes">
            <button type="button" className="botao" onClick={() => descarregar(estado.gerada)}>
              Descarregar
            </button>
            {partilhavel && (
              <button type="button" className="botao botao--secundario" onClick={() => void aoPartilhar(estado.gerada)}>
                Partilhar
              </button>
            )}
            {modo === "painel" && (
              <button type="button" className="ligacao ligacao--botao" onClick={() => void gerar(formato)}>
                Gerar de novo
              </button>
            )}
          </div>
          {aviso && (
            <p className="jogo__apoio" role="status">
              {aviso}
            </p>
          )}
        </>
      )}
    </section>
  );
}
