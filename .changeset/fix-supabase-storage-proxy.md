---
'@directus/storage-driver-supabase': major
---

Added proxy support via `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` environment variables

::: notice

- Requests now go through the proxy set in `HTTP_PROXY`/`HTTPS_PROXY`. If these variables are already set and Supabase should be reached directly add its host to `NO_PROXY`
- Proxy variables are read from the process environment, not from the Directus `.env` or config file

:::
