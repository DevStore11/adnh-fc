# ADNH-FC

Plataforma web da Associação Desportiva Novo Horizonte (ADNH-FC): site público (página principal, plantel, jogos, estatísticas) e duas áreas com login — **admin** (gestores, clube, registo de actividade) e **gestor** (jogadores, jogos, convocatória, escalação, resultado e imagens). Jogadores não têm login.

Corre inteiro na Cloudflare: um Worker (Hono) serve a API em `/api/*` e o front-end estático (React + Vite). Base de dados D1; fotos e escudo guardados no D1 como WebP comprimido no navegador. Sem R2.

## Estrutura

- `apps/api` — Worker Hono (API) e configuração do wrangler
- `apps/web` — front-end React + Vite
- `packages/shared` — tipos, schemas e constantes partilhados
- `migrations` — migrações D1

## Scripts

- `pnpm dev` — web e api em paralelo
- `pnpm build` — build do web
- `pnpm db:migrar:local` — aplica migrações na D1 local
- `pnpm db:seed:local` — carrega dados de exemplo na D1 local (nunca no remoto; não existe script que aplique o seed ao remoto)
- `pnpm admin:criar` — cria o primeiro administrador na D1 local; com `--remoto` cria-o na D1 remota. Mostra a senha temporária uma única vez e recusa se já existir um admin
- `pnpm db:migrar:remoto` — aplica migrações na D1 remota
- `pnpm db:backup` — exporta a base remota para `backups/adnh-fc-AAAA-MM-DD.sql` (pasta ignorada pelo git)
- `pnpm deploy` — build do web + deploy do Worker

## Segredos

Os segredos nunca vão para o git. Para desenvolvimento usa `apps/api/.dev.vars` (ignorado), copiado de `.dev.vars.example`.

Neste momento o código **não lê nenhum segredo** de variáveis de ambiente: as sessões usam tokens aleatórios guardados como hash SHA-256 e as senhas usam PBKDF2 com sal por utilizador. O Worker só usa dois bindings, ambos definidos em `apps/api/wrangler.jsonc`:

| Binding  | O que é                          | Onde se define              |
| -------- | -------------------------------- | --------------------------- |
| `DB`     | base de dados D1 `adnh-fc-db`    | `wrangler.jsonc` (`database_id`) |
| `ASSETS` | front-end estático (`web/dist`)  | `wrangler.jsonc`            |

Se um dia for preciso um segredo, acrescenta-o a `.dev.vars.example` sem valor, lista-o aqui e define-o em produção com:

```
pnpm --filter @adnh-fc/api exec wrangler secret put NOME_DO_SEGREDO
```

(o wrangler pede o valor no terminal; nunca o escrevas em ficheiros).

## Plano grátis, sem cartão

Usa só Workers (com assets estáticos) e D1. Não usa R2, KV, Queues, Durable Objects, Images, Stream nem Workers AI. Sem rotas nem domínios próprios: o site fica em `https://adnh-fc.<a-tua-conta>.workers.dev`. O registo de pedidos (`observability`) está desligado; para ver erros ao vivo usa `wrangler tail`.

## Publicar

Passos manuais, por ordem. Fazem-se na tua conta Cloudflare e nenhum é executado automaticamente.

1. **Entrar na Cloudflare**

   ```
   pnpm --filter @adnh-fc/api exec wrangler login
   ```

2. **Criar a base de dados D1**

   ```
   pnpm --filter @adnh-fc/api exec wrangler d1 create adnh-fc-db
   ```

   O comando mostra um `database_id`.

3. **Preencher o `database_id`** em `apps/api/wrangler.jsonc`, no lugar de `PREENCHER_AO_CRIAR`. Não alteres o `database_name`.

4. **Aplicar as migrações à base remota**

   ```
   pnpm db:migrar:remoto
   ```

   Nunca corras `seeds/dev.sql` no remoto: apaga dados e é só para desenvolvimento.

5. **Criar o primeiro administrador** (a senha temporária aparece uma única vez; no primeiro acesso é obrigatório trocá-la)

   ```
   pnpm admin:criar --remoto
   ```

6. **Fazer o deploy** (compila o front-end e publica o Worker)

   ```
   pnpm deploy
   ```

   No fim o wrangler mostra o endereço `workers.dev`. Entra em `/entrar` com o administrador, configura o clube (nome, cores, escudo) e cria os gestores.

### Backup e restauro

**Export (ficheiro SQL):**

```
pnpm db:backup
```

Cria `backups/adnh-fc-AAAA-MM-DD.sql`. O ficheiro tem dados reais: guarda-o fora do computador e nunca o commits (a pasta `backups/` está no `.gitignore`). Faz um export antes de cada migração em produção.

**Restaurar a partir de um export** — importa para uma base nova, para não misturar com dados existentes:

```
pnpm --filter @adnh-fc/api exec wrangler d1 create adnh-fc-restauro
pnpm --filter @adnh-fc/api exec wrangler d1 execute adnh-fc-restauro --remote --file=../../backups/adnh-fc-AAAA-MM-DD.sql
```

Depois aponta o `database_id` do `wrangler.jsonc` para a base restaurada e volta a fazer `pnpm deploy`.

**Time Travel (voltar atrás no tempo):** o D1 guarda o histórico da base e permite repô-la para um instante anterior (no plano grátis a janela é curta, de cerca de 7 dias; confirma na documentação da Cloudflare).

```
pnpm --filter @adnh-fc/api exec wrangler d1 time-travel info adnh-fc-db
pnpm --filter @adnh-fc/api exec wrangler d1 time-travel restore adnh-fc-db --timestamp=2026-11-01T10:00:00Z
```

O `restore` substitui o estado actual da base: confirma o instante com `info` e faz um export antes.

## Segurança em produção

- Cookie de sessão `__Host-sessao`: `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, sem `Domain`.
- Pedidos que alteram dados exigem `Origin` do próprio site e o cabeçalho `X-Requested-With`.
- Erros inesperados respondem só `{"erro":"Erro interno"}`; o registo do Worker guarda apenas o tipo e a mensagem do erro, nunca senhas, tokens, cookies nem corpos de pedidos.
- Cabeçalhos das páginas em `apps/web/public/_headers` (CSP restrita ao próprio domínio, mais `data:` e `blob:` para imagens; cache longa e `immutable` só em `/assets/*`; sem cache no `index.html`).
