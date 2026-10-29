// Formato guardado: "pbkdf2$100000$<salt base64>$<hash base64>" (PBKDF2-SHA256, 32 bytes).
// O script scripts/admin-criar.mjs gera o mesmo formato.

const ITERACOES = 100_000; // máximo suportado pelo Web Crypto dos Workers
const TAMANHO_SALT = 16;
const TAMANHO_HASH = 32;

// Sem caracteres ambíguos (0/O, 1/I/l); 32 símbolos, por isso "& 31" não introduz enviesamento.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function paraBase64(bytes: Uint8Array): string {
  let texto = "";
  for (const byte of bytes) texto += String.fromCharCode(byte);
  return btoa(texto);
}

function deBase64(texto: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binario = atob(texto);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

async function derivar(senha: string, salt: Uint8Array<ArrayBuffer>, iteracoes: number): Promise<Uint8Array> {
  const chave = await crypto.subtle.importKey("raw", new TextEncoder().encode(senha), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: iteracoes },
    chave,
    TAMANHO_HASH * 8,
  );
  return new Uint8Array(bits);
}

// Compara sem terminar cedo, para o tempo não revelar a posição da primeira diferença.
function iguaisEmTempoConstante(a: Uint8Array, b: Uint8Array): boolean {
  let diferenca = a.length ^ b.length;
  const tamanho = Math.max(a.length, b.length);
  for (let i = 0; i < tamanho; i++) diferenca |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diferenca === 0;
}

export async function gerarHashSenha(senha: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(TAMANHO_SALT));
  const hash = await derivar(senha, salt, ITERACOES);
  return `pbkdf2$${ITERACOES}$${paraBase64(salt)}$${paraBase64(hash)}`;
}

export async function verificarSenha(senha: string, guardado: string): Promise<boolean> {
  const partes = guardado.split("$");
  if (partes.length !== 4 || partes[0] !== "pbkdf2") return false;
  const iteracoes = Number(partes[1]);
  const salt = deBase64(partes[2]);
  const esperado = deBase64(partes[3]);
  if (!Number.isInteger(iteracoes) || iteracoes < 1 || iteracoes > ITERACOES || !salt || !esperado) return false;
  const calculado = await derivar(senha, salt, iteracoes);
  return iguaisEmTempoConstante(calculado, esperado);
}

export function gerarSenhaTemporaria(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let senha = "";
  for (const byte of bytes) senha += ALFABETO[byte & 31];
  return `${senha.slice(0, 4)}-${senha.slice(4, 8)}-${senha.slice(8, 12)}-${senha.slice(12)}`;
}
