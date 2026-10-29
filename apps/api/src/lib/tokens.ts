function paraBase64Url(bytes: Uint8Array): string {
  let texto = "";
  for (const byte of bytes) texto += String.fromCharCode(byte);
  return btoa(texto).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Token aleatório de 32 bytes que vai para o cookie. Na base de dados fica só o hash.
export function gerarToken(): string {
  return paraBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function hashSha256(texto: string): Promise<string> {
  const resumo = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(resumo)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
