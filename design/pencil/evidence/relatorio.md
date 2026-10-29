# Relatório da Fase 1 — Protótipo no Pencil · A.D. Novo Horizonte

Ficheiro: `design/pencil/clube.pen`. Provas: PNG (escala 1) nesta pasta. `DESIGN.md` não foi alterado.

## 1. O que foi desenhado

Organização no canvas: **Sistema · Pública · Gestão · Partilha**. Desktop 1440 px (x=0), telemóvel 390 px (x=1560), estados à direita.

| Grupo | Frames | Prova |
|---|---|---|
| Sistema | 00 Sistema visual (cores, tipos, réguas, botões e estados hover/focus/disabled, cromo, linha de jogo, tabela, campo, loading/vazio/erro, microinteracções) | `00-sistema-visual.png` |
| Pública | 01 Home · 02 Plantel · 03 Jogos · 04 Detalhe do jogo · 05 Estatísticas (desktop e telemóvel) + estados de 02 e 03 | `01-…` a `05-…`, `02-plantel-estados-*`, `03-jogos-estados-*` |
| Gestão | 06 Entrar · 07 Jogadores (+ estados) · 08 Jogos · 09a Convocatória · 09b Escalação · 09c Golos · 09d Fecho · 10 Clube (desktop e telemóvel) | `06-…` a `10-…` |
| Partilha | 11 Onze inicial · 12 Homem do jogo · 13 Placar final, em 1080×1080 e 1080×1920 (stories, margem segura 250 px) | `11-…`, `12-…`, `13-…` |

Variáveis de design com os valores exactos da secção 2. Dados fictícios pt-MZ (Maputo, Matola, nomes e campos moçambicanos).

## 2. Lista de verificação (secção 7)

Contrastes calculados (WCAG 2.x, luminância relativa):

| Par (texto/fundo) | Rácio | Mínimo |
|---|---|---|
| Texto #0B1F3A / papel #F4F1EA | 14,64:1 | 4,5 |
| Texto #0B1F3A / superfície #FFFFFF | 16,52:1 | 4,5 |
| Secundário #55627A / papel | 5,45:1 | 4,5 |
| Secundário #55627A / superfície | 6,15:1 | 4,5 |
| Verde campo #0A7A32 / papel | 4,84:1 | 4,5 |
| Verde campo #0A7A32 / superfície | 5,46:1 | 4,5 |
| Neon #39FF14 / marinho #0B1F3A | 12,18:1 | 3 |
| Papel #F4F1EA / marinho (botões, cromo) | 14,64:1 | 4,5 |
| Erro #C8102E / papel | 5,22:1 | 4,5 |

| Regra | Estado | Prova |
|---|---|---|
| Contraste ≥ 4,5:1 corpo e ≥ 3:1 texto grande | **Cumpre** (tabela acima) | `00-sistema-visual.png`, `01-home-desktop.png` |
| Neon só sobre marinho | **Cumpre** (verificado por varrimento dos nós: todo o fill #39FF14 está dentro de blocos marinho ou imagens de partilha) | `01-home-desktop.png`, `11-…` a `13-…` |
| No máximo um bloco marinho por página pública | **Cumpre** (1 manchete em 01; 02–05 sem bloco marinho extra) | `01-…` a `05-…` |
| Só 2 famílias de letra | **Cumpre** (Big Shoulders + Barlow) | `00-sistema-visual.png` |
| Números tabulares (tnum) | **Não verificável** — o Pencil não expõe `font-variant-numeric`. Fica como requisito da fase de código | — |
| Alvos de toque ≥ 44 px no telemóvel | **Cumpre** (botões e linhas ≥ 44 px, medidos nos nós) | `*-telemovel.png` |
| Home com manchete marcante | **Cumpre** | `01-home-desktop.png`, `01-home-telemovel.png` |
| Sem grelha de 3 cartões iguais / painel admin genérico | **Cumpre** (capa de jornal; gestão como "redacção", sem barra lateral) | `01-…`, `07-…`, `08-…` |
| Campo como diagrama táctico, sem relva | **Cumpre** | `04-detalhe-jogo-desktop.png`, `09b-escalacao-desktop.png` |
| Régua de 4 px + antetítulo em cada secção | **Cumpre** | `02-plantel-desktop.png`, `05-estatisticas-desktop.png` |
| Estados loading/vazio/erro em Plantel, Jogos e Jogadores | **Cumpre** | `02-plantel-estados-*`, `03-jogos-estados-*`, `07-jogadores-estados-*` |
| Convocatória 11–22; golo com marcador obrigatório e assistente opcional | **Cumpre** | `09a-convocatoria-*`, `09c-golos-*` |
| Partilha nos dois formatos, margem segura, legível em miniatura | **Cumpre** (conteúdo das stories entre y 250 e 1670) | `11-…`, `12-…`, `13-…` (ambos formatos) |
| Escudo com fundo transparente | **Cumpre** (`design/branding/escudo.png`, RGBA, canal alfa verificado numericamente; sem xadrez em nenhum export) | todos |
| pt-MZ e dados fictícios realistas | **Cumpre** | todos |

## 3. Decisões fora do DESIGN.md (propostas para a secção 8, não escritas)

1. Nome da fonte no Pencil: **"Big Shoulders"** (o nome "Big Shoulders Display" é inválido no Pencil); no código usa-se Big Shoulders Display.
2. Ligação neon sublinhada sobre marinho no lugar de botão, para respeitar "um só bloco marinho".
3. Número do cromo em contorno simulado (4 cópias marinho deslocadas ± 1,2 px + 1 cópia papel), porque o Pencil não suporta traço em texto. No código usar `-webkit-text-stroke: 1.5px`.
4. Painel de login em marinho no ecrã 06.
5. Interruptor quadrado (raio 2 px) com anel neon no disco marinho, no ecrã 10.
6. Foto de jogador como placeholder papel-escuro opaco (#E4E1DA) até haver fotos reais.

## 4. Limites

- Sem componentes reutilizáveis do Pencil: os componentes do frame 00 foram repetidos por cópia, não por instância.
- Números tabulares não verificáveis (ver acima).
- Duotone da foto do ecrã 12 simulado com camadas.
- Hover, focus e disabled são estáticos no frame 00; arrastar no campo e contador da convocatória estão em anotação (frames 00, 09a e 09b).
- Defeitos corrigidos no fecho: sobreposição do botão do estado "Vazio" em Plantel/Jogos/Jogadores; quebra de "NHANTUMBO", laterais em cima da linha da área e título sobre o campo no 11.

## 5. Para a fase de código

- Frames: `00 Sistema visual`; `01 Home`, `02 Plantel`, `03 Jogos`, `04 Detalhe do jogo`, `05 Estatísticas`; `06 Entrar`, `07 Jogadores`, `08 Jogos`, `09a…09d`, `10 Clube`; `11 Onze inicial`, `12 Homem do jogo`, `13 Placar final` (cada um "— desktop" / "— telemóvel", ou 1080×1080 / 1080×1920).
- Tokens: papel, superficie, texto, texto-secundario, regua, verde-campo, neon, erro, aviso (variáveis do .pen); espaçamento 4/8/12/16/24/32/48/72; raio 2 px; sem sombras.
- Animações reservadas: nenhuma (tabela da secção 5 vazia). Microinteracções só anotadas: hover do botão (barra neon 3 px), arrastar no campo, contador da convocatória. `prefers-reduced-motion` obrigatório.

## 6. Aprovação

Aprovas a Fase 1? Se sim, indica quais das decisões da secção 3 devo propor para a secção 8 do `DESIGN.md`, e se avançamos para a fase de código. Nada foi alterado fora de `design/`.
