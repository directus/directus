---
'@directus/api': patch
---

Fixed MCP clients that prefer signed client authentication, like ChatGPT, being refused during sign-in. Directus now reads every token endpoint auth method a client's metadata document offers and uses one it supports
