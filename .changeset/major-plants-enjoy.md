---
'directus': patch
---

Used the `pm2` bundled with `@directus/api` in the Docker images instead of installing a separate copy, so its dependencies follow the versions pinned by the workspace

::: notice

If you extend the Docker image: it now boots via `CMD ["node", "docker-entrypoint.cjs"]`, which runs the same `bootstrap` then `pm2-runtime` sequence as before. `pm2-runtime` is no longer on the `PATH`, so a custom `CMD` that called it directly should hand off to `docker-entrypoint.cjs` instead. `pm2` itself remains on the `PATH` for `docker exec` diagnostics.

:::
