---
'@directus/api': minor
'@directus/app': minor
'@directus/types': minor
'@directus/env': minor
'@directus/system-data': minor
'@directus/utils': minor
---

Added MCP OAuth 2.1 authorization server. MCP clients (like Claude, Codex) can now authenticate via standard OAuth flow with PKCE instead of requiring a manually provisioned static token. Enable with `MCP_OAUTH_ENABLED=true`. Dynamic and client ID metadata registration were kept separately opt-in with `MCP_OAUTH_DCR_ENABLED=true` and `MCP_OAUTH_CIMD_ENABLED=true`.
