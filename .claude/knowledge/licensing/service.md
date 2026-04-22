# Licensing Service & JWT Verification

## External Service

SaaS at `https://keys.licit.dev`, versioned via `Directus-License-Version: 2026-02-18` header.

See [constants.ts](api/src/license/constants.ts) for the base URL and version header constants.

## Main Endpoints

- `POST /api/licenses/purchase` — creates a license key (Stripe checkout URL for Team, instant for OIG)
- `POST /api/licenses/check` — validates that a key exists without binding
- `POST /api/licenses/activate` — binds key to `project_id` + `public_url`, returns JWT
- `POST /api/licenses/validate` — validates an existing active binding, returns refreshed JWT
- `POST /api/licenses/deactivate` — unbinds a key from a project
- `GET /.well-known/jwks.json` — public JWKS used to verify JWTs
- `POST /internal/licenses/generate-offline` — creates signed offline tokens (Enterprise-only)

All outbound calls go through [service.ts](api/src/license/service.ts) which wraps the axios client in [request.ts](api/src/license/request.ts) (adds retry logic).

## JWT Verification

Tokens signed with EdDSA (Ed25519). Three-layer verification in [verify-token.ts](api/src/utils/verify-token.ts):

1. **Fresh remote** — JWKS fetched from `/.well-known/jwks.json` (cached briefly per-process)
2. **Cached remote** — reuse cached JWKS if fresh fetch fails transiently
3. **Local fallback** — hardcoded JWK in [fallback-jwk.ts](api/src/license/fallback-jwk.ts) (used for offline mode or when remote is unavailable)

`verifyLocallyWithinGrace()` in the same file allows expired tokens to still be used within the token's configured `grace_period`.

**Watch out:** the fallback JWK is hardcoded in the Directus codebase. If the licensing service rotates its key, a Directus release is required before clients can verify tokens signed with the new key.

