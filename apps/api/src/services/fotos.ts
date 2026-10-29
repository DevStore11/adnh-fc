// TODO: guardar fotos WebP no D1 (painel do gestor)

import { TIPO_IMAGEM_PERMITIDO } from "@adnh-fc/shared";

export const CABECALHOS_IMAGEM = {
  "Content-Type": TIPO_IMAGEM_PERMITIDO,
  "Cache-Control": "public, max-age=3600",
} as const;

// Limite em texto para as mensagens de erro (ex.: "150 KB"), derivado das constantes partilhadas.
export function textoLimite(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`;
}

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
  if (bytes.length < 20 || bytes.length > limiteBytes) return false;
  const texto = (inicio: number) => String.fromCharCode(...bytes.slice(inicio, inicio + 4));
  // O tamanho declarado no cabeçalho RIFF (bytes 4–7, little-endian) tem de bater com o real,
  // e a primeira secção tem de ser uma das de WebP (VP8, VP8L ou VP8X).
  const declarado = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, true);
  return (
    texto(0) === "RIFF" &&
    texto(8) === "WEBP" &&
    declarado === bytes.length - 8 &&
    ["VP8 ", "VP8L", "VP8X"].includes(texto(12))
  );
}
