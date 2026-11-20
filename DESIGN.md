# DESIGN.md — ADNH-FC
> Fonte de verdade visual. Em caso de dúvida, este ficheiro manda. Os tokens vivem nas variáveis do design/pencil/clube.pen e em apps/web/src/styles/tema.css; este ficheiro não os duplica com valores diferentes.

## 1. Identidade
- Público: gestores do clube (não técnicos, quase sempre no telemóvel) e adeptos/jogadores (página pública)
- Emoção da marca: editorial desportivo, directa, orgulhosa [A CONFIRMAR]
- Referência nova: ecrã de formações de uma app de futebol (foto redonda, número em disco escuro, nome em pílula escura)
- Anti-referências: layouts genéricos de três cartões iguais; roxo em gradiente; ecrãs sobrecarregados
- Idioma: português
- Acção principal: gestor monta o onze tocando nos lugares do campo; adepto vê o onze do jogo

## 2. Sistema visual (tokens reais do clube.pen)
### Cores
- papel #F4F1EA (fundo da app) · superficie #FFFFFF · texto #0B1F3A (marinho) · texto-sec #55627A · regua #D9D4C7
- verde-campo #0A7A32 (acção e antetítulos) · neon #39FF14 (destaque, sobretudo sobre marinho) · erro #C8102E · aviso #F2C200
- Imagens de partilha e modais: fundo texto (#0B1F3A), texto creme, neon como acento
### Tipografia
- Títulos e números: Big Shoulders, pesos 800 e 900 · Corpo e nomes: Barlow, pesos 400 e 600
- Antetítulos em Barlow 600 com letterSpacing, cor verde-campo
### Espaçamento, raios, sombras
- Espaçamento: sp-4, 8, 12, 16, 24, 32, 48, 72
- Raio base: 2 px. Sem sombras. Réguas finas (regua) e grossas (texto, 4 px) como separadores
- Excepção deste âmbito: foto do jogador em círculo, e nome em pílula (raio total), só dentro do círculo de jogador
### Botões e cards
- Reutilizar os componentes existentes do clube.pen (convocatória, escalação, modal destrutivo)
- [NOVO] Selo de número (Home e Plantel): bloco marinho (texto), raio 2, sem sombra, colado ao canto inferior esquerdo da foto do jogador, sobreposto à foto; número em Big Shoulders 900 preenchido, a neon. Medidas confirmadas: 56x48 com número a 32 px (telemóvel), 72x60 com número a 44 px (desktop). Substitui o número gigante em contorno atrás da foto. O contraste do número não depende da foto, porque o fundo é o selo.
- [NOVO] Botão de contorno (o do "Contactar a direcção") reutilizado em "Adicionar ao calendário"

## 3. Parâmetros de gosto (propostas)
- Variância 4/10 · Movimento 3/10 · Densidade 6/10 · Estilo base: Editorial desportivo (o do clube.pen)

## 4. Estrutura (ecrãs deste âmbito)
1. Círculo de jogador (usado em todos os ecrãs abaixo)
2. Editor do onze (G4b): campo com lugares, telemóvel e computador
3. Lista de escolha num lugar vazio, e num lugar ocupado
4. Estados do editor
5. Imagem de partilha do onze, 1080x1350
6. Página pública do jogo (04 Detalhe do jogo) com o onze em fotos
7. [NOVO] Home (01): painel "Homem do jogo" com selo de número e estatísticas em número grande; bloco "Melhores marcadores" (top 3); "Próximo jogo" com contagem e "Adicionar ao calendário"
8. [NOVO] Plantel (02): cartas com selo de número (e a mesma regra no perfil do jogador)

## 5. Animações
Nenhuma 3D nem Lottie. Única transição: lista de escolha, 200 ms, desligada com movimento reduzido. [NOVO] A contagem do próximo jogo não é animada.

## 6. Orçamento e dispositivos
- Prioridade: telemóvel (390 px, como os frames existentes), dados móveis
- Movimento reduzido obrigatório
- Fotos de exemplo no protótipo: silhuetas genéricas, nunca pessoas reais

## 7. Lista de verificação
- [ ] Usa só variáveis existentes do clube.pen (papel, texto, verde-campo, neon...); nenhuma cor nova sem aprovação
- [ ] Contraste >= 4.5:1 (corpo) e >= 3:1 (texto grande), incluindo texto sobre foto e sobre pílula
- [ ] Só Big Shoulders e Barlow
- [ ] Alvos de toque >= 44 px
- [ ] Área de toque do lugar no campo = coluna inteira (círculo, selo e pílula), mínimo 56x80 px, sem sobreposição a 360 px; linhas da lista com mínimo 48 px e toda a linha tocável
- [ ] Letra da pílula: 12 px, só apelido, largura máxima 60 px, corte com "…" (campo e página pública no telemóvel); 13 px, inicial e apelido (campo e página pública no computador); 20 px, máximo 170 px (imagem de partilha)
- [ ] O realce de selecção nunca é neon sobre fundo claro (neon só sobre marinho ou sobre o campo escurecido); sobre fundo claro usa verde-campo
- [ ] Linha de 5 jogadores sem sobreposição a 390 px, em 3-5-2 e 4-3-3
- [ ] Estados do círculo: com foto, sem foto, lugar vazio, nome longo
- [ ] Lista: os da posição primeiro, "Outras posições" por baixo, ninguém escondido
- [ ] Lugar ocupado oferece trocar e "Retirar do onze" (modal destrutivo existente)
- [ ] Tamanhos do círculo: campo telemóvel 52-56, campo computador 72-80, lista 44, partilha 104, página pública 64
- [ ] Imagem de partilha 1080x1350, sem texto cortado
- [ ] Escolher o jogador é por toque; arrastar só existe no modo "Mover jogadores" (posições personalizadas)
- [ ] [NOVO] Selo de número: o número lê-se completo com 1 e 2 dígitos (10, 11, 12, 14, 15, 17 no Plantel), nunca cortado nem coberto pela foto
- [ ] [NOVO] Número sempre em selo marinho com neon (nunca neon sobre fundo claro nem número directamente sobre foto)
- [ ] [NOVO] O selo não tapa a cara do jogador (fica no canto inferior esquerdo)
- [ ] [NOVO] Painel "Homem do jogo": golos e assistências em número grande, legíveis sem esforço a 390 px
- [ ] [NOVO] "Melhores marcadores": top 3 por golos, desempate por assistências; linhas >= 48 px, toda a linha tocável; estados: menos de 3, sem golos, apelido longo
- [ ] [NOVO] "Próximo jogo": estados da contagem (faltam N dias, amanhã, hoje às 15:30) e caso sem próximo jogo; botão "Adicionar ao calendário" com alvo >= 44 px
- [ ] [NOVO] Desktop: coluna direita da Home sem vazio grande por baixo do "Próximo jogo"

## 8. Decisões registadas
- 2026-11-07 — Escolher o onze por toque, sem arrastar — Emerson
- 2026-11-19 — Posições personalizadas: modo "Mover jogadores" com arrasto (rato e toque) e setas, "Repor formação"; escolher o jogador continua por toque — Emerson
- 2026-11-07 — Lista por posição, com "Outras posições" por baixo, sem esconder ninguém — proposta aceite por Emerson
- 2026-11-07 — Só 1080x1350 (sem stories) e sem selo de capitão — proposta aceite por Emerson
- 2026-11-07 — Foto redonda com número em disco escuro e nome em pílula, como a referência — Emerson
- 2026-11-07, aceite por Emerson — Área de toque de cada lugar: coluna inteira, mínimo 56x80 px; linhas da lista com 48 px
- 2026-11-07, aceite por Emerson — No campo do telemóvel, só o apelido na pílula, 12 px, máximo 60 px, com "…"
- 2026-11-07, aceite por Emerson — H5 mantém o cabeçalho em cima e o campo a toda a largura, validado em 3-5-2
- 2026-11-07, aceite por Emerson — Extremos de 4-3-3 contam como AVA (1 GR, 4 DEF, 3 MED, 3 AVA)
- 2026-11-07, aceite por Emerson — O realce de selecção nunca é neon sobre fundo claro
- [NOVO] 2026-11-19, aceite por Emerson — Home ganha "Melhores marcadores" (top 3) e, no "Próximo jogo", contagem e "Adicionar ao calendário"
- [NOVO] 2026-11-19, aceite por Emerson — Número do jogador em selo marinho com neon sobre a foto, no lugar do contorno gigante; mesma regra no Plantel e no perfil do jogador (ainda sem frame de perfil público no clube.pen); estatísticas do painel "Homem do jogo" em número grande; medidas do selo confirmadas: 56x48 com 32 px (telemóvel) e 72x60 com 44 px (desktop)
- [NOVO] 2026-11-19, aceite por Emerson — Com o selo, a foto do jogador ocupa a largura toda da carta (Home e Plantel), deixando de ser 3:4
- [NOVO] 2026-11-19, aceite por Emerson — "Melhores marcadores": linha com apelido em maiúsculas, golos e assistências em Big Shoulders 900 (32 px no telemóvel, 40 px no desktop), seta "›", altura 56 px (telemóvel) e 64 px (desktop); apelido longo quebra em 2 linhas no telemóvel; estado vazio "Ainda ninguém marcou esta época."
- [NOVO] 2026-11-19, aceite por Emerson — Contagem do "Próximo jogo" em selo marinho com texto neon ("FALTAM N DIAS", "AMANHÃ", "HOJE ÀS 15:30"); sem próximo jogo, contagem e botão escondem-se e aparece "Ainda não há jogo marcado."
- [NOVO] 2026-11-19 — Fora desta fase: classificação na liga (o modelo de dados não tem tabela classificativa) e faixa de resumo da época
