-- Last step unifying these two values into one...
UPDATE directus_ui
SET name = 'table_related'
WHERE name = 'related_table';