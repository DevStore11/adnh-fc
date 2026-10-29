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
