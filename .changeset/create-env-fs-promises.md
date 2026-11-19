---
'@directus/api': patch
---

Replaced `util.promisify(fs.*)` with `node:fs/promises` in the `.env` creation of `directus init`, which also fixed a leaked file descriptor
