---
'@directus/api': patch
---

Add cleanup handlers to destroy archive and source streams when clients disconnect during file downloads to prevent
socket/resource leaks.
