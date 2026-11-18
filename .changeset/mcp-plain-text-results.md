---
'@directus/api': major
---

Sent text tool results over MCP, such as the system prompt, as plain text instead of JSON-wrapped strings

::: notice

Text results such as `system-prompt` now come back as the text itself instead of a JSON string like `{"raw": "..."}`, with any URL in a second text block. Callers on the default `/mcp` endpoint that parsed these results as JSON should read the text directly. Object results and `?tool_mode=registry` results are unchanged

:::
