# Testing Licensing Locally

## Get a Test License

**OIG (fastest, unlimited everything except Enterprise-only features):**

```bash
curl -X POST "https://keys.licit.dev/api/licenses/purchase" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "6d437cc1-7f5d-421f-8a33-0bc8d5ea1f74",
    "billing_interval": "month",
    "billing_email": "test@example.com",
    "applicant_id": "test-org-id"
  }'
```

Returns `{ license_id, license_key }` immediately. Key format: `DIR-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX`.

**Team (real Stripe flow):**

```bash
curl -X POST "https://keys.licit.dev/api/licenses/purchase" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "8f79d4e2-9c7b-4c0e-9b79-3947bd6e5d3f",
    "billing_interval": "month",
    "billing_email": "test@example.com"
  }'
```

Returns a Stripe checkout URL. Pay with sandbox card `4242 4242 4242 4242`, any future expiry, any CVC. License emailed after `checkout.session.completed` webhook.

**Plan IDs** on apac-dev as of 2026-04-21 (re-check the `plan` collection in other envs).

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

