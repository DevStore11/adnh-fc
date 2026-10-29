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
- `pnpm db:seed:local` — carrega dados de exemplo na D1 local (nunca no remoto)
- `pnpm db:migrar:remoto` — aplica migrações na D1 remota
- `pnpm deploy` — build do web + deploy do Worker

## Segredos

Os segredos nunca vão para o git. Usa `.dev.vars` (ignorado) com base em `.dev.vars.example` e `wrangler secret` em produção.
