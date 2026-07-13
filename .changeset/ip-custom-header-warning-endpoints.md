---
'@directus/api': patch
---

Stopped logging the "Custom IP header didn't return valid IP address" warning for requests to the no-auth `/server/ping` and `/server/info` endpoints, which are commonly hit directly (health checks, uptime pings) rather than through the proxy that sets `IP_CUSTOM_HEADER`
