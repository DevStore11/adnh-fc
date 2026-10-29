-- 0003: jogos, convocatória/escalação e eventos do jogo

-- data em ISO 8601 UTC. formacao igual a FORMACOES em @adnh-fc/shared.
CREATE TABLE matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  adversario TEXT NOT NULL,
  data TEXT NOT NULL,
  local TEXT NOT NULL,
  competicao TEXT NOT NULL,
  golos_pro INTEGER,
  golos_contra INTEGER,
  estado TEXT NOT NULL DEFAULT 'agendado' CHECK (estado IN ('agendado', 'terminado')),
  formacao TEXT CHECK (formacao IS NULL OR formacao IN ('4-4-2', '4-3-3', '3-5-2', '4-2-3-1')),
  mvp_player_id INTEGER REFERENCES players (id),
  epoca TEXT NOT NULL,
  versao INTEGER NOT NULL DEFAULT 1,
  CHECK (estado = 'agendado' OR (golos_pro IS NOT NULL AND golos_contra IS NOT NULL))
);
CREATE INDEX idx_matches_data ON matches (data);

-- posicao_campo: JSON {"x": 0..1, "y": 0..1} (y = 0 é o ataque, y = 1 a baliza própria).
CREATE TABLE match_squad (
  match_id INTEGER NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players (id),
  convocado INTEGER NOT NULL DEFAULT 1 CHECK (convocado IN (0, 1)),
  titular INTEGER NOT NULL DEFAULT 0 CHECK (titular IN (0, 1)),
  posicao_campo TEXT,
  suplente INTEGER NOT NULL DEFAULT 0 CHECK (suplente IN (0, 1)),
  PRIMARY KEY (match_id, player_id)
);

CREATE TABLE match_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players (id),
  tipo TEXT NOT NULL CHECK (tipo IN ('golo', 'assist', 'amarelo', 'vermelho')),
  minuto INTEGER NOT NULL CHECK (minuto BETWEEN 0 AND 130)
);
CREATE INDEX idx_match_events_match_tipo ON match_events (match_id, tipo);
