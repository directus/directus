# Licensing PR Stack Review (#27173–#27180)

## PR Stack Overview

8 stacked PRs by @licitdev, all draft as of 2026-04-22. Each stacks on the previous one:

1. **#27173** `Add key foundation` (base = main)
   - Entry points, license loading, runtime init, basic validation
2. **#27174** `Add collection exclusions` (base = key/foundation)
   - Enforces max collection count via exclusion list
3. **#27175** `Add user limits` (base = key/collections)
   - Enforces max active users (hard cap or soft limit with addons)
4. **#27176** `Add activity and revision limits` (base = key/users)
   - Enforces activity log + revision history retention
5. **#27177** `Add custom policy limits` (base = key/activity)
   - Policy editing restrictions for lower plans
6. **#27178** `Add LLM limits` (base = key/policies)
   - Custom AI model restrictions
7. **#27179** `Add SSO limits` (base = key/llm)
   - SSO provisioner access control
8. **#27180** `Add deactivation and recovery flow` (base = key/sso) — **FINAL**
   - Project lock + resource resolution UX, enforcement layer

**Important:** Foundation PR (#27173) alone does NOT enforce restrictions. Enforcement happens in #27180.

## Testing Setup

### Get a Test License
Instant OIG issuance via curl:
```bash
curl -X POST "https://keys.licit.dev/api/licenses/purchase" \
  -H "Content-Type: application/json" \
  -d '{"plan_id": "6d437cc1-7f5d-421f-8a33-0bc8d5ea1f74", "billing_interval": "month", "billing_email": "tester@example.com", "applicant_id": "test-org-id"}'
```
Response includes `license_key` (format: `DIR-...`)

### Local Environment
```bash
export DIRECTUS_LICENSE_KEY=DIR-<key-from-above>
export PUBLIC_URL=http://localhost:8055
cd api && pnpm cli database migrate:latest  # runs migration 20260219A-add-license-key
npm run dev
```

### Verification
- Admin `/admin/settings/license` — displays active plan + entitlements
- `/server/info` (authenticated admin only) — returns license data
- Foundation PR alone: no enforcement. To see locked/recovery flows, check out full stack through #27180.

## Review Focus Areas

From author's PR notes and architecture analysis:

### 1. Env vs Settings Split (HIGH RISK)
- env-managed (`DIRECTUS_LICENSE_KEY`) and settings-managed (`directus_settings.license_key`) have different validation, save, and deactivate paths
- Flag: validate that fallback behavior is correct when one source is missing
- See [env.ts](api/src/license/env.ts) and [lifecycle.ts](api/src/license/lifecycle.ts)

### 2. Server Contract
- `/server/license*` endpoints and `/admin/settings/license` UI page form the main contract for rest of stack
- Validate: response shape, entitlements serialization, auth permissions (admin-only)
- See [controllers/server.ts](api/src/controllers/server.ts) and [license routes](api/src/routes/license.ts)

### 3. `show_license_key_field` in serverInfo()
- Must stay aligned with backend source-of-truth behavior
- Drives onboarding step-2 display logic (show key input vs settings UI)
- Check: logic in [controllers/server.ts:380](api/src/controllers/server.ts#L380)

### 4. Rotate Flow Atomicity
- In [lifecycle.ts:326](api/src/license/lifecycle.ts#L326): if activation fails, does rollback to previous license actually work?
- Flag: verify transaction boundaries are correct

### 5. JWKS + Fallback JWK
- Fallback JWK is hardcoded in [fallback-jwk.ts](api/src/license/fallback-jwk.ts)
- Risk: key rotation on licensing service would require a release to update fallback
- Mitigates: network-first verification + cached JWKS in [verify-token.ts](api/src/utils/verify-token.ts)

### 6. Onboarding Atomicity
- Admin creation + owner settings + optional license activation must be atomic
- See [controllers/server.ts:380](api/src/controllers/server.ts#L380)
- Flag: verify DB transaction wraps entire flow

## Findings

(Populated as review progresses)

## Open Questions

(Populated as review progresses)

