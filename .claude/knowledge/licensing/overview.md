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

## External References

**Notion (general context):**
- [Licensing Rationale](https://www.notion.so/directus/2e144a408a7580dca85bc9a3767fbbf6) — the "why" of the v12 model
- [Licensing Options Comparison (Async)](https://www.notion.so/directus/63da1895b35945418b8da95620022320) — hard vs soft limits, grace rules
- [v12 License Change Blog Post](https://www.notion.so/directus/31844a408a7580c4a7d8e529a25027f1) — external communication
- [BSL Licensing Research](https://www.notion.so/directus/2d944a408a7580c9b859c5ade3da91da) — background research
- [Enterprise licensing](https://www.notion.so/directus/24744a408a75818e91b9f21dab425aca) — enterprise model

**Linear (active work):**
- [License Key System & Validation](https://linear.app/directus/project/33b0eb53-fd69-44e0-b423-224e543e2207) — main project (Alex Gaillard, in progress)
- [Commerce & Provisioning Layer](https://linear.app/directus/project/774f026a-86b7-4be6-a6f0-5a3ea8602b42) — Stripe side (Ian Ng)
- [Directus v12 GTM Launch](https://linear.app/directus/project/620c40b6-3cad-4dce-9ce6-db74d61455d8) — launch project

**Design:**
- [Licensing Figma](https://www.figma.com/design/ssrfyo4QB8nceZuT4BoxQj/Licensing?node-id=497-32947) — UI flows, grace period screens, resource resolution
