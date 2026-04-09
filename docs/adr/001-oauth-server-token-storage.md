# ADR-001: OAuth Token Storage Strategy

## Status

Accepted (revised)

## Context

We're adding OAuth 2.1 authorization server support to Directus (for MCP connector integration). We need to decide how
to store OAuth access tokens, refresh tokens, authorization codes, and grant state (resource/audience, scope, code
lineage).

## Options Considered

### Option A: Separate `directus_oauth_tokens` table for everything

Store access tokens, refresh tokens in a dedicated table. Clean separation but duplicates what `directus_sessions`
already does for session-backed validation. OAuth access tokens wouldn't integrate with existing middleware without
changes.

### Option B: Stateless JWT access tokens (no DB storage)

Issue plain JWTs without `session` claim. No DB lookup per MCP request. But no immediate revocation: users need to be
able to revoke MCP client access instantly. MCP request volume is low enough that a DB check per request is fine.

### Option C: Add all OAuth state to `directus_sessions`

Add `oauth_client`, `resource`, `oauth_code`, `scope` columns directly to sessions. Minimal schema change but creates a
maintenance hazard: `updateStatefulSession()` creates new session rows on rotation and must propagate every OAuth
column. Missing one is a security vulnerability (session loses its scope restriction). The insert site uses
`Record<string, any>` with no type safety, and this fragility has already been demonstrated in the codebase history.

### Option D: Separate `directus_oauth_tokens` for grant state + discriminator on sessions

Session-backed JWTs for access tokens (reuse existing `verifySessionJWT` middleware). One discriminator column
(`oauth_client`) on `directus_sessions` for fast "is this OAuth?" checks and cascade cleanup. All durable grant state
(resource, scope, code lineage) in a separate `directus_oauth_tokens` table. On session rotation, only `oauth_client` is
propagated (one column), and `oauth_tokens.session` is updated to point to the new token (one UPDATE).

**Selected.**

## Decision

Use Option D. OAuth sessions are stored in `directus_sessions` with one additional nullable column (`oauth_client`) as a
fast discriminator. Grant state lives in `directus_oauth_tokens`, which references the current session token as a plain
column (not FK, because the token value rotates). Authorization codes go in `directus_oauth_codes`.

## Rationale

- Immediate revocation via DB session check (matches existing app behavior)
- Reuses proven session infrastructure for access token validation (`verifySessionJWT`)
- No separate `refresh_token` column needed: the session `token` IS the refresh token
- Grant state survives session rotation without copy-on-rotate fragility
- `updateStatefulSession` only propagates `oauth_client` (one column) instead of N columns
- `oauth_tokens.session` is a plain column to avoid FK issues with rotating values and grace-period cleanup
- `oauth_code` on the grant record is also a plain column to survive code cleanup
- Auth codes are separate because they have a fundamentally different lifecycle (short-lived, single-use)

## Session Isolation

- `AuthenticationService.refresh()` adds `.andWhere('oauth_client', null)` to the initial SELECT, blocking all three
  refresh entry points (REST, GraphQL, WebSocket)
- `AuthenticationService.logout()` gates the initial SELECT to reject OAuth sessions early
- A global post-authenticate guard rejects `oauth_client` sessions on non-MCP routes
