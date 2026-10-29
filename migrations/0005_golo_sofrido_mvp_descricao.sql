-- 0005: tipo 'golo_sofrido' em match_events (player_id opcional só nesse tipo) e mvp_descricao em matches

-- O SQLite não altera CHECK: recria-se a tabela e copiam-se os dados.
-- tipo igual a TIPOS_EVENTO em @adnh-fc/shared.
CREATE TABLE match_events_nova (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players (id),
  tipo TEXT NOT NULL CHECK (tipo IN ('golo', 'assist', 'amarelo', 'vermelho', 'golo_sofrido')),
  minuto INTEGER NOT NULL CHECK (minuto BETWEEN 0 AND 130),
  CHECK (tipo = 'golo_sofrido' OR player_id IS NOT NULL)
);

INSERT INTO match_events_nova (id, match_id, player_id, tipo, minuto)
SELECT id, match_id, player_id, tipo, minuto FROM match_events;

DROP TABLE match_events;
ALTER TABLE match_events_nova RENAME TO match_events;
CREATE INDEX idx_match_events_match_tipo ON match_events (match_id, tipo);

ALTER TABLE matches ADD COLUMN mvp_descricao TEXT;
