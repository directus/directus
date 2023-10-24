---
'@directus/api': major
---

Only load extensions in CLI commands that modify database records like users/roles.

This change is made to avoid blocking errors that are thrown when extensions are attempted to be loaded against a database that isn't installed/updated yet. This can and will happen during any of the database schema commands (like migrate, bootstrap, snapshot).
