---
'@directus/api': patch
---

Replaced the database client library `mysql` with `mysql2`, used for MySQL/MariaDB

::: notice

`mysql2` leads to stricter queries regarding the charset. If you're using MySQL/MariaDB, please ensure the value of the config option `DB_CHARSET`/`DB_CHARSET_NUMBER` matches the charset of your tables.

:::
