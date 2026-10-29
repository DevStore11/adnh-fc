// TODO: guardar fotos WebP no D1 (painel do gestor)

export const CABECALHOS_IMAGEM = {
  "Content-Type": "image/webp",
  "Cache-Control": "public, max-age=3600",
} as const;

export function descodificarWebp(base64: string): Uint8Array<ArrayBuffer> {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

// Confirma pelos primeiros bytes (RIFF....WEBP) que o conteúdo é mesmo WebP e que cabe no limite.
export function ehWebpValido(base64: string, limiteBytes: number): boolean {
  let bytes: Uint8Array;
  try {
    bytes = descodificarWebp(base64);
  } catch {
    return false;
  }
  if (bytes.length < 12 || bytes.length > limiteBytes) return false;
  const texto = (inicio: number) => String.fromCharCode(...bytes.slice(inicio, inicio + 4));
  return texto(0) === "RIFF" && texto(8) === "WEBP";
}
