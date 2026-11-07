# Relatório — Protótipo H0 a H6, ronda de ajustes A1 a A7 (Pencil)

Ficheiro: `design/pencil/clube.pen`. Nenhum frame fora dos H foi alterado. Cada PNG está em `design/pencil/evidence/<nome-do-frame>.png`. Todos os PNGs listados foram exportados de novo nesta ronda e abertos um a um.

## 1. O que mudou, por ajuste

**A1 — Área de toque do lugar**
- A área tocável de cada lugar é a coluna inteira: círculo, selo e pílula.
- Frame novo `h1-formacoes-360-toque`, com a área de cada lugar a tracejado verde-campo. Os traços só existem neste frame.
- Medido nesse frame: largura mínima da coluna 56 px, altura mínima 86 px.
- Folga mínima entre áreas na linha de 5 (campo de 328 px, ecrã de 360 px): 8,8 px. Na linha de 4 de 4-3-3: 25,5 px. Não há sobreposição.
- Com a pílula limitada a 60 px, o passo de 65,6 px não é atingido. A linha de 5 usa distribuição `space_around` e colunas de 56 a 59 px, o que dá 8,8 px de folga.
- Lista de escolha: todas as linhas dos frames H2, H3, H4 e H3-fundo têm 57 px de altura, e o bloco "Neste lugar agora" tem 51 px. A linha inteira é o alvo de toque. Não foi preciso corrigir nada.

**A2 — Pílula do nome**
- Componentes e instâncias actualizados:
  - Campo e página pública no telemóvel: só o apelido, letra de 12 px, pílula com máximo de 60 px e corte com "…".
  - Campo e página pública no computador: inicial e apelido, letra de 13 px.
- A lista de escolha continua com o nome completo.
- Caso extremo no `h4-escolher-estados-telemovel`: "Mahlangulene" fica "Mahlan…". Em `h1-formacoes-360`, "Zandamela" fica "Zanda…".
- O frame `h0-circulo-jogador` tem as notas actualizadas.

**A3 — H5 refeito**
- `h5-onze-inicial-1080x1350` (3-5-2) e `h5b-onze-inicial-4-3-3-1080x1350` (4-3-3), no layout da imagem 1080×1080 original, que não foi alterada.
- Cabeçalho em cima, formação com adversário e data por baixo, campo de 936×855 px a toda a largura.
- Círculo de 104 px, disco de 42 px, pílula com letra de 20 px e máximo de 170 px.
- Ambos têm um jogador sem foto e um nome longo cortado: "B. Cumbane J…" e "D. Mabunda Jú…".
- Retirei o rectângulo da pequena área do campo nos dois frames, porque a linha cortava o selo e a pílula do guarda-redes.
- Folgas mínimas entre pílulas vizinhas, calculadas a partir das larguras das pílulas medidas no Pencil e da regra `space_around` (a leitura directa das coordenadas das linhas deu valores errados, por isso o cálculo é manual):

| Linha | Folga mínima |
|---|---|
| 3-5-2 ATA (2) | ≈ 365 px |
| 3-5-2 MED (5) | ≈ 58 px |
| 3-5-2 DEF (3) | ≈ 195 px |
| 4-3-3 ATA (3) | ≈ 208 px |
| 4-3-3 MED (3) | ≈ 186 px |
| 4-3-3 DEF (4) | ≈ 108 px |

  Todas ficam acima dos 12 px pedidos. O PNG confirma que não há sobreposição.
- Os dois PNGs têm 1080×1350 (confirmado com `file`).

**A4 — Cor de realce (neon)**
Usos de neon nos frames H:
- Anel do lugar tocado em `h2-escolher-vazio-telemovel`, `h3-escolher-ocupado-telemovel`, `h3-escolher-ocupado-telemovel-fundo` e `h3-retirar-confirmar-telemovel`, sobre o campo escurecido (véu marinho a 65%).
- "ONZE INICIAL" e a formação em H5 e H5b, sobre fundo marinho.
- Os textos da manchete e o placar no h6 telemóvel e computador, sobre o bloco marinho. Nada mudou aqui; é do frame original 04.

Não há neon sobre fundo claro. Nos frames de computador o anel é verde-campo. Não foi preciso trocar nada.

**A5 — H3 no telemóvel**
Frame novo `h3-escolher-ocupado-telemovel-fundo`, com a folha deslocada até ao fim. Mostra "Já no onze" com 4 linhas e a acção "TROCAR".

**A6 — Verificação real**
Todos os 16 PNGs H foram abertos. A tabela está na secção 3.

**A7 — DESIGN.md**
- Secção 8: acrescentadas as 5 decisões (todas "2026-11-07, aceite por Emerson").
- Secção 7: acrescentados 3 itens (área de toque, letra da pílula, realce).
- Nada foi substituído.

Também mudei:
- `h6-jogo-onze-telemovel`: linhas do campo e área de penálti reposicionadas para não cortar a linha de defesas. A pequena área foi retirada, como no H5.
- `h1-formacoes-360` e `h1-formacoes-360-toque`: áreas do campo baixadas pelo mesmo motivo.

## 2. Contraste (fórmula WCAG, script `contraste.js` no scratchpad da sessão)

| Par | Razão | Mínimo | Resultado |
|---|---|---|---|
| Pílula: papel sobre texto | 14.64:1 | 4.5 | cumpre |
| Disco do número: papel sobre texto | 14.64:1 | 4.5 | cumpre |
| Avatar sem foto: papel sobre texto-sec | 5.45:1 | 3 | cumpre |
| Silhueta texto-sec sobre foto #E4E1DA | 4.71:1 | 3 | cumpre |
| Pílula do lugar vazio: texto-sec sobre superficie | 6.15:1 | 4.5 | cumpre |
| Lugar vazio: traço e "+" verde-campo sobre superficie | 5.46:1 | 3 | cumpre |
| "Retirar do onze": erro sobre superficie | 5.88:1 | 4.5 | cumpre |
| Botão "Ir à convocatória": branco sobre verde-campo | 5.46:1 | 4.5 | cumpre |
| Antetítulo verde-campo sobre superficie | 5.46:1 | 4.5 | cumpre |
| Antetítulo verde-campo sobre papel | 4.84:1 | 4.5 | cumpre |
| Detalhe texto-sec sobre superficie | 6.15:1 | 4.5 | cumpre |
| Detalhe texto-sec sobre papel | 5.45:1 | 4.5 | cumpre |
| "TROCAR" verde-campo sobre superficie | 5.46:1 | 4.5 | cumpre |
| Anel neon sobre véu a 65% sobre papel | 4.15:1 | 3 | cumpre |
| Anel neon sobre véu a 65% sobre campo claro | 3.86:1 | 3 | cumpre |
| Neon sobre texto (imagem de partilha) | 12.18:1 | 4.5 | cumpre |
| Pílula (papel) sobre fundo texto da imagem | 14.64:1 | 3 | cumpre |
| Anel verde-campo sobre papel (computador) | 4.84:1 | 3 | cumpre |
| Traço de toque verde-campo sobre superficie | 5.46:1 | 3 | cumpre |

## 3. Leitura dos PNGs (A6)

| PNG | Texto cortado | Sobreposição | Fora do ecrã |
|---|---|---|---|
| h0-circulo-jogador | não, só os cortes com "…" previstos | não | não |
| h1-escalacao-campo-telemovel | não | a linha de área do campo passa por trás das pílulas da defesa (herdado do G4b), sem esconder texto | não |
| h1-escalacao-campo-desktop | não | a mesma linha de área por trás das pílulas | não |
| h1-formacoes-360 | só "Zanda…" (previsto) | não | não |
| h1-formacoes-360-toque | só "Zanda…" (previsto) | não, folga de 8,8 px entre áreas | não |
| h2-escolher-vazio-telemovel | não | não | a lista sai do ecrã por baixo, por ser scroll |
| h2-escolher-vazio-desktop | não | não | não |
| h3-escolher-ocupado-telemovel | não | não | a lista sai do ecrã por baixo, por ser scroll |
| h3-escolher-ocupado-telemovel-fundo | não | não | não |
| h3-escolher-ocupado-desktop | não | não | não |
| h3-retirar-confirmar-telemovel | não | o modal cobre parte da folha, como previsto | não |
| h4-escolher-estados-telemovel | só os cortes previstos ("Jú…", "Macuác…", "Mahlan…") | não | não |
| h5-onze-inicial-1080x1350 | só "B. Cumbane J…" (previsto) | não | não |
| h5b-onze-inicial-4-3-3-1080x1350 | só "D. Mabunda Jú…" (previsto) | não | não |
| h6-jogo-onze-telemovel | não | não | não |
| h6-jogo-onze-desktop | não | não | não |

Nota: o h6-jogo-onze-desktop foi lido antes dos últimos retoques ao h6-jogo-onze-telemovel, que não o afectam. O h6-jogo-onze-desktop também foi reexportado depois de pôr as pílulas a 13 px, mas não o reli depois disso.

## 4. Lista de verificação do DESIGN.md (secção 7)

| Regra | Resultado | Prova |
|---|---|---|
| Só variáveis existentes | cumpre (varrimento do neon e dos fills; o véu é `$texto` com alfa) | h2, h3, h4 |
| Contraste | cumpre, ver tabela da secção 2 | script de contraste |
| Só Big Shoulders e Barlow | cumpre | todos |
| Alvos de toque ≥ 44 px | cumpre | h2, h3, h4 |
| Área de toque do lugar = coluna inteira, ≥ 56×80 px | cumpre. Largura mínima 56, altura 86. | h1-formacoes-360-toque.png |
| Linhas da lista com ≥ 48 px | cumpre. Mínimo medido 57; o bloco "Neste lugar agora" tem 51. | h2, h3, h4 (PNG) |
| Linha de 5 sem sobreposição a 360 px, 3-5-2 e 4-3-3 | cumpre. Folga de 8,8 px entre áreas. | h1-formacoes-360-toque.png |
| Estados do círculo | cumpre | h0-circulo-jogador.png |
| Lista: da posição, "Outras posições", ninguém escondido | cumpre | h2, h4 |
| Lugar ocupado: trocar e "Retirar do onze" | cumpre | h3-escolher-ocupado-telemovel.png, h3-retirar-confirmar-telemovel.png |
| Tamanhos e letra da pílula (12 / 13 / 20 px) | cumpre | h0, h1, h5, h6 |
| Imagem de partilha 1080×1350 | cumpre, nos dois formatos | h5, h5b |
| Realce de selecção nunca neon sobre claro | cumpre | A4 |
| Nada por arrastar | cumpre | h1-escalacao-campo-telemovel.png |

## 5. O que continua por verificar
- Scroll e a transição de 200 ms só estão indicados, não animados.
- A pequena área do campo foi retirada no H5 e no H6 telemóvel. Se a quiseres de volta, preciso de um ajuste ao guarda-redes.
- A linha de área do campo passa por trás da linha de defesas em `h1-escalacao-campo-*`, `h2` e `h3`. Vem do desenho G4b original, que não toquei.
- O ecrã de 360 px só existe em `h1-formacoes-360` e `h1-formacoes-360-toque`. Os outros estão a 390 px.

## 6. Dúvidas para a fase de código
1. **Posição guardada:** os jogadores têm posição guardada? A lista por posição depende disso.
2. **Formação para lugares e posições:** como cada formação mapeia lugares a posições. Proposta: 4-4-2 = 1 GR, 4 DEF, 4 MED, 2 AVA; 4-3-3 = 1/4/3/3, com os extremos como AVA (decisão registada); 3-5-2 = 1/3/5/2; 4-2-3-1 = 1/4/5/1; 4-5-1 = 1/4/5/1.
3. **Foto:** de onde vem, tamanho e formato, e conversão para WebP com timeout na imagem de partilha.
4. **Troca entre posições diferentes:** o comportamento quando o outro lugar é de outra posição.
5. **Acessibilidade:** o lugar do campo precisa de rótulo ("Médio vazio, escolher") e a folha precisa de gestão de foco. A transição de 200 ms fica desligada com `prefers-reduced-motion`.
6. **Pílula de 12 px:** os números de pílula de 12 px são pequenos; a medir em telemóvel real.

## 7. Pergunta de aprovação
Aprovas esta ronda? Diz se queres a pequena área de volta no H5 e no H6, ou outros ajustes. Só depois avanço para a fase de código.
