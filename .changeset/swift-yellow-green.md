---
'@directus/api': patch
---

Prevented encrypted field decryption failures from crashing settings reads when the SECRET has changed. Fields that can't be decrypted now return null and log a warning instead of throwing.
