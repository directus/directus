---
'@directus/api': minor
'@directus/types': minor
'@directus/env': minor
'@directus/system-data': minor
---

Added MCP OAuth 2.1 authorization server. MCP clients (like Claude, Codex) can now authenticate via standard OAuth flow with PKCE instead of requiring a manually provisioned static token. Enable with `MCP_OAUTH_ENABLED=true`.
