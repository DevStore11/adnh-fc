-- 0002: clube (configuração, escudo, cores) e jogadores (dados, estado, foto)

-- Uma só linha (id = 1). Imagens guardadas como WebP em base64, sem prefixo "data:".
CREATE TABLE club (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  nome TEXT NOT NULL,
  escudo TEXT,
  cor_primaria TEXT NOT NULL DEFAULT '#0B1F3A',
  cor_secundaria TEXT NOT NULL DEFAULT '#39FF14',
  epoca_actual TEXT NOT NULL
);

-- Valores de posicao e estado iguais a POSICOES e ESTADOS_JOGADOR em @adnh-fc/shared.
CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  foto TEXT,
  posicao TEXT NOT NULL CHECK (posicao IN ('guarda-redes', 'defesa', 'médio', 'avançado')),
  numero INTEGER NOT NULL CHECK (numero BETWEEN 1 AND 99),
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'lesionado', 'suspenso'))
);
