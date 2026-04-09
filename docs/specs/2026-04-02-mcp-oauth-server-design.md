# MCP OAuth 2.1 Authorization Server

## Overview

Embed an OAuth 2.1 authorization server in Directus so that MCP clients (e.g. Anthropic connectors / Claude) can
authenticate against self-hosted Directus instances using standard OAuth 2.1 discovery and authorization code flow.
Tokens are scoped to MCP transport endpoints only.

**Related ADRs:**

- [ADR-001: Token Storage Strategy](../adr/001-oauth-server-token-storage.md)
- [ADR-002: Library Choice](../adr/002-oauth-library-choice.md)
- [ADR-003: Scope Restriction](../adr/003-oauth-scope-restriction.md)

## End-to-End Flow

1. User enters their Directus instance URL in Claude's connector UI
2. Claude makes an unauthenticated MCP request, gets `401` with
   `WWW-Authenticate: Bearer resource_metadata="<derived per RFC 9728 path insertion>"` (e.g.
   `.../.well-known/oauth-protected-resource/mcp` for root deployments)
3. Claude fetches the protected-resource metadata URL from the header, learns the authorization server URL
4. Claude fetches `/.well-known/oauth-authorization-server` (path-inserted), discovers all OAuth endpoints including
   `registration_endpoint`
5. Claude calls `POST /mcp-oauth/register` (Dynamic Client Registration, RFC 7591), gets a `client_id` back
6. Claude opens `/admin/mcp-oauth/authorize?client_id=...&code_challenge=...&...` in the user's browser
7. Directus app auth guard kicks in (login if needed), then shows consent screen
8. User approves, consent page submits form to `POST /mcp-oauth/authorize/decision`, API generates auth code
9. API issues HTTP 302 redirect to Claude's `redirect_uri` with `?code=...&state=...&iss=...` (RFC 9207)
10. Claude exchanges code for tokens at `POST /mcp-oauth/token`
11. Claude connects to `/mcp` with the access token as Bearer

## Scope of Compliance

This design implements a **public-client DCR profile** for MCP authorization. It does not claim full MCP authorization
conformance. Specifically not supported in v1: pre-registration, Client ID Metadata Documents (CIMD), confidential
clients. See "Not In Scope" section.

Known divergences:

- Confidential clients are not supported in v1. The MCP authorization spec requires support for both confidential and
  public clients (MUST). This is a known divergence.
- Client ID Metadata Documents (CIMD) are not supported. The MCP spec positions CIMD as the primary registration
  mechanism (SHOULD), with DCR as a backwards-compatibility fallback.

### Specs Implemented

- OAuth 2.1 Authorization Code + PKCE (RFC 7636)
- Resource Indicators for OAuth 2.0 (RFC 8707)
- Dynamic Client Registration (RFC 7591)
- Token Revocation (RFC 7009)
- Authorization Server Metadata (RFC 8414)
- Protected Resource Metadata (RFC 9728)
- OAuth 2.0 Authorization Server Issuer Identification (RFC 9207)
- MCP Authorization Spec (draft, as of 2026-04-02) (public-client DCR subset)

## API Endpoints

### Canonical Resource Identifier

The canonical protected resource identifier is the MCP endpoint URL: `PUBLIC_URL + /mcp` (e.g.
`https://directus.example.com/mcp`). This value is used consistently as:

- `resource` in protected-resource metadata
- `resource` parameter in authorization and token requests (RFC 8707)
- `aud` claim in issued JWTs
- Audience validation on the MCP endpoint

### Discovery

Well-known paths are derived per RFC 8414 Section 3 and RFC 9728 Section 3 using **path insertion**, not host-root. For
a resource at `https://example.com/directus/mcp`:

- Protected resource metadata: `https://example.com/.well-known/oauth-protected-resource/directus/mcp`
- AS metadata: `https://example.com/.well-known/oauth-authorization-server/directus`

For root deployments (`https://directus.example.com/mcp`):

- Protected resource metadata: `https://directus.example.com/.well-known/oauth-protected-resource/mcp`
- AS metadata: `https://directus.example.com/.well-known/oauth-authorization-server`

**`GET /.well-known/oauth-protected-resource{/path}`**

No authentication. Response: HTTP 200, Content-Type: `application/json`.

```json
{
	"resource": "https://directus.example.com/mcp",
	"authorization_servers": ["https://directus.example.com"],
	"scopes_supported": ["mcp:access"]
}
```

**`GET /.well-known/oauth-authorization-server{/path}`**

No authentication. Response: HTTP 200, Content-Type: `application/json`.

```json
{
	"issuer": "https://directus.example.com",
	"authorization_endpoint": "https://directus.example.com/admin/mcp-oauth/authorize",
	"token_endpoint": "https://directus.example.com/mcp-oauth/token",
	"registration_endpoint": "https://directus.example.com/mcp-oauth/register",
	"revocation_endpoint": "https://directus.example.com/mcp-oauth/revoke",
	"response_types_supported": ["code"],
	"response_modes_supported": ["query"],
	"grant_types_supported": ["authorization_code", "refresh_token"],
	"token_endpoint_auth_methods_supported": ["none"],
	"revocation_endpoint_auth_methods_supported": ["none"],
	"code_challenge_methods_supported": ["S256"],
	"scopes_supported": ["mcp:access"],
	"authorization_response_iss_parameter_supported": true
}
```

All values are derived from `PUBLIC_URL` env var **including any subpath**. Specifically: `issuer` and
`authorization_servers[]` include the full subpath (e.g. `https://example.com/directus`, not `https://example.com`). All
endpoint URLs are fully qualified with the subpath. This is critical for subpath deployments: MCP clients use
`authorization_servers[0]` to construct the AS metadata URL via RFC 8414 path insertion, so collapsing to origin-only
would discover the wrong metadata.

**Subpath deployment example** (for `PUBLIC_URL=https://example.com/directus`):

Protected resource metadata at `https://example.com/.well-known/oauth-protected-resource/directus/mcp`:

```json
{
	"resource": "https://example.com/directus/mcp",
	"authorization_servers": ["https://example.com/directus"],
	"scopes_supported": ["mcp:access"]
}
```

AS metadata at `https://example.com/.well-known/oauth-authorization-server/directus`:

```json
{
	"issuer": "https://example.com/directus",
	"authorization_endpoint": "https://example.com/directus/admin/mcp-oauth/authorize",
	"token_endpoint": "https://example.com/directus/mcp-oauth/token",
	"registration_endpoint": "https://example.com/directus/mcp-oauth/register",
	"revocation_endpoint": "https://example.com/directus/mcp-oauth/revoke",
	"response_types_supported": ["code"],
	"response_modes_supported": ["query"],
	"grant_types_supported": ["authorization_code", "refresh_token"],
	"token_endpoint_auth_methods_supported": ["none"],
	"revocation_endpoint_auth_methods_supported": ["none"],
	"code_challenge_methods_supported": ["S256"],
	"scopes_supported": ["mcp:access"],
	"authorization_response_iss_parameter_supported": true
}
```

### Dynamic Client Registration

**`POST /mcp-oauth/register`**

No authentication. Content-Type: `application/json`. Rate limited (dedicated pool via existing `createRateLimiter`, plus
a global registration cap of 1000 active clients).

Request:

```json
{
	"client_name": "Claude",
	"redirect_uris": ["https://claude.ai/oauth/callback"],
	"grant_types": ["authorization_code", "refresh_token"],
	"token_endpoint_auth_method": "none"
}
```

Response (HTTP **201 Created**, Content-Type: `application/json`):

```json
{
	"client_id": "generated-uuid",
	"client_name": "Claude",
	"redirect_uris": ["https://claude.ai/oauth/callback"],
	"grant_types": ["authorization_code", "refresh_token"],
	"response_types": ["code"],
	"token_endpoint_auth_method": "none",
	"client_id_issued_at": 1712000000
}
```

**Validation rules:**

- `grant_types` MUST contain `authorization_code` and optionally `refresh_token` (set comparison, order-independent).
  Reject if it contains any other grant type or is missing `authorization_code`.
- `response_types` MUST be `["code"]` if provided. Derived from grant_types if omitted. Always included in response (RFC
  7591 Section 3.2.1 requires returning all registered metadata).
- `token_endpoint_auth_method` must be `none` if provided. If omitted, defaults to `none` (deviates from RFC 7591's
  default of `client_secret_basic`). Any explicit value other than `none` is rejected with `invalid_client_metadata`.
  Response always includes `token_endpoint_auth_method: "none"` regardless of whether the client sent it.
- `redirect_uris` MUST be HTTPS. Localhost (`http://localhost`, `http://127.0.0.1`, `http://[::1]`) is allowed for
  development. No wildcard URIs. URIs with a userinfo component (`user:pass@host`) are rejected (`invalid_redirect_uri`)
  to prevent phishing via misleading authority display. No fragment components. Each URI is parsed, validated, and
  stored for exact-match comparison.
- Maximum 10 redirect URIs per client.
- `client_name` max 200 characters. Individual `redirect_uri` values max 255 characters (InnoDB UNIQUE constraint limit
  on the `directus_oauth_consents` table).
- Unknown metadata fields are silently ignored (per RFC 7591).
- Optional metadata fields (`client_uri`, `logo_uri`, `tos_uri`, `policy_uri`) are silently ignored in v1 (not stored).
  The schema does not have columns for arbitrary metadata.
- Registration access tokens (RFC 7591 Section 3.2) are not supported in v1 (clients cannot read/update their
  registration).

**Error responses** use RFC 7591 Section 3.2.2 format (which is compatible with but distinct from RFC 6749): HTTP 400
with `{ "error": "<code>", "error_description": "..." }`. Error codes: `invalid_redirect_uri`,
`invalid_client_metadata`. Note: DCR uses RFC 7591 error codes; all other `/mcp-oauth/*` endpoints use RFC 6749 error
codes (see Error Responses section below).

### Authorization

The authorization flow uses short-lived signed consent JWTs to ensure integrity without server-side state. This allows
horizontal scaling without shared storage for in-flight authorization requests.

**`POST /mcp-oauth/authorize/validate`** (API endpoint)

Authenticated via **session cookie only** (not bearer tokens). Must explicitly reject `Authorization` header
credentials. Because `/mcp-oauth/*` routes are exempt from the global OAuth guard, an MCP bearer token could otherwise
be used to hit this endpoint. Session-cookie-only auth ensures a real browser-based user interaction.

Request (Content-Type: `application/json`):

```json
{
	"client_id": "...",
	"redirect_uri": "...",
	"response_type": "code",
	"code_challenge": "...",
	"code_challenge_method": "S256",
	"state": "...",
	"scope": "mcp:access",
	"resource": "https://directus.example.com/mcp"
}
```

Validates all parameters against current DB state:

- Client exists
- `redirect_uri` exactly matches a registered URI for this client
- `code_challenge` present (missing = `invalid_request` per RFC 7636 Section 4.4.1)
- `code_challenge_method` is `S256`
- `scope` is `mcp:access` or empty (defaults to `mcp:access`, rejects other values with `invalid_scope`)
- `response_type` is `code`
- `resource` is present and matches this Directus instance's MCP endpoint URL (derived from `PUBLIC_URL` + `/mcp`).
  Required per RFC 8707 and MCP authorization spec. Must be a valid URI with https scheme, no fragment. Rejected with
  `invalid_target` if missing or mismatched.

Note: `code_verifier` is NOT present at this stage. It is only sent during token exchange (POST /mcp-oauth/token). The
authorization phase validates `code_challenge` (the hash), not the verifier.

On success, signs a short-lived consent JWT using a **derived key** to prevent token-type confusion with regular
Directus JWTs:

```typescript
const consentKey = HMAC - SHA256(SECRET, 'mcp-oauth-consent-v1'); // derived key, prevents cross-token confusion
jwt.sign(
	{
		typ: 'directus-mcp-consent+jwt', // explicit token type
		aud: 'mcp-oauth-authorize-decision', // only the decision endpoint accepts this
		sub: user_id, // user binding
		session_hash: SHA256(session_token), // session binding
		client_id,
		redirect_uri,
		code_challenge,
		code_challenge_method,
		scope,
		resource,
		state,
	},
	consentKey,
	{ expiresIn: '5m', algorithm: 'HS256' },
);
```

Domain separation: the derived key ensures no regular Directus JWT (signed with the raw SECRET) can be misused as a
consent artifact, and vice versa. The `typ` and `aud` claims provide defense-in-depth. `session_hash` binds consent to
the specific authenticated session, preventing cross-session use.

Returns:

```json
{
	"signed_params": "<consent JWT string>",
	"client_name": "Claude",
	"scope": "mcp:access",
	"already_consented": false
}
```

**Consent is never auto-skipped for dynamically registered clients.** `already_consented` is always `false` for DCR
clients. This prevents a cross-site attack where an attacker navigates the victim to the authorize URL (a top-level GET
that bypasses SameSite=Lax) and the Vue page auto-approves using the victim's session cookie. Showing the consent screen
on every authorization request ensures fresh user interaction.

**`GET /admin/mcp-oauth/authorize`** (static admin route)

This is the authorization endpoint advertised in discovery. It's a Vue app page registered as a **static route** in the
app's main router (alongside login, accept-invite, etc.), not a Directus module. Module routes go through dynamic
hydration and may require `app_access` permissions. The OAuth consent page must be reachable by any authenticated user
at a stable URL regardless of permissions. The app's existing auth guards handle login if the user isn't authenticated.
Supports HTTP GET with query parameters as required by RFC 6749 Section 3.1.

Query parameters: `client_id`, `redirect_uri`, `response_type=code`, `code_challenge`, `code_challenge_method=S256`,
`state`, `scope`, `resource`

The Vue page:

1. Calls `POST /mcp-oauth/authorize/validate` with the query parameters (XHR)
2. Receives `signed_params` (consent JWT), client info
3. Always shows consent screen (no auto-skip for DCR clients)
4. Shows consent screen: client name, requested scope, **redirect URI prominently displayed**, "unverified third-party
   application" banner, approve/deny buttons
5. On approve/deny: submits a hidden HTML form to `POST /mcp-oauth/authorize/decision` (native form submission, not
   XHR). The browser follows the server's 302 redirect directly. The authorization code never appears in JavaScript.

**`POST /mcp-oauth/authorize/decision`**

Authenticated via **session cookie only** (same as validate - rejects bearer tokens). Called by the Vue consent page via
native form submission (not XHR). Content-Type: `application/x-www-form-urlencoded`.

Form fields: `signed_params` (the consent JWT from validate), `approved` (boolean)

Processing:

1. Reject duplicate form fields as `invalid_request` (Express parses duplicates as arrays)
2. Verify the consent JWT using the same derived key (`HMAC-SHA256(SECRET, "mcp-oauth-consent-v1")`). Verify
   `algorithms: ['HS256']`, `audience: 'mcp-oauth-authorize-decision'`. On failure: redirect to
   `/admin/mcp-oauth/authorize?error=invalid_signature` (cannot trust `redirect_uri`)
3. Verify `typ === 'directus-mcp-consent+jwt'` (prevents cross-token confusion with regular Directus JWTs)
4. Verify `sub === authenticated user_id` (prevents cross-user use)
5. Verify `session_hash === SHA256(current session token)` (prevents cross-session use)
6. Re-validates parameters from JWT claims against current DB state (prevents stale client registrations). JWT signature
   prevents tampering; re-validation prevents staleness. Both checks are required.

**Response is always HTTP 302 redirect.** The authorization code never appears in a JSON response body, eliminating
exposure to same-origin JavaScript (XSS, browser extensions). The 302 response MUST include
`Referrer-Policy: no-referrer` to prevent the authorization code from leaking via the Referer header if the callback
page loads external resources.

On approval:

- Generates auth code (`crypto.randomBytes`). Only the SHA256 hash is stored; the raw code is returned to the client via
  redirect and never persisted.
- Stores `code_hash = SHA256(raw_code)` in `directus_oauth_codes` with PKCE challenge, user, client, redirect_uri,
  resource, TTL from `MCP_OAUTH_AUTH_CODE_TTL`
- Creates/updates consent record in `directus_oauth_consents`
- Constructs redirect URL using proper URL parsing (not string concatenation). Appends `code`, `state`, and `iss`
  (authorization server issuer identifier, per RFC 9207) as query parameters to the `redirect_uri`, preserving any
  existing query parameters.
- HTTP 302 redirect to the constructed URL

On denial:

- Constructs redirect URL appending `error=access_denied`, `state`, and `iss` (authorization server issuer identifier,
  per RFC 9207) as query parameters.
- HTTP 302 redirect to the constructed URL

**Security properties of the consent JWT approach:**

- Stateless: no server-side storage needed, works across horizontally scaled instances
- Tamper-proof: JWT signature prevents forging modified parameters
- User-bound: `sub` claim binds to user_id, preventing cross-user use
- Session-bound: `session_hash` claim binds to the specific browser session
- Time-limited: 5-minute `exp` claim, enforced by `jwt.verify()`
- Domain-separated: derived key (`HMAC(SECRET, "mcp-oauth-consent-v1")`) prevents token-type confusion with regular
  Directus JWTs. `typ` and `aud` claims provide defense-in-depth
- `state` and `resource` are included as JWT claims to protect redirect integrity and audience binding

**Known limitation:** XSS forced consent. A malicious script with same-origin access can read the signed_params from the
validate response and submit the decision form with the original (untampered) parameters. The consent JWT prevents
parameter substitution but not forced consent. However, the authorization code is never exposed to JavaScript (the
server-side 302 redirect sends it directly to the callback URL), so the attacker cannot intercept it. The attacker would
also need the PKCE `code_verifier` (held by the MCP client, not the browser) to exchange the code. This is inherent to
all browser-based OAuth consent flows; an attacker with XSS already has full access to the user's Directus session.

### Token

**`POST /mcp-oauth/token`**

Request Content-Type: `application/x-www-form-urlencoded`. Rate limited (dedicated pool).

Response Content-Type: `application/json`. Response headers MUST include `Cache-Control: no-store` and
`Pragma: no-cache` per RFC 6749 Section 5.1.

**Grant type validation** (before grant-specific logic):

If `grant_type` is missing, return `invalid_request`. If present but not `authorization_code` or `refresh_token`, return
`unsupported_grant_type`. `client_id` is REQUIRED for all grant types (public client identification per RFC 6749 Section
4.1.3); missing `client_id` returns `invalid_request`.

**Authorization code exchange** (`grant_type=authorization_code`):

Parameters: `code`, `client_id`, `code_verifier`, `redirect_uri`, `resource`

1. Validate `code_verifier` format (43-128 chars, unreserved charset `[A-Za-z0-9\-._~]`). This is request-syntax
   validation (`invalid_request`), not grant-logic, so it runs before code lookup.
2. Look up code in `directus_oauth_codes` by `code_hash = SHA256(presented_code)`. Raw codes are never stored; only
   their SHA256 hash. If not found, return `invalid_grant`. (Code replay after cleanup is **not** used to trigger grant
   revocation. In a public-client profile, `client_id` is public knowledge, so any party with a leaked code string could
   replay it to DoS the grant. PKCE prevents unauthorized code exchange, making replay revocation unnecessary. The
   `code_hash` on `directus_oauth_tokens` is retained for audit/logging only.)
3. If code is already marked `used`: return `invalid_grant`. Log the replay attempt with client and code details
   server-side for security monitoring. Do **not** revoke grants. (Same rationale: PKCE is the protection mechanism for
   public clients, not replay revocation. Grant revocation on replay is appropriate for confidential clients where
   `client_secret` authenticates the request; it is a DoS vector for public clients.)
4. Verify not expired
5. Verify `client_id` matches
6. Verify `redirect_uri` exact match
7. Verify `resource` matches the value stored on the code (per RFC 8707). Mismatch returns `invalid_target`.
8. PKCE: `BASE64URL(SHA256(code_verifier)) === code_challenge` (S256 only)
9. **Within a single database transaction:** atomically mark the code as used
   (`UPDATE directus_oauth_codes SET used = true, used_at = NOW() WHERE id = ? AND used = false`; check affected rows;
   if 0, a concurrent request already consumed this code, rollback and return `invalid_grant`), check client's
   `grant_types`, create `directus_sessions` row with `oauth_client` set, create `directus_oauth_tokens` row with
   client, user, resource, `code_hash = SHA256(code)`, scope. The code burn is inside the transaction so that if the
   transaction rolls back, the code remains usable and the client can retry.
10. Issue JWT with:
    - `iss: 'directus'` (same as regular Directus JWTs, to remain compatible with `isDirectusJWT()` and
      `verifyAccessJWT()` which hard-code this value). The AS metadata `issuer` (PUBLIC_URL) identifies the
      authorization server for discovery; the JWT `iss` identifies the token signer. These serve different purposes per
      RFC 8414 vs RFC 7519. OAuth tokens are distinguished by `scope`, `aud`, and `oauth_client` on the session, not by
      `iss`.
    - `session` claim (for session-backed validation)
    - `scope: "mcp:access"` claim
    - `aud` claim set to the `resource` value (audience-binds the token to the MCP endpoint per RFC 8707)
11. Return:

```json
{
	"access_token": "eyJ...",
	"token_type": "Bearer",
	"expires_in": 900,
	"refresh_token": "session-token-value",
	"scope": "mcp:access"
}
```

`refresh_token` is omitted from the response if the client did not register with `grant_types` including
`refresh_token`.

**Validation-then-burn ordering**: all checks happen before the code is marked used. If validation fails (wrong client,
wrong redirect, PKCE mismatch), the code remains available for the legitimate client. Only after everything passes is
the code consumed atomically. This prevents a DoS where an attacker with a leaked code burns it before the legitimate
client can use it.

**Token endpoint error responses** use a uniform `invalid_grant` for all code-related failures (expired, not found,
already used, PKCE mismatch, client mismatch, redirect mismatch). Specific reason is logged server-side only. This
prevents information leakage to attackers probing the endpoint.

**Refresh** (`grant_type=refresh_token`):

Parameters: `refresh_token`, `client_id`, `resource` (required, must match the grant's stored resource; returns
`invalid_target` if absent or mismatched), `scope` (optional)

OAuth refresh does **not** use Directus's `next_token` grace period mechanism. Public OAuth clients require strict
rotation with reuse detection (RFC 9700). The `directus_oauth_tokens` record is the token family.

1. Verify client's `grant_types` includes `refresh_token`. Reject with `unauthorized_client` if not.
2. If `scope` is present, validate it is exactly `mcp:access` (or empty). Reject with `invalid_scope` if broader or
   different. If omitted, inherit from grant.
3. Look up `directus_oauth_tokens` where `session` matches the presented `refresh_token`.
4. **If no match**: check `previous_session`. If it matches, this is **token reuse** (the token was already rotated).
   Revoke the entire grant: delete the `oauth_tokens` record and its current session. Return `invalid_grant`. This kills
   both the attacker's and the legitimate client's sessions.
5. **If no match on either column**: Re-read the grant row. If the presented token matches `previous_session`, this is
   reuse -- revoke the grant. If neither column matches, the token is genuinely unknown; return `invalid_grant`.
6. Verify `client` matches `client_id`
7. Verify `resource` matches the grant's stored `resource`. Return `invalid_target` if absent or mismatched. (Required
   per MCP auth profile; omission is not tolerated.)
8. Verify session not expired
9. **Within a single database transaction:** rotate the grant pointer, create the new session, delete the old session,
   and slide the grant TTL. Specifically: a.
   `UPDATE directus_oauth_tokens SET previous_session = session, session = :new_token, expires_at = NOW() + MCP_OAUTH_REFRESH_TOKEN_TTL WHERE session = :presented_token`.
   Check affected rows. If 0, a concurrent refresh already consumed this token; rollback and return `invalid_grant`. b.
   Insert new `directus_sessions` row with `oauth_client` set. c. Delete old session row. All three operations are in
   one transaction. A crash at any point rolls back cleanly: the grant still points at the old session, and the client
   can retry. This prevents the failure mode where the grant pointer is updated but the new session row doesn't exist,
   which would cause the next legitimate retry to look like reuse and self-revoke. The grant `expires_at` slides on each
   successful refresh (sliding window).
10. Issue new JWT with `session` claim, `scope: "mcp:access"`, and `aud` set to the grant's stored `resource` value. The
    audience binding is preserved for the lifetime of the grant.
11. Return new access token + new refresh token (= new session token). Response MUST include `scope: "mcp:access"` (per
    RFC 6749 Section 5.1, scope is required when it differs from what was requested or was granted by default).

**Reuse detection**: if an attacker steals a refresh token and uses it before the legitimate client, the attacker gets
new tokens. When the legitimate client presents the old (now-rotated) token, step 4 detects reuse via `previous_session`
and revokes the entire grant. Both parties must re-authenticate.

### Revocation

**`POST /mcp-oauth/revoke`**

Content-Type: `application/x-www-form-urlencoded`

Parameters: `token`, `client_id`, `token_type_hint` (optional, ignored in v1)

Revocation is **grant-level**, not session-level. The `directus_oauth_tokens` record is the grant family.
**Refresh-token revocation only.** Access-token revocation is not supported in v1.

- If `client_id` is not a registered client, return `invalid_client`.
- Look up `directus_oauth_tokens` where `session` matches the presented `token`. Do NOT check `previous_session` -- it
  is used exclusively for reuse detection during refresh. Accepting stale rotated tokens as revocation handles would let
  anyone with a one-generation-old token kill the active grant. If `client` doesn't match `client_id`, return HTTP 200
  with empty body (per RFC 7009 Section 2.1 - treat as "not revocable by this client"). Only return `invalid_client`
  when the `client_id` itself is unregistered. If client matches, delete the `oauth_tokens` record AND the current
  session. This revokes the entire grant family per RFC 7009 Section 2.1.
- Unknown or already-invalid tokens return HTTP 200 with empty body (per RFC 7009 Section 2.2).

**Why no access-token revocation:** Accepting a JWT for revocation requires verifying its signature first; decoding
without verification lets a forged JWT with a known session value revoke a live grant. Verifying an expired JWT
(required since revocation targets unwanted tokens) adds complexity for minimal benefit: access tokens are short-lived
(15m default), and revoking the refresh token already kills the entire grant family. RFC 7009 does not require both.

### Error Responses

All `/mcp-oauth/*` API endpoints return errors in RFC 6749 format, NOT Directus format. A dedicated error handler on the
OAuth router catches errors and formats them before the global Directus error handler:

```json
{
	"error": "invalid_grant",
	"error_description": "Authorization code has expired"
}
```

Standard error codes: `invalid_request`, `invalid_client`, `invalid_grant`, `unauthorized_client`,
`unsupported_grant_type`, `unsupported_response_type`, `invalid_scope`, `invalid_target` (RFC 8707), `access_denied`,
`server_error`, `temporarily_unavailable`.

Authorization front-channel errors use the specific code that applies (e.g. `invalid_scope` not `invalid_request`) when
the redirect URI is trusted. `server_error` and `temporarily_unavailable` are returned as redirects when a trusted
redirect URI is available but the server fails internally.

## MCP Endpoint Guard

**The `/mcp` endpoint supports dual authentication.** Regular Directus sessions (cookie, static token, standard JWT)
continue to work exactly as before. OAuth-issued sessions (from the MCP OAuth flow) are subject to the additional
restrictions below. The guards are scoped to sessions where `oauth_client IS NOT NULL`; sessions without it are
unaffected.

OAuth tokens are restricted to `/mcp/*` endpoints via multiple complementary mechanisms (defense-in-depth):

1. **Audience validation (RFC 8707)**: For OAuth-issued sessions only (`accountability.oauth_client` is set), the MCP
   endpoint validates the JWT `aud` claim matches its own canonical URL (derived from `PUBLIC_URL` + `/mcp`). Tokens
   issued for a different resource are rejected with 401. Regular Directus sessions (no `oauth_client`) bypass audience
   validation and continue accessing `/mcp` as before. This is the primary OAuth restriction per MCP authorization spec.

2. **JWT claim + accountability**: OAuth-issued JWTs include `scope: "mcp:access"` and `aud`. The `Accountability` type
   is extended with `oauth_client?: string`. During `getAccountabilityForToken`, if a session has `oauth_client` set,
   it's populated on the accountability object. This requires a small refactor: current `verifySessionJWT` only does
   `select(1)`, so either it needs to also select `oauth_client`, or a follow-up query is needed in
   `getAccountabilityForToken`. A middleware guard on non-MCP HTTP routes rejects requests where
   `req.accountability.oauth_client` is set (returns 403).

3. **WebSocket guard**: The WebSocket authentication handler (`api/src/websocket/authenticate.ts`) must also check
   `accountability.oauth_client` after authenticating a bearer token. If set, reject the connection. This covers both
   the `access_token` path (line ~63) and the `refresh_token` path (blocked by #4 below).

4. **Session isolation**: `AuthenticationService.refresh()` adds `.andWhere('s.oauth_client', null)` to the **initial
   SELECT query** (line 344 in current code). This is the single-point fix that blocks all three refresh entry points
   (REST, GraphQL, WebSocket) from processing OAuth sessions. Without this, the WebSocket refresh path (which calls
   `refresh()` without `session: true`) would produce a JWT without a `session` claim, bypassing both session validation
   and the MCP guard entirely.

5. **`/auth/logout` isolation**: `AuthenticationService.logout()` must gate the **initial SELECT** (not just the DELETE)
   with `.andWhere('oauth_client', null)`. The current code does a select, calls `provider.logout()`, logs activity,
   then deletes. If only the DELETE is gated, the provider logout hook and activity logging still execute for OAuth
   sessions. The select should return no record for OAuth sessions, causing the method to exit early.

### MCP 401 Discovery Trigger

The MCP transport endpoint (`/mcp`) must return `401` with a `WWW-Authenticate` header per RFC 6750. The
`resource_metadata` URL is derived from the canonical resource identifier using RFC 9728 path insertion (e.g.
`https://directus.example.com/.well-known/oauth-protected-resource/mcp`).

Two 401 variants (per RFC 6750 Section 3):

- **Missing credentials** (no Authorization header): bare challenge with discovery info:
  `WWW-Authenticate: Bearer resource_metadata="<url>", scope="mcp:access"`
- **Invalid/expired/wrong-audience token**: include error:
  `WWW-Authenticate: Bearer resource_metadata="<url>", scope="mcp:access", error="invalid_token"`
- **Insufficient scope** (valid OAuth token but wrong/missing scope): `403 Forbidden` with
  `WWW-Authenticate: Bearer resource_metadata="<url>", scope="mcp:access", error="insufficient_scope"`. This covers the
  case where a valid OAuth-issued token lacks the `mcp:access` scope claim. Required per MCP authorization spec.

**Two distinct code paths produce the 401 variants:**

- **Invalid/expired token**: The `authenticate` middleware throws before the MCP router is reached. The global auth
  middleware must catch authentication errors for `/mcp` routes and return the `invalid_token` 401 variant instead of
  the default Directus error.
- **Missing credentials** (no token at all): `authenticate` does NOT throw. It sets default (public) accountability and
  the request reaches the MCP controller, which currently returns 403. The MCP controller must detect unauthenticated
  requests (no user, no role, not admin) and return the bare 401 challenge with discovery info instead of 403. This is
  the MCP discovery entry point: MCP clients make an unauthenticated request, receive the 401, and use the
  `resource_metadata` URL to begin the OAuth flow.

Existing non-OAuth MCP access (regular Directus sessions, static tokens) continues to work. The 401 is only returned
when no valid credentials are present at all.

### Authorization Front-Channel Error Handling

When the Vue authorization page calls `POST /mcp-oauth/authorize/validate` and validation fails, the error behavior
depends on which parameter is invalid:

- **Invalid `client_id` or invalid/missing `redirect_uri`** (can't trust the redirect target): return an error to the
  Vue page which renders a local error screen. MUST NOT redirect.
- **Duplicate parameters**: reject with `invalid_request` before semantic validation. Express parses duplicate query
  parameters as arrays, which would bypass type expectations in downstream validation.
- **Other validation failures** (redirect URI is trusted): redirect with the specific error code and `state` (REQUIRED
  per RFC 6749 Section 4.1.2.1 when `state` was present in the request). Also include `iss` per RFC 9207:
  - Bad `response_type` -> `unsupported_response_type`
  - Missing/invalid `code_challenge` -> `invalid_request` (RFC 7636 Section 4.4.1)
  - Invalid `scope` -> `invalid_scope`
  - Missing/invalid `resource` -> `invalid_target` (RFC 8707)
  - Server failure during code issuance -> `server_error`
  - Temporary unavailability -> `temporarily_unavailable` Always use the specific error code, never collapse to
    `invalid_request` (per RFC 6749 Section 4.1.2.1).

### Deployment Constraints

The authorization endpoint at `/admin/mcp-oauth/authorize` requires `SERVE_APP=true` (the default). API-only deployments
or custom admin paths are not supported in v1. The consent flow depends on the Vue app's auth guards and routing.

## Database Schema

### New table: `directus_oauth_clients`

| Column                       | Type              | Notes                                                      |
| ---------------------------- | ----------------- | ---------------------------------------------------------- |
| `client_id`                  | uuid              | PK and public identifier (single column)                   |
| `client_name`                | string(200)       | display name, max 200 chars                                |
| `redirect_uris`              | json              | array of allowed redirect URIs, max 10 entries             |
| `grant_types`                | json              | array, e.g. `["authorization_code", "refresh_token"]`      |
| `client_secret`              | string, nullable  | hashed, for confidential clients                           |
| `client_secret_expires_at`   | integer, nullable | 0 = non-expiring (required by RFC 7591 when secret issued) |
| `token_endpoint_auth_method` | string            | `none` (only value accepted in v1)                         |
| `date_created`               | timestamp         |                                                            |

### New table: `directus_oauth_codes`

| Column                  | Type                | Notes                                                      |
| ----------------------- | ------------------- | ---------------------------------------------------------- |
| `id`                    | uuid                | PK                                                         |
| `code_hash`             | string(64)          | SHA256 of raw code. Raw code never stored. Unique, indexed |
| `client`                | uuid, FK            | references `directus_oauth_clients.client_id`, CASCADE     |
| `user`                  | uuid, FK            | references `directus_users.id`, CASCADE                    |
| `redirect_uri`          | string(255)         | exact URI used in this request                             |
| `resource`              | string              | RFC 8707 resource indicator (MCP endpoint URL)             |
| `code_challenge`        | string(128)         | PKCE S256 challenge (43 chars, with margin)                |
| `code_challenge_method` | string(10)          | always `S256`                                              |
| `scope`                 | string, nullable    |                                                            |
| `expires_at`            | timestamp           | TTL 60s hardcoded (RFC max is 10 min)                      |
| `used`                  | boolean             | default false, single-use enforcement                      |
| `used_at`               | timestamp, nullable | set when code is exchanged, enables time-based cleanup     |

### New table: `directus_oauth_consents`

| Column         | Type             | Notes                                                  |
| -------------- | ---------------- | ------------------------------------------------------ |
| `id`           | uuid             | PK                                                     |
| `user`         | uuid, FK         | references `directus_users.id`, CASCADE                |
| `client`       | uuid, FK         | references `directus_oauth_clients.client_id`, CASCADE |
| `redirect_uri` | string(255)      | the specific redirect URI the user approved            |
| `scope`        | string, nullable |                                                        |
| `date_created` | timestamp        |                                                        |
| `date_updated` | timestamp        |                                                        |

Unique constraint on `(user, client, redirect_uri)`. Consent is granted per redirect URI so that a client with multiple
registered URIs cannot silently redirect to a different one than the user reviewed.

### New table: `directus_oauth_tokens`

The durable grant record. Lives independently of session rotation. One row per active OAuth grant.

| Column             | Type                 | Notes                                                                                  |
| ------------------ | -------------------- | -------------------------------------------------------------------------------------- |
| `id`               | uuid                 | PK                                                                                     |
| `client`           | uuid, FK             | references `directus_oauth_clients.client_id`, CASCADE                                 |
| `user`             | uuid, FK             | references `directus_users.id`, CASCADE                                                |
| `session`          | string(64)           | plain column (NOT FK). Current session token                                           |
| `previous_session` | string(64), nullable | the session token that was rotated away. For reuse detection                           |
| `resource`         | string               | RFC 8707 resource URI. Audience binding for the grant                                  |
| `code_hash`        | string(64)           | SHA256 hash of the raw authorization code string. For audit/logging after code cleanup |
| `scope`            | string, nullable     | granted scope (`mcp:access`)                                                           |
| `expires_at`       | timestamp            | set from `MCP_OAUTH_REFRESH_TOKEN_TTL` at grant creation. Used for cleanup             |
| `date_created`     | timestamp            |                                                                                        |

UNIQUE constraint on `(client, user)`. On code exchange, if a grant already exists for this (client, user), delete the
old grant and its session, then insert the new one within the same transaction. Do not use database-level upsert
(`ON CONFLICT ... DO UPDATE`) as it is not portable across MySQL/MSSQL/Oracle.

**Why `code_hash`, not a code UUID.** Code rows are cleaned up after 1 hour, but grants live up to 7 days. If we stored
the code's UUID, we couldn't map a replayed raw code string back to the grant after cleanup. By storing
`SHA256(raw_code_string)`, a replay attempt can be correlated to its grant for audit logging: compute
`SHA256(presented_code)`, look up `oauth_tokens WHERE code_hash = hash`. (Code replay does not trigger grant revocation
for public clients; see Token section for rationale.)

**`session` and `previous_session` are plain columns, not FKs.** Session tokens rotate, and FKs would cause
cascade-delete of the grant when old session rows are cleaned up. Instead, the application manages the pointer:

- On refresh: `previous_session = session`, `session = new_token`, old session row deleted immediately
- On reuse detection: if a presented token matches `previous_session`, the grant is compromised. Delete the
  `oauth_tokens` record and its current session (family-wide revocation per RFC 9700).
- `previous_session` is overwritten on the next successful refresh with the next rotated-away value.
- The `oauth_tokens` lookup happens only at refresh/revocation time. Per-request enforcement uses JWT claims.

### Modified table: `directus_sessions`

One new nullable column:

| Column         | Type               | Notes                                                                  |
| -------------- | ------------------ | ---------------------------------------------------------------------- |
| `oauth_client` | uuid, FK, nullable | references `directus_oauth_clients.client_id`, CASCADE. Null = regular |

Existing sessions are unaffected (`oauth_client` is null). This is a fast discriminator only. All OAuth grant state
lives in `directus_oauth_tokens`.

**Why one column on sessions:** enables the global post-authenticate guard to cheaply reject OAuth tokens on non-MCP
routes without joining another table. Also enables cascade cleanup when a client is deleted. The pattern is established
by `directus_sessions.share` (FK to `directus_shares`, CASCADE).

**Cascade behavior**: deleting a client CASCADEs to its sessions (via `oauth_client` FK), oauth_tokens (via `client`
FK), codes, and consents. This ensures revoking a client immediately invalidates all its tokens.

### Modified type: `Accountability`

Add `oauth_client?: string` to `Accountability` in `packages/types/src/accountability.ts`. Populated during
`getAccountabilityForToken`. Requires refactoring `verifySessionJWT` to `select('oauth_client')` instead of `select(1)`,
returning the value so `getAccountabilityForToken` can populate it without a second query.

### Modified type: `DirectusTokenPayload`

Add `scope?: string` to `DirectusTokenPayload`. OAuth tokens include `scope: "mcp:access"`.

## Configuration

| Env var                       | Default | Description                                                        |
| ----------------------------- | ------- | ------------------------------------------------------------------ |
| `MCP_OAUTH_ENABLED`           | `false` | Feature flag. Nothing mounts if disabled                           |
| `MCP_OAUTH_ACCESS_TOKEN_TTL`  | `15m`   | JWT access token lifetime (returned as `expires_in`)               |
| `MCP_OAUTH_REFRESH_TOKEN_TTL` | `7d`    | Refresh token / session lifetime                                   |
| `MCP_OAUTH_AUTH_CODE_TTL`     | `60s`   | Authorization code lifetime (RFC 6749 Section 4.1.2 max is 10 min) |

OAuth session creation uses `MCP_OAUTH_REFRESH_TOKEN_TTL` as the session expiry, not `REFRESH_TOKEN_TTL`. Both grant
`expires_at` and session expiry must be synchronized.

`MCP_OAUTH_CONSENT_SKIP` was removed. DCR clients always show the consent screen to prevent cross-site code minting
attacks. Consent auto-skip may be reintroduced in a future version with a trusted-client allowlist (admin-managed, not
DCR-registered).

`MCP_OAUTH_ENABLED` requires `MCP_ENABLED=true`. Startup logs a warning and disables OAuth if MCP is off.

Discovery URLs are derived from `PUBLIC_URL`. Rate limiting for DCR and the token endpoint uses the existing rate
limiter infrastructure with dedicated pools.

## CORS Policy

Per-endpoint CORS configuration:

- `/.well-known/*`: `Access-Control-Allow-Origin: *` (public info, no credentials)
- `/mcp-oauth/register`: `Access-Control-Allow-Origin: *` (no credentials)
- `/mcp-oauth/token`: `Access-Control-Allow-Origin: *` (no credentials, code+PKCE required)
- `/mcp-oauth/revoke`: `Access-Control-Allow-Origin: *` (no credentials)
- `/mcp-oauth/authorize/validate`: **Same-origin only** (uses session cookie)
- `/mcp-oauth/authorize/decision`: **Same-origin only** (uses session cookie)

The validate and decision endpoints MUST NOT allow cross-origin requests with credentials. This prevents a malicious
website from triggering consent approval using the user's Directus session cookie.

**CSRF protection**: CORS alone does not prevent CSRF (simple POST requests bypass preflight). The validate and decision
endpoints must additionally enforce `Origin` header validation: reject requests where the `Origin` header is absent or
does not match the Directus instance's own origin. The session cookie should use `SameSite=Lax` (Directus default) which
blocks cross-site POST requests in modern browsers, but `Origin` validation provides defense for older browsers and
non-standard configurations.

`WWW-Authenticate` header on `/mcp` 401 responses must be exposed via `Access-Control-Expose-Headers`.

## Security Considerations

- **PKCE required**: all authorization requests must include `code_challenge` with method `S256`. Missing
  `code_challenge` returns `invalid_request` (RFC 7636 Section 4.4.1). `plain` method rejected.
- **Redirect URI exact match**: authorization requests are validated against registered URIs (exact string comparison).
  HTTPS required except for localhost development (`http://localhost`, `http://127.0.0.1`, `http://[::1]`).
- **DCR validation**: only accepts `grant_types=["authorization_code"]` or `["authorization_code", "refresh_token"]`,
  `token_endpoint_auth_method="none"`, `response_types=["code"]`. Rejects everything else. `client_name` sanitized
  against HTML/Unicode homoglyphs.
- **DCR rate limiting**: per-IP rate limiting + global cap (1000 active clients). Max 10 redirect URIs per client,
  string length limits enforced.
- **Token endpoint rate limiting**: rate-limited to prevent brute-force attacks on authorization codes.
- **Atomic code exchange**: single-use enforcement via `UPDATE ... WHERE used = false` with affected-row check. Prevents
  race conditions where concurrent requests both exchange the same code.
- **Code reuse logging (not revocation)**: reused auth codes are logged for security monitoring but do NOT trigger grant
  revocation. In a public-client profile, `client_id` is public knowledge, so replay revocation would be a DoS vector.
  PKCE prevents unauthorized code exchange, making replay revocation unnecessary for public clients.
- **Uniform error responses**: token endpoint returns `invalid_grant` for all code failures. Specific reason logged
  server-side only.
- **Token audience binding (RFC 8707)**: OAuth JWTs include `aud` claim set to the MCP endpoint URL. The MCP endpoint
  validates the audience matches itself **for OAuth-issued sessions only** (regular Directus sessions bypass aud
  validation). Non-MCP routes reject tokens with `oauth_client` on the accountability. Defense-in-depth: audience claim
  - scope claim + session column + middleware.
- **Issuer identification (RFC 9207)**: authorization responses include `iss` parameter identifying the authorization
  server. Prevents mix-up attacks for MCP clients interacting with multiple Directus instances.
- **Server-side authorization redirect**: the decision endpoint issues HTTP 302 directly instead of returning the
  authorization code in a JSON response body. The code never appears in JavaScript memory, eliminating exposure to
  same-origin XSS or browser extensions.
- **Redirect URI userinfo rejection**: redirect URIs containing userinfo components (`user:pass@host`) are rejected
  during DCR to prevent phishing via misleading authority display.
- **Refresh-token-only revocation**: access-token revocation is not supported. This avoids the risk of unverified JWT
  claims being used to revoke live grants. The refresh token (= session token) is the revocation handle.
- **Authorization parameter integrity**: Consent JWTs signed with a derived key prevent tampering between consent render
  and approval. User-bound (`sub`), session-bound (`session_hash`), time-limited (5 min `exp`), domain-separated
  (`typ` + `aud` + derived key prevent cross-token confusion with regular Directus JWTs). Re-validation against current
  DB state on the decision endpoint catches stale registrations. See Authorization section for details.
- **Timing-safe comparison**: PKCE verification (`BASE64URL(SHA256(code_verifier)) === code_challenge`) uses
  `crypto.timingSafeEqual`. Token/session lookups use SQL `WHERE` clauses (timing-safe comparison is not applicable to
  database queries). Consent verification uses `jwt.verify()` with a derived key (signature comparison handled
  internally by the JWT library).
- **Session isolation**: `AuthenticationService.refresh()` rejects OAuth sessions on the initial SELECT (single-point
  fix covering REST, GraphQL, and WebSocket paths). `AuthenticationService.logout()` gates the initial SELECT (not just
  the delete) to reject OAuth sessions early.
- **Strict refresh token rotation (RFC 9700)**: OAuth refresh does NOT use Directus's `next_token` grace period. The
  grant pointer update, new session creation, and old session deletion happen in a single database transaction. A crash
  at any point rolls back cleanly, preventing self-revocation. The `directus_oauth_tokens` record tracks `session` and
  `previous_session`. If a rotated-away token is presented, the entire grant is revoked (family-wide). This detects
  token theft: if an attacker uses a stolen refresh token, the legitimate client's next refresh triggers revocation of
  both sessions.
- **Grant state isolation**: OAuth grant state (resource, scope, code lineage) lives in `directus_oauth_tokens`, not on
  session rows. The `oauth_tokens` record is the token family. This eliminates copy-on-rotate fragility and provides a
  natural anchor for family-wide revocation.
- **Client deletion cascade**: deleting a client immediately revokes all its sessions, codes, and consents via FK
  CASCADE.
- **Consent screen**: displays redirect URI prominently and "unverified third-party application" banner to mitigate
  client name phishing via DCR.
- **CORS**: per-endpoint policy. Cookie-bearing endpoints (validate, decision) are same-origin only. Public endpoints
  allow `*`. See CORS Policy section.
- **Cleanup**: expired unused auth codes are deleted immediately. Used codes (where `used_at` is set) are retained for 1
  hour after `used_at` for audit correlation, then deleted. Expired grants
  (`directus_oauth_tokens WHERE expires_at < NOW()`) are cleaned up periodically, piggybacking on existing session
  cleanup. Since `session` is a plain column (not FK), grant cleanup must also delete the associated session row.
  Orphaned client registrations (no sessions or consents for 24 hours) are cleaned up periodically.
- **Activity logging**: OAuth token lifecycle events (issuance, refresh, revocation) are logged as activity records for
  audit purposes. Activity records store denormalized copies of key fields (user, client_id, client_name, scope,
  resource, action) so they remain meaningful after grant rows are cleaned up.

## Existing Code Modifications Required

These changes to existing Directus code are required for secure integration:

1. **`api/src/services/authentication.ts` line ~344**: Add `.andWhere('s.oauth_client', null)` to the initial SELECT in
   `refresh()`. This single change blocks all three refresh entry points (REST, GraphQL, WebSocket). OAuth refresh is
   handled entirely by the new `McpOAuthService`, not by `AuthenticationService`.

2. **`api/src/services/authentication.ts` `logout()`**: Add `.andWhere('oauth_client', null)` to the **initial SELECT**
   (not just the delete). Gating the select causes early exit for OAuth sessions. Note: `updateStatefulSession()` does
   NOT need modification. OAuth refresh bypasses it entirely.
3. **`api/src/utils/verify-session-jwt.ts`**: Refactor to `select('oauth_client')` instead of `select(1)`, return the
   value so `getAccountabilityForToken` can populate `accountability.oauth_client` without a second query.

4. **`api/src/utils/get-accountability-for-token.ts`**: Populate `accountability.oauth_client` from the refactored
   `verifySessionJWT` return value.

5. **`api/src/websocket/authenticate.ts`**: After authenticating a bearer token (line ~63), check
   `accountability.oauth_client`. If set, reject the WebSocket connection.

6. **`/mcp` auth special-casing**: Two changes. (a) In the global auth middleware, when a request to `/mcp` fails
   authentication (invalid/expired token), return `401` + `WWW-Authenticate` with `error="invalid_token"` instead of the
   default error. (b) In the MCP controller, when the request has no valid credentials (no user, no role, not admin),
   return `401` + `WWW-Authenticate` with discovery info instead of 403. This is the MCP first-contact discovery entry
   point. Audience validation (`aud` claim check) applies **only to OAuth-issued sessions**
   (`accountability.oauth_client` is set). Regular Directus sessions access `/mcp` without audience validation. For
   OAuth sessions on `/mcp`, additionally reject tokens sourced from the query string (`access_token` query param): the
   MCP spec requires header-only bearer. Regular Directus sessions are not restricted by token source.

7. **Global post-authenticate guard** (`api/src/app.ts`): Mount after `authenticate`. Reject requests where
   `req.accountability.oauth_client` is set, unless the route is `/mcp/*`, `/mcp-oauth/token`, `/mcp-oauth/register`, or
   `/mcp-oauth/revoke`. The consent endpoints (`/mcp-oauth/authorize/validate` and `/mcp-oauth/authorize/decision`) are
   NOT exempted because they require cookie auth and an OAuth bearer token hitting them should be rejected. Must cover
   REST, GraphQL, and extension endpoints.

8. **Consent endpoint auth restriction**: `/mcp-oauth/authorize/validate` and `/mcp-oauth/authorize/decision` must
   require session-cookie-only authentication. Reject requests where `req.token` was sourced from the `Authorization`
   header OR the `access_token` query parameter. `extract-token.ts` sets `req.token` from query params (line 19) before
   any route handler runs, so route-level "reject Authorization header" is insufficient. The consent endpoints must
   verify the token came from the session cookie path specifically. This prevents both MCP OAuth bearer tokens and
   query-string tokens from being used to trigger consent programmatically.

9. **`packages/types/src/accountability.ts`**: Add `oauth_client?: string` to `Accountability` type.

10. **`api/src/types/auth.ts`**: Add `scope?: string` and `aud?: string` to `DirectusTokenPayload`.

11. **Token source tracking** (`api/src/middleware/extract-token.ts`, `api/src/types/express.d.ts`): Add
    `tokenSource: 'cookie' | 'header' | 'query' | null` to `Express.Request`. Populate in `extractToken`. Consent
    endpoints check `req.tokenSource === 'cookie'`.

12. **Mount unauthenticated OAuth endpoints before `authenticate`** (`api/src/app.ts`): `.well-known` discovery routes
    and `/mcp-oauth/register`, `/mcp-oauth/token`, `/mcp-oauth/revoke` must be mounted before `app.use(authenticate)`,
    similar to `/server/ping`. These routes call `getSchema()` directly (no `req.schema`). Only
    `/mcp-oauth/authorize/validate` and `/mcp-oauth/authorize/decision` run after `authenticate`.

13. **OAuth JWT issuance bypasses `auth.jwt` emitFilter** (`api/src/services/mcp-oauth.ts`): The `McpOAuthService` MUST
    NOT run `emitter.emitFilter('auth.jwt', ...)` for OAuth-issued tokens. The `scope`, `aud`, and `session` claims are
    security-critical and must not be modifiable by extensions.

14. **Defensive `oauth_client` propagation in `updateStatefulSession`** (`api/src/services/authentication.ts`): Add
    `oauth_client` to the INSERT in `updateStatefulSession`. Even though OAuth refresh bypasses this method, defensive
    propagation prevents silent security degradation if the bypass is ever broken.

15. **Global guard defensive JWT check**: The post-authenticate guard should also check: if `req.token` is a Directus
    JWT containing `scope: 'mcp:access'` or `aud` matching the MCP resource URL, but `req.accountability.oauth_client`
    is not set, reject the request. This catches the `authenticate` emitFilter bypass scenario.

16. **`verifySessionJWT` return type change** (`api/src/utils/verify-session-jwt.ts`): Change return type from
    `Promise<void>` to `Promise<{ oauth_client: string | null }>`. Change `select(1)` to `select('oauth_client')`.
    Update call site in `getAccountabilityForToken` (line ~28) to capture the return value. This is a breaking change to
    the internal API.

## File Structure (API)

```
api/src/
  controllers/
    mcp-oauth.ts          # Express routes: register, token, revoke, authorize/decision, discovery
  services/
    mcp-oauth.ts          # Business logic: DCR, code generation, token exchange, PKCE verification
  middleware/
    mcp-oauth-guard.ts    # Restricts OAuth sessions to /mcp/* endpoints
  database/
    migrations/
      YYYYMMDDA-add-mcp-oauth.ts   # New tables + session columns
```

## File Structure (App)

```
app/src/
  views/
    mcp-oauth-authorize.vue   # Consent screen (static route, not a module)
```

## Known Limitations (v1)

- **Refresh token reuse detection is single-generation.** `previous_session` tracks only the most recently rotated
  token. A stolen token from N-2 generations ago will be treated as "unknown" rather than triggering family revocation.
  Full lineage tracking (hashed refresh-token table with grant linkage) is planned as a follow-up.
- **Code exchange and refresh are not idempotent.** If the server succeeds but the client times out before receiving the
  response, retrying with the old code returns `invalid_grant` (code already used). Retrying refresh with the old
  refresh token triggers reuse detection and revokes the grant. The client must re-authorize in both cases. Idempotent
  retry (keyed to the validated request tuple, returning the same tokens within a short window) is a future improvement.
- **Subpath deployments require reverse proxy configuration** for `.well-known` path routing. Directus can only serve
  `.well-known` URLs for paths it controls.
- **Extension-registered endpoints cannot accept OAuth tokens.** There is no opt-in mechanism in v1.
- **Subpath deployments may not work with MCP clients built against the 2025-03-26 MCP spec**, which uses path-stripping
  discovery instead of PRM-based discovery.
- **Loopback redirect URIs require exact port matching.** RFC 8252 Section 7.3 dynamic port matching is not implemented
  in v1.

## Not In Scope (v1)

- Fine-grained OAuth scopes mapping to Directus permissions
- Client management UI in the Directus app
- Client credential grants (machine-to-machine)
- Confidential client support (`client_secret_post` / `client_secret_basic`)
- Pre-registration and Client ID Metadata Documents (CIMD)
- OIDC (ID tokens, userinfo endpoint, claims)
- Token introspection endpoint
- Access-token revocation (only refresh-token revocation supported; see Revocation section for rationale)
- Dynamic scope expansion (requesting more than `mcp:access`)
- Registration access tokens (RFC 7591 Section 3.2)
- Full refresh-token lineage tracking (multi-generation reuse detection)
- Code replay grant revocation (inappropriate for public clients; see Token section for rationale)
