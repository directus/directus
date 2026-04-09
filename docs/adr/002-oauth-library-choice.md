# ADR-002: Build OAuth 2.1 Endpoints vs Use node-oidc-provider

## Status

Accepted

## Context

We need an OAuth 2.1 authorization server embedded in Directus to support MCP connector authentication (Anthropic
connectors / Claude). The required spec surface is narrow: authorization code + PKCE, dynamic client registration, token
refresh, token revocation, and two discovery endpoints.

We initially considered using `node-oidc-provider`, a mature, certification-grade OpenID Connect provider library.

## Options Considered

### Option A: `node-oidc-provider`

Full-featured OIDC provider library by panva (author of `jose`). Battle-tested, covers 15+ specs, certified by the
OpenID Foundation.

**Pros:**

- Handles all security-sensitive token operations correctly (timing-safe comparison, PKCE edge cases, RFC-compliant
  error responses, replay prevention)
- Battle-tested in production across many deployments
- Follows "never roll your own auth" principle

**Cons:**

- Built on Koa internally; Directus is Express. The `.callback()` bridge works but the consent/interaction flow uses Koa
  context, adding friction when building the consent UI
- Requires a storage adapter to bridge its internal model (clients, sessions, tokens, grants, interaction sessions) to
  Directus's DB schema. This adapter is non-trivial
- Its session and cookie management conflicts with Directus's existing session infrastructure
- We'd need to configure away ~90% of its features (userinfo, claims, ID tokens, device flow, session management,
  introspection, etc.) since MCP only needs authorization code + PKCE
- Adds ~50+ transitive dependencies
- Debugging auth issues means tracing through the library's abstraction layer
- The library's opinions about token storage don't align with reusing `directus_sessions`

### Option B: `@node-oauth/oauth2-server`

Lighter framework that provides the grant/token lifecycle and expects you to implement the "model" (storage, user
lookup). Middle ground between full library and building from scratch.

**Considered but not selected:** Still opinionated about token lifecycle, doesn't cover DCR or discovery, and the
adapter overhead isn't much less than node-oidc-provider while giving fewer guarantees.

### Option C: Build the endpoints directly

Implement the 5-6 required endpoints using Directus's existing infrastructure: `jsonwebtoken` for JWTs,
`crypto.randomBytes` / `nanoid` for auth codes, `crypto.createHash` for PKCE verification, `crypto.timingSafeEqual` for
token comparison.

**Pros:**

- Total control over integration with Directus's session, user, and permission model
- No adapter layer; OAuth sessions are just `directus_sessions` rows
- No conflicting session/cookie management
- ~1.5-2k lines of focused code for the full OAuth surface
- No new transitive dependencies beyond what Directus already has
- Easy to debug: the code is ours

**Cons:**

- Must get security-sensitive operations right ourselves (PKCE, timing-safe comparison, error responses)
- No third-party certification
- Mitigation: thorough test suite covering RFC spec requirements, PKCE edge cases, and error response formatting. The
  security primitives themselves (`crypto.createHash`, `crypto.timingSafeEqual`, `jsonwebtoken`) are battle-tested;
  we're orchestrating them, not inventing them.

## Decision

Use Option C. The required spec surface (authorization code + PKCE, DCR, discovery, revocation) is narrow and
well-defined. Directus already has the cryptographic primitives and session infrastructure. The integration cost of
node-oidc-provider (Koa bridge, storage adapter, fighting disabled features, conflicting sessions) exceeds the cost of
building ~1.5-2k lines of focused, testable OAuth code.

## Key Principle

"Don't roll your own auth" applies to protocols and cryptographic primitives - don't invent token formats, hash
functions, or signature schemes. It does not mean "never write an endpoint that issues a token using standard
libraries." We are orchestrating well-known standards (OAuth 2.1, RFC 7636, RFC 7591) using proven libraries
(`jsonwebtoken`, Node.js `crypto`), not inventing a protocol.
