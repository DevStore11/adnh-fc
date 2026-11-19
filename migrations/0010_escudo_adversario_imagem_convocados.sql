-- 0010: escudo dos adversários e imagem dos convocados publicada no jogo
-- Só acrescenta tabelas; não altera nem apaga dados existentes.

-- chave = nome do adversário em minúsculas, sem acentos e com espaços normalizados (ver chaveAdversario na API).
-- escudo = WebP em base64, como o escudo do clube.
CREATE TABLE adversarios (
  chave TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  escudo TEXT NOT NULL,
  actualizado_em TEXT NOT NULL
);

-- Imagem 1080x1350 dos convocados que o gestor publicou. Uma linha por jogo; apagar a linha retira-a do público.
CREATE TABLE jogo_imagens (
  match_id INTEGER PRIMARY KEY REFERENCES matches (id) ON DELETE CASCADE,
  convocados TEXT NOT NULL,
  actualizado_em TEXT NOT NULL
);
