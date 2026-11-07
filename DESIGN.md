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

## 3. Parâmetros de gosto (propostas)
- Variância 4/10 · Movimento 3/10 · Densidade 6/10 · Estilo base: Editorial desportivo (o do clube.pen)

## 4. Estrutura (ecrãs deste âmbito)
1. Círculo de jogador (usado em todos os ecrãs abaixo)
2. Editor do onze (G4b): campo com lugares, telemóvel e computador
3. Lista de escolha num lugar vazio, e num lugar ocupado
4. Estados do editor
5. Imagem de partilha do onze, 1080x1350
6. Página pública do jogo (04 Detalhe do jogo) com o onze em fotos

## 5. Animações
Nenhuma 3D nem Lottie. Única transição: lista de escolha, 200 ms, desligada com movimento reduzido.

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
- [ ] Nada por arrastar: o único gesto é tocar

## 8. Decisões registadas
- 2026-11-07 — Escolher o onze por toque, sem arrastar — Emerson
- 2026-11-07 — Lista por posição, com "Outras posições" por baixo, sem esconder ninguém — proposta aceite por Emerson
- 2026-11-07 — Só 1080x1350 (sem stories) e sem selo de capitão — proposta aceite por Emerson
- 2026-11-07 — Foto redonda com número em disco escuro e nome em pílula, como a referência — Emerson
- 2026-11-07, aceite por Emerson — Área de toque de cada lugar: coluna inteira, mínimo 56x80 px; linhas da lista com 48 px
- 2026-11-07, aceite por Emerson — No campo do telemóvel, só o apelido na pílula, 12 px, máximo 60 px, com "…"
- 2026-11-07, aceite por Emerson — H5 mantém o cabeçalho em cima e o campo a toda a largura, validado em 3-5-2
- 2026-11-07, aceite por Emerson — Extremos de 4-3-3 contam como AVA (1 GR, 4 DEF, 3 MED, 3 AVA)
- 2026-11-07, aceite por Emerson — O realce de selecção nunca é neon sobre fundo claro