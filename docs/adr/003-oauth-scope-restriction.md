# ADR-003: OAuth Token Scope Restriction

## Status

Accepted

## Context

The OAuth 2.1 authorization server we're building is general-purpose in implementation, but we need to decide whether
tokens it issues should grant full Directus API access or be restricted to specific endpoints.

## Options Considered

### Option A: Full API access

OAuth tokens work like regular Directus sessions. Any authenticated endpoint is accessible. This makes the OAuth server
a general-purpose identity provider for Directus.

**Rejected**: dramatically increases the security surface. Dynamically registered OAuth clients (via DCR, which is
unauthenticated) would get the same access level as the Directus app itself. Too much risk for v1 where the only
consumer is MCP.

### Option B: Scope claim in JWT + scope column in sessions

Add a `scope` column to `directus_sessions` and a `scope` claim to the JWT. Middleware checks scope against the
requested endpoint.

**Rejected for now**: unnecessary complexity. If the only OAuth tokens we issue are MCP-scoped, and the only way to get
an OAuth token is through the MCP OAuth flow, then the presence of `oauth_client` on the session is already a sufficient
discriminator. No extra column needed.

### Option C: Restrict based on `oauth_client` presence

If a session has `oauth_client IS NOT NULL`, it came from the OAuth flow and is restricted to MCP endpoints only. A
single middleware guard on non-MCP routes rejects these tokens.

**Selected.**

## Decision

OAuth-issued tokens are restricted to MCP transport endpoints (`/mcp/*`). The guard uses the existing `oauth_client`
column on `directus_sessions` as the discriminator. No additional scope column or JWT claim needed.

## Rationale

- Minimizes security surface: dynamically registered clients cannot access the full Directus API
- Zero schema overhead: reuses the `oauth_client` FK we already need
- Simple middleware check: one guard, one condition
- Future-proof: if we want broader OAuth scopes later, we add a `scope` column and expand the check. The restriction is
  easy to relax, but hard to tighten after the fact.

## Trade-off

The endpoint prefix and env vars stay `MCP_OAUTH_*` since the feature is genuinely MCP-scoped. This accurately
communicates intent to operators and reviewers.
