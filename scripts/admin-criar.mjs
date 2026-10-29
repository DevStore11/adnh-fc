// Cria o primeiro administrador. Uso: pnpm admin:criar [--remoto]
// Local por omissão. A senha temporária aparece uma única vez, neste terminal.
// O hash tem o mesmo formato de apps/api/src/lib/senha.ts: pbkdf2$100000$<salt base64>$<hash base64>.

import { spawnSync } from "node:child_process";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const ITERACOES = 100_000;
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const BASE_DE_DADOS = "adnh-fc-db";
const RAIZ = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PASTA_API = join(RAIZ, "apps", "api");
const REMOTO = process.argv.includes("--remoto");
const MODO = REMOTO ? "--remote" : "--local";

function gerarSenhaTemporaria() {
  const bytes = randomBytes(16);
  let senha = "";
  for (const byte of bytes) senha += ALFABETO[byte & 31];
  return `${senha.slice(0, 4)}-${senha.slice(4, 8)}-${senha.slice(8, 12)}-${senha.slice(12)}`;
}

function gerarHash(senha) {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(senha, salt, ITERACOES, 32, "sha256");
  return `pbkdf2$${ITERACOES}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

// Executa um ficheiro SQL no D1 e devolve o JSON do wrangler. O SQL vai por ficheiro para não passar pela linha de comandos.
function executarSql(sql) {
  const pasta = mkdtempSync(join(tmpdir(), "adnh-admin-"));
  const ficheiro = join(pasta, "consulta.sql");
  writeFileSync(ficheiro, sql, "utf8");
  try {
    const resultado = spawnSync(
      "pnpm",
      ["exec", "wrangler", "d1", "execute", BASE_DE_DADOS, MODO, "--json", `--file="${ficheiro}"`],
      { cwd: PASTA_API, encoding: "utf8", shell: true },
    );
    return resultado;
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
}

function lerJson(saida) {
  const inicio = saida.indexOf("[");
  if (inicio === -1) return null;
  try {
    return JSON.parse(saida.slice(inicio));
  } catch {
    return null;
  }
}

function sair(mensagem) {
  console.error(mensagem);
  process.exit(1);
}

const leitor = createInterface({ input: process.stdin, output: process.stdout });
const email = (await leitor.question("Email do administrador: ")).trim().toLowerCase();
leitor.close();

// Só caracteres seguros: o email entra no SQL e nunca pode conter aspas.
if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email) || email.length > 254) {
  sair("Email inválido.");
}

console.log(`A verificar a base de dados (${REMOTO ? "remota" : "local"})...`);
const contagem = executarSql("SELECT COUNT(*) AS total FROM users WHERE role = 'admin';");
const dados = contagem.status === 0 ? lerJson(contagem.stdout) : null;
if (!dados) {
  sair(
    "Não foi possível consultar a tabela de utilizadores. Aplique primeiro as migrações " +
      `(${REMOTO ? "pnpm db:migrar:remoto" : "pnpm db:migrar:local"}) e tente de novo.`,
  );
}
if ((dados[0]?.results?.[0]?.total ?? 0) > 0) {
  sair("Já existe um administrador. Este comando só funciona enquanto não existir nenhum.");
}

const senha = gerarSenhaTemporaria();
const hash = gerarHash(senha);

// O NOT EXISTS repete a verificação na própria instrução, caso alguém crie o admin entretanto.
const insercao = executarSql(
  `INSERT INTO users (nome, email, senha_hash, role, activo, deve_trocar_senha)
   SELECT 'Administrador', '${email}', '${hash}', 'admin', 1, 1
   WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin');`,
);
const resultado = insercao.status === 0 ? lerJson(insercao.stdout) : null;
if (!resultado) sair("Não foi possível criar o administrador.");
if ((resultado[0]?.meta?.changes ?? 0) === 0) {
  sair("Já existe um administrador. Nada foi criado.");
}

console.log("");
console.log("Administrador criado.");
console.log(`  Email:  ${email}`);
console.log(`  Senha temporária:  ${senha}`);
console.log("");
console.log("Guarde a senha agora: não volta a ser mostrada. No primeiro acesso será pedida uma senha nova.");
