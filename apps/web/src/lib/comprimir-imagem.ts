import { LIMITE_ORIGINAL_IMAGEM_BYTES, TIPO_IMAGEM_PERMITIDO } from "@adnh-fc/shared";

const QUALIDADE_INICIAL = 0.8;
const QUALIDADES_SEGUINTES = [0.7, 0.6, 0.5, 0.4];

export class ErroImagem extends Error {}

function paraBlob(tela: HTMLCanvasElement, qualidade: number): Promise<Blob | null> {
  return new Promise((resolver) => tela.toBlob(resolver, TIPO_IMAGEM_PERMITIDO, qualidade));
}

function paraBase64(blob: Blob): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader();
    leitor.onload = () => resolver(String(leitor.result).split(",")[1] ?? "");
    leitor.onerror = () => rejeitar(new ErroImagem("Não foi possível ler a imagem."));
    leitor.readAsDataURL(blob);
  });
}

// Reduz a imagem para caber em `ladoMax` px e converte-a para WebP com no máximo `bytesMax`.
// Começa em `ladoMax` e qualidade 0.8; só se exceder `bytesMax` baixa a qualidade e depois a dimensão.
// Devolve o WebP em base64 (sem prefixo "data:"), como o servidor o guarda.
// O canvas não é pintado de fundo, por isso a transparência (escudos) é preservada.
export async function comprimirParaWebp(ficheiro: File, ladoMax: number, bytesMax: number): Promise<string> {
  if (!ficheiro.type.startsWith("image/")) throw new ErroImagem("O ficheiro escolhido não é uma imagem.");
  if (ficheiro.size > LIMITE_ORIGINAL_IMAGEM_BYTES) {
    throw new ErroImagem(`A imagem é demasiado grande (máximo ${LIMITE_ORIGINAL_IMAGEM_BYTES / 1024 / 1024} MB).`);
  }

  let bitmap: ImageBitmap;
  try {
    // "from-image" respeita a rotação guardada nas fotos de telemóvel.
    bitmap = await createImageBitmap(ficheiro, { imageOrientation: "from-image" });
  } catch {
    throw new ErroImagem("Não foi possível abrir a imagem. Tente uma foto JPG ou PNG.");
  }

  try {
    // Nunca se amplia: imagens mais pequenas que `ladoMax` mantêm o tamanho.
    let escala = Math.min(1, ladoMax / Math.max(bitmap.width, bitmap.height));
    // Primeiro baixa-se a qualidade; se mesmo assim não couber, reduz-se também a dimensão.
    for (let reducao = 0; reducao < 4; reducao++) {
      const tela = document.createElement("canvas");
      tela.width = Math.max(1, Math.round(bitmap.width * escala));
      tela.height = Math.max(1, Math.round(bitmap.height * escala));
      const contexto = tela.getContext("2d");
      if (!contexto) throw new ErroImagem("O navegador não consegue processar a imagem.");
      contexto.drawImage(bitmap, 0, 0, tela.width, tela.height);

      for (const qualidade of [QUALIDADE_INICIAL, ...QUALIDADES_SEGUINTES]) {
        const blob = await paraBlob(tela, qualidade);
        if (!blob || blob.type !== TIPO_IMAGEM_PERMITIDO) {
          throw new ErroImagem("Este navegador não consegue gerar imagens WebP.");
        }
        if (blob.size <= bytesMax) return paraBase64(blob);
      }
      escala *= 0.8;
    }
  } finally {
    bitmap.close();
  }
  throw new ErroImagem("Não foi possível reduzir a imagem o suficiente. Tente outra mais simples.");
}
