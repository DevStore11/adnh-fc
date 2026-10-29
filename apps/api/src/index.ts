import { Hono } from "hono";
import type { Bindings } from "./db/schema";
import { naoEncontrado, tratarErro } from "./middleware/erros";
import { seguranca } from "./middleware/seguranca";
import { publico } from "./routes/publico";
import { auth } from "./routes/auth";
import { painel } from "./routes/painel";
import { admin } from "./routes/admin";

const app = new Hono<{ Bindings: Bindings }>();

app.use("/api/*", seguranca);
app.onError(tratarErro);
app.notFound(naoEncontrado);

app.get("/api/saude", (c) => c.json({ ok: true }));

app.route("/api/publico", publico);
app.route("/api/auth", auth);
app.route("/api/painel", painel);
app.route("/api/admin", admin);

export default app;
