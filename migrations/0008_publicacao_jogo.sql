-- 0008: convocatória e escalação só aparecem ao público quando o gestor as publica

ALTER TABLE matches ADD COLUMN convocatoria_publicada INTEGER NOT NULL DEFAULT 0 CHECK (convocatoria_publicada IN (0, 1));
ALTER TABLE matches ADD COLUMN escalacao_publicada INTEGER NOT NULL DEFAULT 0 CHECK (escalacao_publicada IN (0, 1));

-- Jogos que já tinham convocatória e escalação antes desta migração mantêm o que o público já via.
UPDATE matches
SET convocatoria_publicada = 1,
    escalacao_publicada = 1
WHERE EXISTS (SELECT 1 FROM match_squad s WHERE s.match_id = matches.id);
