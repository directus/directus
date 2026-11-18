---
'@directus/api': minor
'@directus/env': minor
---

Turned MCP OAuth on by default, with clients identifying themselves through a metadata URL (CIMD). Dynamic client registration stays off. Projects created with `directus bootstrap` or `directus init` get both settings on; existing projects keep their saved settings. MCP itself stays opt-in

::: notice

`MCP_OAUTH_ENABLED` and `MCP_OAUTH_CIMD_ENABLED` now default to `true`. Set them to `false` to keep OAuth off. MCP OAuth also turns itself off with a warning when `PUBLIC_URL` isn't a full URL

:::
