# Testing Licensing Locally

## Get a Test License

Dev purchase and offline token endpoints require a bearer secret that is distributed internally. See the Interim Licensing Playbook for current plan IDs, endpoints, and secrets. Do not paste them here (this file is public).

## Local Environment Setup

```bash
# Required in api/.env
DIRECTUS_LICENSE_KEY=DIR-...
PUBLIC_URL=http://localhost:8055

# Apply the license migration
cd api && pnpm cli database migrate:latest

# Boot
pnpm dev
```

## Verification

- `/admin/settings/license` — shows active plan + entitlements (admin-only)
- `/server/info` — returns license data, but only for authenticated admins (null otherwise)
- Server logs — look for `[license] Failed to initialize` warnings if activation fails

## Gotchas

- `PUBLIC_URL` is an identifier, not a callback. Use `http://localhost:8055` (not `0.0.0.0`, since the browser needs to reach it).
- Once activated, the triplet is bound. Changing `PUBLIC_URL` or resetting the DB (new `project_id`) requires reactivating.
- Foundation PR alone does **not** enforce restrictions. To test locked / recovery UX, check out the full stack up to #27180 (`key/deactivation-flow`).

