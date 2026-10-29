-- 0006: autenticação (utilizadores, sessões, limite de tentativas de login) e registo de actividade

-- role igual a PAPEIS em @adnh-fc/shared. Datas em ISO 8601 UTC (texto), comparáveis por ordem alfabética.
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
  senha_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'gestor')),
  activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  deve_trocar_senha INTEGER NOT NULL DEFAULT 1 CHECK (deve_trocar_senha IN (0, 1)),
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- id = SHA-256 (hex) do token do cookie; o token nunca é guardado.
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expira_em TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ip TEXT,
  user_agent TEXT
);

CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_sessions_expira ON sessions (expira_em);

-- chave = SHA-256 (hex) de ip+email (ou só do ip, no limite geral); nunca o email ou o IP em claro.
CREATE TABLE tentativas_login (
  chave TEXT PRIMARY KEY,
  contagem INTEGER NOT NULL DEFAULT 0,
  bloqueado_ate TEXT,
  actualizado_em TEXT NOT NULL
);

CREATE INDEX idx_tentativas_actualizado ON tentativas_login (actualizado_em);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
  accao TEXT NOT NULL,
  entidade TEXT,
  entidade_id INTEGER,
  data TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ip TEXT
);

CREATE INDEX idx_audit_log_data ON audit_log (data DESC, id DESC);
