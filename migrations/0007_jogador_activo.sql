-- 0007: jogador activo/inactivo (um inactivo sai das convocatórias novas e do plantel público, sem perder o histórico)

ALTER TABLE players ADD COLUMN activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1));

-- O número da camisola é único só entre jogadores activos.
CREATE UNIQUE INDEX idx_players_numero_activo ON players (numero) WHERE activo = 1;
