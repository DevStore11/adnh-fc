const TIPOS_ACEITES = ["image/png", "image/jpeg", "image/webp"];
const TAMANHO_MAXIMO_ORIGINAL = 10 * 1024 * 1024;

export class ErroImagem extends Error {}

function paraBlob(tela: HTMLCanvasElement, qualidade: number): Promise<Blob | null> {
  return new Promise((resolver) => tela.toBlob(resolver, "image/webp", qualidade));
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
// Devolve o WebP em base64 (sem prefixo "data:"), como o servidor o guarda.
export async function comprimirParaWebp(ficheiro: File, ladoMax: number, bytesMax: number): Promise<string> {
  if (!TIPOS_ACEITES.includes(ficheiro.type)) throw new ErroImagem("Use uma imagem PNG, JPG ou WebP.");
  if (ficheiro.size > TAMANHO_MAXIMO_ORIGINAL) throw new ErroImagem("A imagem é demasiado grande (máximo 10 MB).");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(ficheiro);
  } catch {
    throw new ErroImagem("Não foi possível abrir a imagem.");
  }

  try {
    let escala = Math.min(1, ladoMax / Math.max(bitmap.width, bitmap.height));
    // Primeiro baixa-se a qualidade; se mesmo assim não couber, reduz-se também a dimensão.
    for (let reducao = 0; reducao < 4; reducao++) {
      const tela = document.createElement("canvas");
      tela.width = Math.max(1, Math.round(bitmap.width * escala));
      tela.height = Math.max(1, Math.round(bitmap.height * escala));
      const contexto = tela.getContext("2d");
      if (!contexto) throw new ErroImagem("O navegador não consegue processar a imagem.");
      contexto.drawImage(bitmap, 0, 0, tela.width, tela.height);

      for (const qualidade of [0.9, 0.8, 0.7, 0.6, 0.5, 0.4]) {
        const blob = await paraBlob(tela, qualidade);
        if (!blob || blob.type !== "image/webp") {
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
