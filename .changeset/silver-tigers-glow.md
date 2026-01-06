---
'@directus/api': minor
'@directus/app': minor
'@directus/env': minor
'@directus/system-data': patch
---

Added `AI_ENABLED` environment variable (default: `true`) to allow complete opt-out of AI Chat features at infrastructure level. When disabled, the `/ai/chat` route is not mounted and the AI sidebar is hidden from the app. Also added disabled state notices on the AI settings page when `AI_ENABLED` or `MCP_ENABLED` are set to `false`.
