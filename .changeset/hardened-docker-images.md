---
'directus': major
---

Hardened the published Docker image and added a distroless Docker Hardened Image (DHI) variant alongside it. The standard image now applies outstanding OS-level patches at build time and drops `npm`/`npx`/`corepack` from the runtime; the new DHI variant is published under a `-dhi` tag suffix.