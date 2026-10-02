---
'@directus/extensions': minor
'@directus/app': minor
---

Isolated failing richtext extensions so one broken extension cannot break the editor or the other extensions. The generated extensions entrypoint now loads each app extension through its own guarded dynamic import, so an extension that throws while its module loads is skipped and logged instead of failing the import of every app extension. An extension whose nodes cannot build the editor schema is rejected at registration with the thrown message, and a contributed toolbar button whose command or active check throws is disabled and logged while the editor keeps working.
