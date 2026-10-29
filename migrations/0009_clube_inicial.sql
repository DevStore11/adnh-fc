-- 0009: linha inicial do clube (id = 1), para os endpoints públicos nunca ficarem sem clube

-- Só cria se ainda não existir: um clube já gravado nunca é alterado. As cores usam o valor por omissão da tabela.
-- O nome é provisório; o administrador altera-o na página Clube.
INSERT OR IGNORE INTO club (id, nome, epoca_actual)
VALUES (1, 'Associação Desportiva Novo Horizonte', strftime('%Y', 'now'));
