# Relatório da Fase 1B — Admin da plataforma e Gestor do clube

Ficheiro: `design/pencil/clube.pen`. Provas: PNG (escala 1) nesta pasta, com o nome do frame em minúsculas e sem acentos (por exemplo `a3-registar-gestor-convite-desktop.png`).
O `DESIGN.md` foi actualizado com as alterações aprovadas (secções 1, 2, 4 e 8). Nada foi escrito fora de `design/` e do `DESIGN.md`.

## 1. O que foi desenhado

Grupos no canvas: **Sistema · Entrada · Admin · Gestor · Pública · Partilha**. Desktop 1440 px (x=0), telemóvel 390 px (x=1560), estados e modais à direita da mesma linha.

| Grupo | Frames |
|---|---|
| Sistema | `00b Sistema — perfis`: carimbos (4), modal de confirmação destrutiva, indicador de etapas, linha de auditoria |
| Entrada | E1 Entrar: normal, erro ("Email ou senha incorrectos") e conta suspensa. Reaproveita o antigo 06 |
| Admin | A1 Visão geral · A2 Gestores (+ estados) · A3 Registar gestor (+ convite criado) · A4 Detalhe do gestor (+ modal suspender) · A5 Clubes (+ detalhe e modal suspender clube) · A6 Actividade · A7 Conta do admin |
| Gestor | G0a Aceitar convite · G0b Criar o clube · G0c Página pública · G0 Convite expirado · G1 Painel (+ estados) · G2 Jogadores (+ estados, + modal apagar) · G3 Jogos (+ estados) · G4a Convocatória (+ fora do limite) · G4b Escalação · G4c Golos · G4d Fecho · G5 Estatísticas · G6 Clube · G7 Conta · G8 Clube suspenso |

Todos em desktop e telemóvel. Total: 71 frames com prova. Dados fictícios pt-MZ (Maputo, Matola, Beira, Nampula; telefones +258 84/85/86/87).

Reaproveitados da Fase 1 (renomeados, cabeçalho substituído pelo do gestor, sem redesenhar o corpo): 07→G2, 08→G3, 09a–09d→G4a–G4d, 10→G6. Alterações no corpo: G2 ganhou o interruptor "Jogador activo"; G4a ganhou a variante "fora do limite". A Home pública (01) tem o onze inicial e o homem do jogo, em vez da "figura da jornada".

## 2. Lista de verificação

Contrastes calculados (WCAG 2.x). Os da Fase 1 mantêm-se; os novos:

| Par (texto/fundo) | Rácio | Mínimo |
|---|---|---|
| Papel #F4F1EA / vermelho #C8102E (botão de confirmação) | 5,22:1 | 4,5 |
| Vermelho #C8102E / branco (título do modal, erros) | 5,88:1 | 4,5 |
| Neon #39FF14 / marinho (faixa do admin, manchete G1) | 12,18:1 | 3 |
| Texto secundário #55627A / papel (carimbos pendente e expirado) | 5,45:1 | 4,5 |
| Verde campo #0A7A32 / papel (carimbo activo) | 4,84:1 | 4,5 |

| Regra (secção 7) | Estado | Prova |
|---|---|---|
| Contraste do texto | **Cumpre** (tabelas acima) | `00b-sistema-perfis.png`, `a1-visao-geral-desktop.png` |
| Neon só sobre marinho | **Cumpre, com 1 excepção herdada.** Varrimento de 78 nós neon: 76 dentro de marinho. Os 2 fora são o anel de selecção do campo (G4b), previsto no próprio `DESIGN.md` (secção 2, Campo) | `g4b-escalacao-desktop.png` |
| Um bloco marinho por página pública | **Cumpre** (Home continua com 1; as áreas novas não são públicas). No G1 a manchete é o único bloco marinho do corpo | `01-home-desktop.png`, `g1-painel-desktop.png` |
| Só 2 famílias de letra | **Cumpre** | `00b-sistema-perfis.png` |
| Números tabulares | **Não verificável** no Pencil. Requisito para o código | — |
| Alvos de toque ≥ 44 px no telemóvel | **Cumpre nos frames novos**: botões 45 px, campos 48 px, abas e filtros 46 px, "SAIR" 44 px, interruptor 44 px (com margem). Os corpos herdados de G4b–G4d e G6 não foram re-medidos | `a2-gestores-telemovel.png`, `g1-painel-telemovel.png` |
| Home com manchete marcante, sem layout genérico | **Cumpre** | `01-home-desktop.png` |
| Sem grelha de 3 cartões iguais e sem painel admin genérico | **Cumpre** (A1 abre com frase e tabelas de jornal; G5 mostra os números numa linha, sem cartões) | `a1-visao-geral-desktop.png`, `g5-estatisticas-desktop.png` |
| Campo como diagrama táctico | **Cumpre** (inalterado) | `g4b-escalacao-desktop.png` |
| Régua de 4 px + antetítulo por secção | **Cumpre.** Em A6 o título do dia (Big Shoulders) faz de antetítulo | `a6-actividade-desktop.png` |
| Estados loading, vazio e erro | **Cumpre** em A2, G1, G2 e G3 | `a2-gestores-estados-desktop.png`, `g1-painel-estados-desktop.png`, `g2-jogadores-estados-desktop.png`, `g3-jogos-estados-desktop.png` |
| Convocatória 11–22; golo com marcador obrigatório e assistente opcional | **Cumpre** | `g4a-convocatoria-desktop.png`, `g4a-convocatoria-fora-do-limite-desktop.png`, `g4c-golos-desktop.png` |
| Imagens de partilha | **Cumpre** (inalteradas) | `11-…` a `13-…` |
| Escudo com fundo transparente | **Cumpre.** G0b mostra a pré-visualização sobre papel e sobre marinho, sem xadrez | `g0b-criar-o-clube-desktop.png` |
| pt-MZ e dados fictícios realistas | **Cumpre** | todos |

Itens da Fase 1B:

| Item | Estado | Prova |
|---|---|---|
| Admin sem escudo de clube; gestor com o escudo do seu clube | **Cumpre.** O cabeçalho do admin não tem escudo. A5 mostra o escudo pequeno do clube na tabela, como pedido. Os 36 usos de escudo em G* são do clube | `a1-visao-geral-desktop.png`, `g1-painel-desktop.png` |
| Sem grelha de cartões de números iguais no A1 | **Cumpre** | `a1-visao-geral-desktop.png` |
| Estados de conta em carimbo, coerentes em todas as tabelas | **Cumpre** (mesmo componente em A1, A2, A3, A4, G8) | `a2-gestores-desktop.png` |
| Todas as acções destrutivas com modal | **Cumpre** para as 3 existentes: suspender gestor, suspender clube, apagar jogador | `a4-modal-suspender-gestor-desktop.png`, `a5-modal-suspender-clube-desktop.png`, `g2-modal-apagar-jogador-desktop.png` |
| Convite com validade visível e convite expirado desenhado | **Cumpre** (48 h, expira a 30 Out 2026, 09:12) | `a3-registar-gestor-convite-criado-desktop.png`, `g0-convite-expirado-desktop.png` |
| Fluxo de primeiro acesso G0a → G0c → G1 | **Cumpre** (os frames existem pela ordem; sem protótipo clicável) | `g0a-…`, `g0b-…`, `g0c-…`, `g1-painel-desktop.png` |
| Estados vazio, loading e erro em A2, G1, G2 e G3 | **Cumpre** | ver acima |

## 3. Decisões fora do DESIGN.md (propostas para a secção 8, não escritas)

1. Cabeçalho do admin: faixa marinho com o antetítulo e o "SAIR" em neon (neon sobre marinho).
2. Sigla de duas letras num quadrado marinho como escudo provisório de clubes sem escudo carregado (A4, A5).
3. Etapas do jogo na manchete do G1: quadrado neon = feita, contorno papel = pendente.
4. Convite por link (validade 48 h) com "Copiar link" e "Enviar por WhatsApp".
5. "Forçar redefinição de senha" e "Reenviar convite" sem modal (não são destrutivas). Só suspender e apagar pedem confirmação.
6. Convite criado mostra o carimbo CONVITE PENDENTE no próprio ecrã.
7. Contacto fictício do administrador: +258 84 555 0100.

## 4. Limites

- Carimbo "convite expirado" tracejado: o Pencil não suporta traço tracejado, por isso foi simulado com pequenos rectângulos. No código usar `border: 1.5px dashed`. Rotação: -2° (no Pencil `rotation: 2`).
- Sem componentes reutilizáveis do Pencil: carimbo, modal, etapas e linha de auditoria estão em `00b` e foram repetidos por construção.
- O escudo da pré-visualização em G0b é o do Novo Horizonte, por ser o único ficheiro disponível. Não é o escudo do clube de exemplo (Clube Desportivo Muhala).
- G4b, G4c, G4d e G6 mantêm o corpo da Fase 1 com o cabeçalho novo. G6 ainda repete o slug e o interruptor que também existem em G0c.
- Números tabulares não verificáveis. Sem protótipo clicável (só frames).

## 5. Para a fase de código

- Frames: nomes de cada frame no `.pen`, com o código no início (por exemplo `A3 Registar gestor (convite criado) — telemóvel`).
- Tokens: papel, superficie, texto, texto-sec, regua, verde-campo, neon, erro, aviso; escala 4/8/12/16/24/32/48/72; raio 2; sem sombras.
- Componentes: carimbo (4), modal destrutiva, indicador de etapas, linha de auditoria, campo de formulário, interruptor quadrado, tabela de jornal.
- Animações reservadas: nenhuma. Microinteracções só anotadas (hover do botão, arrastar no campo, contador da convocatória).

## 6. Aprovação

Aprovas a Fase 1B? Indica quais das decisões da secção 3 devo propor para a secção 8 do `DESIGN.md`, e se quiseres que redesenhe G4b a G4d e G6 com a mesma linguagem das páginas novas.
