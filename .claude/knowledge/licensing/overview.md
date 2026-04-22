# Licensing Overview (v12)

High-level map of the licensing system. See sibling files for details on each topic.

## The License Triplet

A license binds three values together. **All three must match for activation to succeed:**

- `license_key` — immutable, issued by the licensing service
- `project_id` — UUID stored in `directus_settings.project_id` (pre-existed before licensing, used for anonymous telemetry since PR #25300, June 2025)
- `public_url` — value of `PUBLIC_URL` env var (identifier, not a callback; localhost works locally)

**Binding rules:**
- Same `project_id` + same `public_url` → allowed (horizontal scaling, replicas share the key)
- Same `project_id` + different `public_url` → rejected (clone detection)
- Different `project_id` + same `license_key` → rejected (key reuse prevented)

## License Sources & Modes

**Two sources:**
- `env` — via `DIRECTUS_LICENSE_KEY` or `DIRECTUS_LICENSE_OFFLINE_TOKEN` env vars (takes precedence over settings)
- `settings` — via UI / DB in `directus_settings.license_key`

**Two env modes** (mutually exclusive, see [env.ts:14](api/src/license/env.ts#L14)):
1. **Online mode** (`DIRECTUS_LICENSE_KEY`) — validates and refreshes via network every 6h (default, configurable via `LICENSE_VALIDATE_SCHEDULE` cron)
2. **Offline mode** (`DIRECTUS_LICENSE_OFFLINE_TOKEN`) — signed JWT, fully local verification, requires `offline_enabled=true` + `refresh_interval=0`, Enterprise-only

## Where to Go Next

- Endpoints + JWT verification → [service.md](service.md)
- Plan matrix + grace periods → [plans.md](plans.md)
- Lifecycle + refresh + binding → [runtime.md](runtime.md)
- How to issue a test license + local setup → [testing.md](testing.md)
- Review notes for #27173 stack → [pr-27173-review.md](pr-27173-review.md)
