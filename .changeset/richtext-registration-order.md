---
'@directus/app': patch
---

Made richtext extension order the same on every deployment. Extensions are now sorted by id before they are checked, so the name-conflict winner, the parse priority for the same HTML and the toolbar button order no longer depend on the filesystem order of the extension folders.
