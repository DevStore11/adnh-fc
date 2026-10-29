// Exporta a base de dados remota para backups/adnh-fc-AAAA-MM-DD.sql. Uso: pnpm db:backup
// Precisa de "wrangler login" feito. Não altera nada na base de dados.

import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PASTA_API = join(RAIZ, "apps", "api");
const PASTA_BACKUPS = join(RAIZ, "backups");

const agora = new Date();
const dia = [
  agora.getFullYear(),
  String(agora.getMonth() + 1).padStart(2, "0"),
  String(agora.getDate()).padStart(2, "0"),
].join("-");
const ficheiro = join(PASTA_BACKUPS, `adnh-fc-${dia}.sql`);

mkdirSync(PASTA_BACKUPS, { recursive: true });
console.log(`A exportar a base de dados remota para ${ficheiro} ...`);

const resultado = spawnSync(
  "pnpm",
  ["exec", "wrangler", "d1", "export", "adnh-fc-db", "--remote", `--output="${ficheiro}"`],
  { cwd: PASTA_API, stdio: "inherit", shell: true },
);

if (resultado.status !== 0) {
  console.error("Não foi possível exportar. Confirme que fez 'wrangler login' e que a base de dados existe.");
  process.exit(1);
}
console.log("Backup concluído. Guarde o ficheiro fora deste computador (contém dados reais).");
