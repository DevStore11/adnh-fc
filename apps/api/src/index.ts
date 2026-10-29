import { Hono } from "hono";
import type { Ambiente } from "./db/schema";
import { protegerCsrf } from "./middleware/csrf";
import { naoEncontrado, tratarErro } from "./middleware/erros";
import { seguranca } from "./middleware/seguranca";
import { servirPagina } from "./routes/paginas";
import { publico } from "./routes/publico";
import { auth } from "./routes/auth";
import { painel } from "./routes/painel";
import { admin } from "./routes/admin";

const app = new Hono<Ambiente>();

app.use("/api/*", seguranca);
app.use("/api/*", protegerCsrf);
app.onError(tratarErro);
app.notFound(naoEncontrado);

app.get("/api/saude", (c) => c.json({ ok: true }));

app.route("/api/publico", publico);
app.route("/api/auth", auth);
app.route("/api/painel", painel);
app.route("/api/admin", admin);

// Páginas públicas servidas com meta-tags de partilha (ver wrangler.jsonc: run_worker_first)
for (const caminho of ["/", "/jogadores", "/jogadores/*", "/jogos", "/jogos/*", "/estatisticas"]) {
  app.get(caminho, servirPagina);
}

export default app;
