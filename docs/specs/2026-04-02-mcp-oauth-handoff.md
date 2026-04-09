# MCP OAuth 2.1 Design - Agent Handoff

## What This Is

A design spec for adding an OAuth 2.1 authorization server to Directus so MCP clients (Anthropic connectors / Claude)
can authenticate against self-hosted instances. The spec has been through ~12 rounds of adversarial review including a
5-specialist parallel review (OAuth/RFC, MCP compliance, security, data model/lifecycle, Directus implementation). 37
raw findings consolidated to 25 unique, all actionable ones applied (22 spec fixes).

**Implementation plan is ready:** `docs/specs/2026-04-02-mcp-oauth-implementation-plan.md`

## Files You Need to Read

**Design spec** (the artifact being refined):

- `docs/specs/2026-04-02-mcp-oauth-server-design.md` - the full design

**ADRs** (key architectural decisions with rationale):

- `docs/adr/001-oauth-server-token-storage.md` - why we use `directus_oauth_tokens` as a separate grant table + one
  discriminator on sessions
- `docs/adr/002-oauth-library-choice.md` - why we build the endpoints directly instead of using node-oidc-provider
- `docs/adr/003-oauth-scope-restriction.md` - why OAuth tokens are restricted to `/mcp/*` using `oauth_client`
  discriminator

**Existing Directus auth code** (the integration surface):

- `api/src/services/authentication.ts` - login, refresh (line ~344 is the critical SELECT), logout, session rotation
  (`updateStatefulSession`)
- `api/src/utils/verify-session-jwt.ts` - session validation (currently `select(1)`, needs refactor to return
  `oauth_client`)
- `api/src/utils/get-accountability-for-token.ts` - builds the accountability object from tokens
- `api/src/middleware/authenticate.ts` - the auth middleware chain
- `api/src/middleware/extract-token.ts` - token extraction from headers/cookies/query
- `api/src/websocket/authenticate.ts` - WebSocket auth (line ~31 calls refresh without `session: true`)
- `api/src/app.ts` - main Express app setup, middleware ordering, route mounts (line ~293 auth, ~328 MCP)
- `api/src/controllers/mcp.ts` - current MCP controller

## Current State of the Design

The spec is at **medium-low risk** per the latest reviewer assessment. Core protocol architecture is sound. No major
unresolved protocol flaws. The remaining work is hardening edge cases and filling in implementation specifics.

### Key Architectural Decisions (settled)

1. **No library** - building 5-6 OAuth endpoints using existing Directus crypto/JWT/session primitives
2. **Public-client DCR subset** of MCP auth spec (2025-11-25). Not full conformance.
3. **`directus_oauth_tokens`** is the durable grant record (token family). Stores resource, code_hash, scope, session
   pointer, previous_session for reuse detection. Lives independently of session rotation.
4. **One column on `directus_sessions`**: `oauth_client` (FK, CASCADE) as fast discriminator only
5. **Strict refresh rotation** - no Directus grace period for OAuth. Grant pointer update, new session insert, old
   session delete all in one transaction. `previous_session` enables single-generation reuse detection.
6. **HMAC-signed consent params** - stateless integrity for horizontal scaling. JSON array serialization, derived key,
   user-bound, time-limited (5 min). State and resource included.
7. **RFC 8707 resource/audience binding** - canonical resource is `PUBLIC_URL + /mcp`. Stored on grant, used as JWT
   `aud` claim, validated on MCP endpoint.
8. **Consent always shown** for DCR clients (no auto-skip) to prevent cross-site code minting.
9. **Session-cookie-only auth** on consent endpoints (reject bearer tokens).
10. **code_hash** (SHA256 of raw code string) on grant record for audit/logging after code cleanup (no replay revocation
    for public clients).
11. **Server-side redirect** from decision endpoint (HTTP 302, not JSON). Auth code never in JavaScript.
12. **RFC 9207 issuer identification** - `iss` parameter in authorization responses for mix-up defense.
13. **Dual-auth /mcp** - regular Directus sessions and OAuth sessions both work; aud validation scoped to OAuth only.
14. **Refresh-token-only revocation** - no access-token revocation (avoids unverified JWT claim attacks).

### Known Limitations (documented and accepted)

- Refresh reuse detection is single-generation (`previous_session` only). Full lineage is v2.
- Code exchange and refresh are not idempotent. Client timeout + retry = `invalid_grant` (code) or self-revocation
  (refresh).
- Subpath deployments need reverse proxy config for `.well-known` routing.

### What Review Rounds Have Covered

The spec has been reviewed for:

- RFC 6749, 7636, 7591, 7009, 8414, 9728, 8707, 9207 compliance (with exact section citations)
- MCP Authorization Spec 2025-11-25 compliance
- Attack surface analysis (DCR abuse, HMAC construction, session isolation, race conditions, CSRF)
- Directus integration security (all refresh paths, WebSocket bypass, session rotation, accountability)
- Token lifecycle (reuse detection, code replay, grant-level revocation, audience binding across refresh)
- n8n reference implementation comparison (PR #21469)
- Backward compatibility (existing non-OAuth MCP access preserved)
- Authorization code exposure (server-side redirect eliminates JS exposure)
- Refresh atomicity (transactional rotation prevents self-revocation on crash)
- Public-client threat model (replay revocation is DoS vector; removed)
- Revocation endpoint security (unverified JWT claim attack; access-token revocation removed)
- Token transport enforcement (query-string bypass via extract-token.ts)
- Subpath deployment interoperability (issuer/authorization_servers include subpath)

### Open Items

Implementation-plan-level items (not design gaps):

1. **HTTP plumbing** - `express.urlencoded()` for /token, /revoke, /authorize/decision; route-local CORS/Origin
   middleware; `Access-Control-Expose-Headers` on /mcp 401s; router mount order
2. **Static route registration** - wiring `/admin/mcp-oauth/authorize` as a static app route in `app/src/router.ts` (not
   a module)

### DB Schema Summary

5 tables total:

| Table                          | Purpose                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `directus_oauth_clients`       | DCR-registered clients (PK: `client_id` uuid)                                       |
| `directus_oauth_codes`         | Short-lived auth codes with PKCE challenge, resource                                |
| `directus_oauth_consents`      | Per (user, client, redirect_uri) consent records                                    |
| `directus_oauth_tokens`        | Durable grant record: session pointer, previous_session, resource, code_hash, scope |
| `directus_sessions` (modified) | +1 column: `oauth_client` (FK, nullable, CASCADE)                                   |

### Existing Code Changes Required (10 items)

Listed in the spec under "Existing Code Modifications Required". Key ones:

1. `authentication.ts refresh()` - add `.andWhere('s.oauth_client', null)` to initial SELECT
2. `authentication.ts logout()` - gate initial SELECT, not just delete
3. `verify-session-jwt.ts` - return `oauth_client` instead of `select(1)`
4. `get-accountability-for-token.ts` - populate `accountability.oauth_client`
5. `websocket/authenticate.ts` - reject OAuth bearer tokens
6. `/mcp` auth special-casing - 401 + WWW-Authenticate with two RFC 6750 variants
7. Global post-authenticate guard in `app.ts`
8. Consent endpoints - session-cookie-only, reject bearer 9-10. Type changes to Accountability and DirectusTokenPayload

## How to Continue

The user will provide additional review findings. For each:

1. Assess whether it's a real design gap, an implementation detail, or invalid
2. Push back on findings that are already addressed or wrong
3. Fix real gaps in the spec
4. Note implementation-plan-level items without adding them to the design spec

The design spec is the deliverable. ADRs document key decisions. The implementation plan is the NEXT step after the spec
is approved.
