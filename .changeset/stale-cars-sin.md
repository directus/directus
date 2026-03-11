---
'@directus/extensions-sdk': minor
'@directus/themes': minor
'@directus/app': minor
---

Shrunk app UI to 90% and converted all px to rem (16px browser default)

::: notice

Potential breaking change: The app UI has been shrunk to 90% of its previous size. Extensions that rely on hardcoded px values or the old 14px root font-size may render incorrectly — all app sizing now uses rem based on the 16px browser default. 

:::
