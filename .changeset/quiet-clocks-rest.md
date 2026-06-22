---
'@directus/api': patch
---

Fixed several issues in the Cloudflare Workers Builds deployment integration including a noisy debug log firing every minute on unconfigured instances, an N+1 query in the deployment dashboard, webhook re-registration ordering, and silent error swallowing in queue message processing.
