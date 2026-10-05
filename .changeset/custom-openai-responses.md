---
'@directus/api': minor
'@directus/ai': minor
'@directus/system-data': minor
'@directus/app': minor
---

Added a per-model Responses API option for OpenAI-compatible providers, including reasoning configuration for custom deployment names.

Existing models continued to use Chat Completions by default. Selecting Responses used the configured base URL and custom headers, with Provider Options accepting OpenAI SDK options such as `reasoningEffort`. Models marked as supporting reasoning included encrypted reasoning content for stateless tool calls.
