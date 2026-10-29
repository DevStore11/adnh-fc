-- SEED SÓ PARA DESENVOLVIMENTO LOCAL (dados fictícios). Apaga e recria o conteúdo das tabelas.
-- NUNCA aplicar ao remoto: não existe script para isso e não deve ser criado.
DELETE FROM match_events;
DELETE FROM match_squad;
DELETE FROM matches;
DELETE FROM players;
DELETE FROM club;

INSERT INTO club (id, nome, escudo, cor_primaria, cor_secundaria, epoca_actual)
VALUES (1, 'Associação Desportiva Novo Horizonte', NULL, '#0B1F3A', '#39FF14', '2026');

INSERT INTO players (id, nome, foto, posicao, numero, estado) VALUES
  (1, 'Armando Chissano', NULL, 'guarda-redes', 1, 'activo'),
  (2, 'Hélio Macamo', NULL, 'defesa', 2, 'activo'),
  (3, 'Joaquim Tembe', NULL, 'defesa', 3, 'activo'),
  (4, 'Nelson Cossa', NULL, 'defesa', 4, 'activo'),
  (5, 'Adriano Mabunda', NULL, 'defesa', 5, 'activo'),
  (6, 'Celso Nhantumbo', NULL, 'médio', 6, 'activo'),
  (7, 'Ivan Langa', NULL, 'avançado', 7, 'activo'),
  (8, 'Dércio Matsinhe', NULL, 'médio', 8, 'activo'),
  (9, 'Falcão Bila', NULL, 'avançado', 9, 'activo'),
  (10, 'Ernesto Muianga', NULL, 'médio', 10, 'activo'),
  (11, 'Tomás Zimba', NULL, 'avançado', 11, 'activo'),
  (12, 'Délio Novela', NULL, 'guarda-redes', 12, 'activo'),
  (13, 'Anselmo Guambe', NULL, 'defesa', 13, 'activo'),
  (14, 'Rui Mucavele', NULL, 'médio', 14, 'activo'),
  (15, 'Edson Uamusse', NULL, 'avançado', 15, 'activo'),
  (16, 'Hélder Cumbe', NULL, 'defesa', 16, 'activo'),
  (17, 'Nuro Sitoe', NULL, 'médio', 17, 'suspenso'),
  (18, 'Júlio Mondlane', NULL, 'avançado', 18, 'lesionado');

INSERT INTO matches (id, adversario, data, local, competicao, golos_pro, golos_contra, estado, formacao, mvp_player_id, epoca, versao) VALUES
  (1, 'Académica da Costa do Sol', '2026-09-20T13:30:00Z', 'Campo da Costa do Sol', 'Jornada 4 · Liga Distrital de Maputo', 2, 1, 'terminado', '4-3-3', NULL, '2026', 1),
  (2, 'Ferroviário da Malhangalene', '2026-09-27T13:30:00Z', 'Campo do Novo Horizonte', 'Jornada 5 · Liga Distrital de Maputo', 0, 0, 'terminado', '4-3-3', NULL, '2026', 1),
  (3, 'Sporting da Machava', '2026-10-04T13:30:00Z', 'Campo do Novo Horizonte', 'Jornada 6 · Liga Distrital de Maputo', 2, 0, 'terminado', '4-3-3', NULL, '2026', 1),
  (4, 'Atlético do Chamanculo', '2026-10-11T13:30:00Z', 'Campo do Chamanculo', 'Jornada 7 · Liga Distrital de Maputo', 0, 2, 'terminado', '4-4-2', NULL, '2026', 1),
  (5, 'União do Xipamanine', '2026-10-18T13:30:00Z', 'Campo do Novo Horizonte', 'Jornada 8 · Liga Distrital de Maputo', 1, 1, 'terminado', '4-3-3', NULL, '2026', 1),
  (6, 'Desportivo da Polana', '2026-10-25T13:30:00Z', 'Campo da Polana', 'Jornada 9 · Liga Distrital de Maputo', 3, 1, 'terminado', '4-3-3', 9, '2026', 1),
  (7, 'Grupo Desportivo da Matola', '2026-11-01T13:30:00Z', 'Campo Municipal da Matola', 'Liga Distrital de Maputo, jornada 10', NULL, NULL, 'agendado', NULL, NULL, '2026', 1);

UPDATE matches
SET mvp_descricao = 'Abriu o marcador aos 23'' e fechou a conta aos 61''. Eleito pelo treinador.'
WHERE id = 6;

-- Convocatória do jogo 6: onze inicial em 4-3-3 (x, y em fracções do campo) e suplentes.
INSERT INTO match_squad (match_id, player_id, convocado, titular, posicao_campo, suplente) VALUES
  (6, 1, 1, 1, '{"x":0.5,"y":0.9}', 0),
  (6, 2, 1, 1, '{"x":0.15,"y":0.72}', 0),
  (6, 4, 1, 1, '{"x":0.38,"y":0.72}', 0),
  (6, 5, 1, 1, '{"x":0.61,"y":0.72}', 0),
  (6, 3, 1, 1, '{"x":0.85,"y":0.72}', 0),
  (6, 6, 1, 1, '{"x":0.25,"y":0.5}', 0),
  (6, 8, 1, 1, '{"x":0.5,"y":0.5}', 0),
  (6, 10, 1, 1, '{"x":0.75,"y":0.5}', 0),
  (6, 7, 1, 1, '{"x":0.2,"y":0.22}', 0),
  (6, 9, 1, 1, '{"x":0.5,"y":0.2}', 0),
  (6, 11, 1, 1, '{"x":0.8,"y":0.22}', 0),
  (6, 12, 1, 0, NULL, 1),
  (6, 13, 1, 0, NULL, 1),
  (6, 14, 1, 0, NULL, 1),
  (6, 15, 1, 0, NULL, 1),
  (6, 16, 1, 0, NULL, 0);

INSERT INTO match_events (match_id, player_id, tipo, minuto) VALUES
  (1, 9, 'golo', 12), (1, 10, 'assist', 12), (1, 11, 'golo', 67),
  (3, 9, 'golo', 30), (3, 10, 'golo', 71), (3, 7, 'assist', 71),
  (5, 7, 'golo', 40), (5, 8, 'assist', 40),
  (6, 9, 'golo', 23), (6, 6, 'assist', 23),
  (6, 13, 'amarelo', 55),
  (6, 9, 'golo', 61), (6, 7, 'assist', 61),
  (6, 10, 'golo', 78), (6, 11, 'assist', 78),
  (6, NULL, 'golo_sofrido', 84);

-- Os jogos de exemplo já têm convocatória e escalação publicadas.
UPDATE matches SET convocatoria_publicada = 1, escalacao_publicada = 1
WHERE EXISTS (SELECT 1 FROM match_squad s WHERE s.match_id = matches.id);
