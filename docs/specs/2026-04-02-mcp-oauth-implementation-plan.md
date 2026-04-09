# MCP OAuth 2.1 Implementation Plan

Reference: [Design Spec](./2026-04-02-mcp-oauth-server-design.md) | ADRs:
[001](../adr/001-oauth-server-token-storage.md), [002](../adr/002-oauth-library-choice.md),
[003](../adr/003-oauth-scope-restriction.md)

## Approach

TDD throughout. Each phase: write failing tests, implement until green, review. Phases are ordered by dependency
(foundations first). Subagent-parallelizable phases are marked.

Estimated scope: ~2k lines of new code, ~200 lines of modifications to existing code, ~3k lines of tests.

### Existing Infrastructure to Reuse

These utilities already exist in the codebase and MUST be used instead of reimplementing:

- `getSecret()` from `api/src/utils/get-secret.ts` -- for JWT signing and any crypto key derivation
- `verifyAccessJWT()` from `api/src/utils/jwt.ts` -- for verifying OAuth access tokens on /mcp (add scope/aud checks
  after)
- `isDirectusJWT()` from `api/src/utils/is-directus-jwt.ts` -- for the global guard's JWT claim check
- `isValidUuid()` from `api/src/utils/is-valid-uuid.ts` -- for client_id format validation
- `Url` class from `api/src/utils/url.ts` -- for all URL construction (handles subpath deployments)
- `getMilliseconds()` from `api/src/utils/get-milliseconds.ts` -- for parsing TTL env vars
- `createError()` from `@directus/errors` -- for OAuth-specific error classes
- `createRateLimiter()` from `api/src/rate-limiter.ts` -- for DCR and token endpoint rate limiters
- `ActivityService` from `api/src/services/activity.ts` -- for OAuth lifecycle activity records
- `scheduleSynchronizedJob()` from `api/src/utils/schedule.ts` -- for cleanup schedule (follow `retention.ts` pattern)
- Test utilities from `api/src/test-utils/` -- `createMockKnex`, `mockDatabase`, `mockEnv`, `mockEmitter`,
  `createMockRequest`, `createMockResponse`, `getRouteHandler`

### Service Constructor Pattern

McpOAuthService follows the `AuthenticationService` pattern (not ItemsService):

```typescript
class McpOAuthService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;
	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}
}
```

### Test Infrastructure

Shared test factories to create once and reuse across all service tests:

- `createTestClient(overrides?)` -- registers a valid DCR client, returns response
- `createAuthorizedCode(client, user, overrides?)` -- runs validate + decision flow, returns code + verifier
- `exchangeForTokens(client, code, verifier)` -- wraps token exchange
- `createOAuthSession(client, user)` -- full flow: register + authorize + exchange
- `assertOAuthError(response, { error, statusCode? })` -- validates RFC 6749/7591 error shape (RFC 6749 Section 5.2, RFC
  7591 Section 3.2.2)

Use `it.each` / `describe.each` for parameterized tests throughout. Groups amenable to parameterization: discovery
metadata fields, DCR redirect URI validation, token exchange error codes, guard route allowlists/blocklists, revocation
no-ops, controller CORS checks. Target: ~194 test blocks (down from ~258) with zero coverage loss.

## Phase 0: Database Migration

**File:** `api/src/database/migrations/YYYYMMDDA-add-mcp-oauth.ts`

Convention: `up(knex)` / `down(knex)` with `knex.schema.createTable` / `alterTable`.

### Tables to create

Tables must be created in FK dependency order: `directus_oauth_clients` first, then `directus_oauth_consents`, then
`directus_oauth_codes`, then `directus_oauth_tokens`. The `oauth_client` column on `directus_sessions` can be added at
any point after `directus_oauth_clients` exists.

```
directus_oauth_clients
  client_id         uuid PK
  client_name       string(200) NOT NULL
  redirect_uris     json NOT NULL
  grant_types       json NOT NULL
  client_secret     string, nullable (reserved, must remain null in v1)
  client_secret_expires_at  integer, nullable (reserved)
  token_endpoint_auth_method  string NOT NULL default 'none'
  date_created      timestamp NOT NULL default NOW()

directus_oauth_codes
  id                uuid PK
  code_hash         string(64) NOT NULL UNIQUE INDEX (SHA256 of raw code, 64 hex chars. Raw code is NEVER stored.)
  client            uuid FK -> oauth_clients.client_id CASCADE
  user              uuid FK -> directus_users.id CASCADE
  redirect_uri      string(255) NOT NULL
  resource          string NOT NULL
  code_challenge    string(128) NOT NULL (S256 = 43 chars, with margin)
  code_challenge_method  string(10) NOT NULL (only "S256" in v1)
  scope             string, nullable
  expires_at        timestamp NOT NULL  INDEX (cleanup queries)
  used              boolean NOT NULL default false
  used_at           timestamp, nullable INDEX (cleanup queries on used codes)

directus_oauth_consents
  id                uuid PK
  user              uuid FK -> directus_users.id CASCADE
  client            uuid FK -> oauth_clients.client_id CASCADE
  redirect_uri      string(255) NOT NULL
  scope             string, nullable
  date_created      timestamp NOT NULL
  date_updated      timestamp NOT NULL
  UNIQUE(user, client, redirect_uri)

directus_oauth_tokens
  id                uuid PK
  client            uuid FK -> oauth_clients.client_id CASCADE
  user              uuid FK -> directus_users.id CASCADE
  session           string(64) NOT NULL (nanoid(64), plain column, NOT FK)  INDEX (refresh/revocation lookup)
  previous_session  string(64), nullable                                    INDEX (reuse detection lookup)
  resource          string NOT NULL
  code_hash         string(64) NOT NULL (SHA256 hex = exactly 64 chars)     INDEX (audit correlation after code cleanup)
  scope             string, nullable
  expires_at        timestamp NOT NULL                          INDEX (cleanup queries)
  date_created      timestamp NOT NULL
  UNIQUE(client, user)
```

Redirect URIs are capped at 255 chars at the application layer (DCR validation). 2048-char URIs would exceed
MySQL/MariaDB InnoDB index limits on the UNIQUE constraint.

### Columns to add

```
directus_sessions
  oauth_client      uuid FK -> oauth_clients.client_id CASCADE, nullable, INDEX (global guard + cleanup queries)
```

No migration tests (not an existing pattern in the codebase). Schema correctness is verified by the service and
integration tests that exercise the tables.

---

## Phase 0B: Configuration

**Files:** `packages/env/src/constants/defaults.ts`, `packages/env/src/constants/type-map.ts`

```
MCP_OAUTH_ENABLED           = false
MCP_OAUTH_ACCESS_TOKEN_TTL  = 15m
MCP_OAUTH_REFRESH_TOKEN_TTL = 7d
MCP_OAUTH_AUTH_CODE_TTL     = 60s
```

Add `MCP_OAUTH_ENABLED: 'boolean'` to `packages/env/src/constants/type-map.ts`. Without the type-map entry, the feature
flag will compare string `"true"` vs boolean `true` and silently fail.

Startup validation in `api/src/app.ts` or service init:

- `MCP_OAUTH_ENABLED=true` requires `MCP_ENABLED=true`; log warning and disable if not
- If `MCP_OAUTH_ENABLED=true` and `SERVE_APP=false`, log warning and disable OAuth (same pattern as `MCP_ENABLED` check)

```
test: MCP_OAUTH_ENABLED defaults to false
test: MCP_OAUTH_ENABLED parsed as boolean (string "true" -> true)
test: MCP_OAUTH_ENABLED=true with MCP_ENABLED=false logs warning and disables OAuth
test: MCP_OAUTH_ENABLED=true with SERVE_APP=false logs warning and disables OAuth
test: TTL env vars parsed correctly (15m, 7d, 60s) via getMilliseconds()
```

### Phase 0C: System Data Registration

Create/update system-data YAML files so Directus recognizes the new tables as system collections for schema
introspection, CRUD, and snapshot/apply.

**Files:**

- `packages/system-data/src/fields/sessions.yaml` (add `oauth_client` field metadata)
- `packages/system-data/src/collections/` entries for `directus_oauth_clients`, `directus_oauth_codes`,
  `directus_oauth_consents`, `directus_oauth_tokens`
- `packages/system-data/src/fields/` YAML files for each new table
- `packages/system-data/src/relations/relations.yaml` (FK definitions)

---

## Phase 1: Existing Code Modifications

These changes create the isolation guarantees the OAuth feature depends on. Each is independently testable. Can be
parallelized across subagents (no file conflicts between groups).

### Group A: Token infrastructure (no cross-file deps)

#### 1A. Token source tracking

**Files:** `api/src/middleware/extract-token.ts`, `api/src/types/express.d.ts`

Add `tokenSource: 'cookie' | 'header' | 'query' | null` to `Express.Request`. Set in `extractToken`.

```
test: req.tokenSource is 'query' when access_token in query string (RFC 6750 Section 2.3)
test: req.tokenSource is 'header' when Authorization: Bearer present (RFC 6750 Section 2.1)
test: req.tokenSource is 'cookie' when session cookie present (and no header/query)
test: req.tokenSource is null when no token present
test: existing RFC6750 multi-method rejection still works (RFC 6750 Section 2: "The client MUST NOT use more than one method")
```

#### 1B. Type changes

**Files:** `packages/types/src/accountability.ts`, `api/src/types/auth.ts`

Add `oauth_client?: string` to `Accountability`. Add `scope?: string` (RFC 6749 Section 3.3) and `aud?: string` (RFC
8707 Section 2) to `DirectusTokenPayload`.

```
test: (type-level only, verified by typecheck)
```

#### 1C. verifySessionJWT refactor

**File:** `api/src/utils/verify-session-jwt.ts`

Change `select(1)` to `select('oauth_client')`. Return `{ oauth_client: string | null }` instead of `void`.

```
test: returns { oauth_client: null } for regular sessions
test: returns { oauth_client: '<uuid>' } for OAuth sessions
test: still throws on invalid/expired/missing session
```

#### 1D. getAccountabilityForToken changes

**File:** `api/src/utils/get-accountability-for-token.ts`

Capture return value from `verifySessionJWT`. Set `accountability.oauth_client` when present.

```
test: accountability.oauth_client is undefined for regular session JWTs
test: accountability.oauth_client is set for OAuth session JWTs
test: accountability.oauth_client is undefined for static tokens
test: accountability.oauth_client is undefined for null token
```

### Group B: Session isolation (depends on Group A types)

#### 1E. AuthenticationService.refresh() guard

**File:** `api/src/services/authentication.ts`

Add `.andWhere('s.oauth_client', null)` to the initial SELECT in `refresh()`.

```
test: refresh with regular session token succeeds (RFC 6749 Section 6)
test: refresh with OAuth session token returns InvalidCredentials
test: blocks all three entry points (REST refresh, GraphQL refresh, WebSocket refresh) (RFC 6749 Section 6: refresh grant isolation)
```

#### 1F. AuthenticationService.logout() guard

**File:** `api/src/services/authentication.ts`

Add `.andWhere('s.oauth_client', null)` to the initial SELECT in `logout()`.

```
test: logout with regular session succeeds
test: logout with OAuth session returns early (no record found) (RFC 7009 Section 2.1: revocation is the only OAuth logout)
test: provider.logout() is NOT called for OAuth sessions
```

#### 1G. updateStatefulSession defensive propagation

**File:** `api/src/services/authentication.ts`

Add `oauth_client: sessionRecord['oauth_client']` to the INSERT in `updateStatefulSession`.

```
test: new session row preserves oauth_client from old session
test: regular sessions (oauth_client null) still work
```

### Group C: Guards and middleware (depends on Group A)

#### 1H. Global post-authenticate guard

**File:** `api/src/middleware/mcp-oauth-guard.ts` (new file)

Reject requests where `req.accountability.oauth_client` is set, unless the route is `/mcp/*`, `/mcp-oauth/token`,
`/mcp-oauth/register`, or `/mcp-oauth/revoke`. Consent endpoints are NOT exempted.

Defensive JWT check: if `req.token` is a Directus JWT with `scope: 'mcp:access'` but `req.accountability.oauth_client`
is not set, also reject (catches authenticate emitFilter bypass).

```
// RFC 6749 Section 1.4: access tokens represent specific scopes and durations of access
// MCP Auth Spec: Security Considerations -- redirect URI and scope validation
test: allows regular sessions on any route
test: allows OAuth sessions on /mcp/*
test: allows OAuth sessions on /mcp-oauth/token (RFC 6749 Section 3.2)
test: allows OAuth sessions on /mcp-oauth/register (RFC 7591 Section 3)
test: allows OAuth sessions on /mcp-oauth/revoke (RFC 7009 Section 2.1)
test: blocks OAuth sessions on /items/*
test: blocks OAuth sessions on /graphql
test: blocks OAuth sessions on /mcp-oauth/authorize/validate
test: blocks OAuth sessions on /mcp-oauth/authorize/decision
test: blocks JWT with scope=mcp:access but no oauth_client on accountability (emitFilter bypass)
```

#### 1I. WebSocket auth guard

**File:** `api/src/websocket/authenticate.ts`

After `getAccountabilityForToken` returns (line ~66-68), check `accountability.oauth_client`. If set, reject.

```
test: WebSocket connect with regular bearer token succeeds
test: WebSocket connect with OAuth bearer token is rejected
test: WebSocket refresh with OAuth session token is rejected (via 1E)
```

#### 1J. MCP controller 401 discovery

**File:** `api/src/ai/mcp/server.ts`

Replace the ForbiddenError throw with 401 + WWW-Authenticate when no valid credentials. Add audience validation for
OAuth sessions.

Invalid/expired token errors on `/mcp` are caught by the global error handler (see Phase 3D: error-handler.ts
conditional) and returned as 401 + WWW-Authenticate with `error="invalid_token"`.

**Mixed-auth semantics:** `/mcp` accepts both regular Directus auth (sessions, static tokens, cookies, query-string
tokens) and OAuth bearer tokens. OAuth-specific restrictions (audience validation, header-only bearer, scope check)
apply only when `accountability.oauth_client` is set. Regular Directus auth is unrestricted.

**Query-string legacy auth contract:** PRM omits `bearer_methods_supported` (the field is OPTIONAL per RFC 9728).
Omitting it avoids a metadata lie: the `/mcp` resource genuinely accepts query-string and cookie auth for regular
Directus sessions alongside header-only bearer for OAuth sessions. MCP clients infer header-only bearer from their own
spec requirements, which is correct for OAuth tokens. The rule: OAuth sessions (oauth_client set) via query-string are
rejected. Regular sessions via query-string are allowed. This preserves backward compatibility while enforcing the MCP
transport requirement for OAuth tokens.

```
// RFC 6750 Section 3: WWW-Authenticate response header for bearer token challenges
// RFC 9728 Section 5.1: resource_metadata parameter in WWW-Authenticate
// MCP Auth Spec: Example: authorization code grant -- 401 Unauthorized triggers OAuth flow
test: unauthenticated /mcp request returns 401 with WWW-Authenticate (resource_metadata, scope) (RFC 6750 Section 3, RFC 9728 Section 5.1)
test: invalid token on /mcp returns 401 with error="invalid_token" (RFC 6750 Section 3.1)
test: valid regular session on /mcp returns 200 (no audience check)
test: valid OAuth session with correct aud on /mcp via Authorization header returns 200 (RFC 6750 Section 2.1)
test: valid OAuth session with wrong aud on /mcp returns 401 (RFC 9728 Section 7.4: audience-restricted access tokens)
test: OAuth session via query-string access_token on /mcp returns 401 + WWW-Authenticate error="invalid_request"
      (RFC 6750 Section 3.1: wrong bearer transport method; MCP Auth Spec: Access Token Usage -- MUST NOT use query string)
test: regular session via query-string access_token on /mcp returns 200 (legacy compat)
test: regular session via cookie on /mcp returns 200
test: static token via query-string on /mcp returns 200 (not an OAuth session)
test: 403 insufficient-scope when OAuth token lacks mcp:access scope (RFC 6750 Section 3.1: insufficient_scope error)
```

---

## Phase 2: OAuth Service Layer

**File:** `api/src/services/mcp-oauth.ts`

Core business logic. Does NOT use `emitter.emitFilter('auth.jwt')` for token issuance.

**Security invariant:** Consent verification uses `jwt.verify()` with a derived key (signature comparison handled
internally). `crypto.timingSafeEqual` is required for PKCE verification (2E:
`BASE64URL(SHA256(code_verifier)) === code_challenge`). Token/session lookups (2F, 2G) use SQL `WHERE` clauses where
timing-safe comparison does not apply. Enforced via code review.

### 2A. Discovery metadata

// RFC 8414 Section 2: Authorization Server Metadata fields // RFC 8414 Section 3: well-known URL format
(/.well-known/oauth-authorization-server) // RFC 9728 Section 2: Protected Resource Metadata fields // RFC 9728 Section
3: well-known URL format (/.well-known/oauth-protected-resource) // MCP Auth Spec: Server Metadata Discovery -- clients
MUST follow RFC 8414

```typescript
getProtectedResourceMetadata(): object
getAuthorizationServerMetadata(): object
```

Both derive all values from `PUBLIC_URL` including subpath. AS metadata includes
`authorization_response_iss_parameter_supported: true` and `response_modes_supported: ["query"]`.

```
test: PRM resource matches PUBLIC_URL + /mcp (RFC 9728 Section 2: resource identifier)
test: PRM authorization_servers includes subpath (RFC 9728 Section 2: authorization_servers)
test: AS metadata issuer includes subpath (RFC 8414 Section 2: issuer REQUIRED)
test: AS metadata all endpoint URLs include subpath (RFC 8414 Section 3)
test: AS metadata includes response_modes_supported: ["query"] (RFC 8414 Section 2: response_modes_supported OPTIONAL)
test: AS metadata includes authorization_response_iss_parameter_supported: true (RFC 9207 Section 3)
test: AS metadata includes response_types_supported: ["code"] (RFC 8414 Section 2: response_types_supported REQUIRED)
test: AS metadata includes grant_types_supported: ["authorization_code", "refresh_token"] (RFC 8414 Section 2: grant_types_supported)
test: AS metadata includes token_endpoint_auth_methods_supported: ["none"] (RFC 8414 Section 2: token_endpoint_auth_methods_supported)
test: AS metadata includes revocation_endpoint_auth_methods_supported: ["none"] (RFC 8414 Section 2: revocation_endpoint_auth_methods_supported)
test: AS metadata includes code_challenge_methods_supported: ["S256"] (RFC 8414 Section 2: code_challenge_methods_supported)
test: AS metadata includes scopes_supported: ["mcp:access"] (RFC 8414 Section 2: scopes_supported RECOMMENDED)
test: AS metadata includes registration_endpoint (RFC 8414 Section 2: registration_endpoint OPTIONAL)
test: PRM does NOT include bearer_methods_supported (RFC 9728 Section 2: bearer_methods_supported is OPTIONAL; omitted for mixed-auth compat)
test: subpath example: PUBLIC_URL=https://example.com/directus produces correct URLs (RFC 8414 Section 3: path insertion)
```

### 2B. Dynamic Client Registration

// RFC 7591 Section 3.1: Client Registration Request (POST with application/json) // RFC 7591 Section 3.2.1: Client
Information Response // RFC 7591 Section 3.2.2: Client Registration Error Response (error codes) // MCP Auth Spec:
Dynamic Client Registration -- SHOULD support RFC 7591

```typescript
registerClient(body: unknown): Promise<DCRResponse>
```

Validates, creates `directus_oauth_clients` row, returns RFC 7591 response.

```
test: valid registration returns 201 with client_id (RFC 7591 Section 3.2.1)
test: omitted token_endpoint_auth_method defaults to none (RFC 7591 Section 2: default is client_secret_basic; overridden for public clients)
test: explicit token_endpoint_auth_method=none accepted (RFC 7591 Section 2)
test: token_endpoint_auth_method=client_secret_basic rejected (RFC 7591 Section 2: we only support "none")
test: grant_types must contain authorization_code (RFC 7591 Section 2.1: grant_type/response_type correlation)
test: grant_types with only refresh_token rejected (RFC 7591 Section 2.1)
test: omitted grant_types rejected with invalid_client_metadata (diverges from RFC 7591 Section 2 default of
      ["authorization_code"]; we require explicit grant_types for clarity) (RFC 7591 Section 3.2.2: invalid_client_metadata)
test: redirect_uris must be HTTPS (except localhost) (MCP Auth Spec: Security Considerations -- redirect URIs MUST be localhost or HTTPS)
test: http://localhost:3000/callback accepted (MCP Auth Spec: Security Considerations)
test: redirect_uri with userinfo (user@host) rejected (RFC 7591 Section 2: redirect_uris validation)
test: redirect_uri with fragment rejected (RFC 6749 Section 3.1.2: no fragment component)
test: max 10 redirect URIs
test: client_name max 200 chars
test: unknown fields silently ignored (RFC 7591 Section 3.1: server MAY ignore unknown fields)
test: response_types derived from grant_types if omitted (RFC 7591 Section 2.1)
test: explicit response_types=["code"] accepted (RFC 7591 Section 2.1: "code" correlates with "authorization_code")
test: response_types=["token"] rejected (RFC 7591 Section 2.1: "token" correlates with implicit grant)
test: response includes all registered metadata per RFC 7591 Section 3.2.1
test: global cap (1000 clients) enforced
test: rate limiting enforced
```

### 2C. Authorization validation (validate endpoint)

// RFC 6749 Section 4.1.1: Authorization Request parameters (response_type, client_id, redirect_uri, scope, state) //
RFC 7636 Section 4.3: code_challenge and code_challenge_method in authorization request // RFC 8707 Section 2.1:
resource parameter in authorization request // RFC 6749 Section 3.1.2: redirect URI validation (simple string
comparison) // RFC 9207 Section 2: iss parameter in authorization response

```typescript
validateAuthorization(params: AuthzParams, userId: string, sessionHash: string): Promise<ValidateResponse>
```

Validates all params, signs a short-lived consent JWT with a **derived key** to prevent token-type confusion with
regular Directus JWTs:

```typescript
const consentKey = crypto.createHmac('sha256', getSecret()).update('mcp-oauth-consent-v1').digest();
jwt.sign(
	{
		typ: 'directus-mcp-consent+jwt', // explicit token type -- prevents cross-token confusion
		aud: 'mcp-oauth-authorize-decision', // audience -- only the decision endpoint accepts this
		sub: user_id, // user binding
		session_hash, // session binding (SHA256 of session token)
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

Returns `signed_params` (this JWT string). Domain separation: the derived key ensures no regular Directus JWT can be
misused as a consent artifact (and vice versa). The `typ` and `aud` claims provide defense-in-depth even if keys were
somehow shared.

```
test: valid params return signed_params and client info (RFC 6749 Section 4.1.1)
test: unknown client_id returns error (no redirect) (RFC 6749 Section 4.1.2.1: no redirect on invalid client)
test: unregistered redirect_uri returns error (no redirect) (RFC 6749 Section 3.1.2.4: invalid redirect endpoint)
test: missing code_challenge returns invalid_request (RFC 7636 Section 4.4.1; MCP Auth Spec: Implementation Requirements -- PKCE REQUIRED)
test: code_challenge_method != S256 rejected (RFC 7636 Section 4.2: S256 mandatory to implement)
test: invalid scope rejected (RFC 6749 Section 3.3: scope validation)
test: missing resource rejected (RFC 8707 Section 2.1: resource parameter)
test: resource mismatch rejected (RFC 8707 Section 2.1)
test: missing response_type returns invalid_request (RFC 6749 Section 3.1.1: response_type REQUIRED)
test: duplicate response_type returns invalid_request (RFC 6749 Section 3.1: no duplicate params)
test: response_type=token returns unsupported_response_type (RFC 6749 Section 4.1.2.1: unsupported_response_type error)
test: response_type=code accepted (RFC 6749 Section 4.1.1: response_type "code")
test: signed consent JWT includes session_hash claim (RFC 6749 Section 10.12: CSRF prevention)
test: already_consented always false for DCR clients
test: duplicate parameters (any param) rejected as invalid_request (RFC 6749 Section 3.1: parameters MUST NOT be included more than once)
```

### 2D. Authorization decision (decision endpoint)

// RFC 6749 Section 4.1.2: Authorization Response (code + state) // RFC 9207 Section 2: iss parameter in authorization
response // RFC 6749 Section 4.1.2.1: Error Response (error + state via redirect) // RFC 7636 Section 4.4: Server
Returns the Code (stores code_challenge for later verification)

```typescript
processDecision(params: DecisionParams, userId: string, sessionToken: string): Promise<string>
```

Verifies the consent JWT using the same derived key:

```typescript
const consentKey = crypto.createHmac('sha256', getSecret()).update('mcp-oauth-consent-v1').digest();
const claims = jwt.verify(signed_params, consentKey, {
	algorithms: ['HS256'],
	audience: 'mcp-oauth-authorize-decision',
});
// Then verify: claims.typ === 'directus-mcp-consent+jwt'
//              claims.sub === authenticated user_id
//              claims.session_hash === SHA256(current session token)
// Then revalidate all params against current DB state
```

Generates code, returns redirect URL. Issues HTTP 302.

```
test: valid approval generates code and returns redirect URL with code, state, iss (RFC 6749 Section 4.1.2, RFC 9207 Section 2)
test: denial returns redirect URL with error=access_denied, state, iss (RFC 6749 Section 4.1.2.1: access_denied, RFC 9207 Section 2.2)
test: signed consent JWT invalid/tampered rejects (redirect to authorize page with error)
test: expired consent JWT (>5min) rejects
test: consent JWT with wrong session_hash rejects (session binding) (RFC 6749 Section 10.12: CSRF prevention)
test: regular Directus JWT (signed with raw getSecret()) rejected as consent artifact (derived key isolation)
test: consent JWT from user A rejected when submitted by user B (sub claim mismatch)
test: re-validates client against DB (stale registration caught) (RFC 6749 Section 3.1.2: redirect URI re-validation)
test: consent record created/updated
test: code stored with PKCE challenge, user, client, redirect_uri, resource (RFC 7636 Section 4.4: server stores code_challenge)
test: Referrer-Policy: no-referrer set on 302 response (RFC 6749 Section 10.4: preventing code leakage via Referer)
```

### 2E. Token exchange (authorization_code grant)

// RFC 6749 Section 4.1.3: Access Token Request (grant_type, code, redirect_uri, client_id) // RFC 6749 Section 5.1:
Successful Response (access_token, token_type, expires_in, refresh_token, scope) // RFC 6749 Section 5.2: Error Response
(invalid_request, invalid_client, invalid_grant, unsupported_grant_type) // RFC 7636 Section 4.6: Server Verifies
code_verifier before Returning the Tokens // RFC 8707 Section 2.2: resource parameter in token request (validated
against original authorization) // MCP Auth Spec: Authorization Flow Steps -- Token Request + code_verifier

```typescript
exchangeCode(params: TokenParams): Promise<TokenResponse>
```

**JWT signing:** OAuth tokens are signed using `jwt.sign(payload, getSecret(), { expiresIn, issuer: 'directus' })`
directly, bypassing `emitter.emitFilter('auth.jwt')`. The issuer remains `'directus'` (same as regular Directus JWTs) to
stay compatible with `isDirectusJWT()` and `verifyAccessJWT()` which hard-code this value. No modifications to the JWT
verification chain are needed. OAuth tokens are distinguished by `scope: 'mcp:access'`, `aud`, and `oauth_client` on the
session -- not by issuer. The AS metadata `issuer` (PUBLIC_URL) identifies the authorization server for discovery (RFC
8414); the JWT `iss` identifies the token signer (RFC 7519). These serve different purposes.

The payload includes `id`, `role`, `app_access`, `admin_access`, `session` (standard Directus claims) plus
`scope: 'mcp:access'` and `aud: <resource>` (OAuth-specific). `fetchRolesTree` and `fetchGlobalAccess` must still be
called to populate role/permission fields.

**Session TTL:** OAuth sessions are created with expiry from `MCP_OAUTH_REFRESH_TOKEN_TTL` (NOT `REFRESH_TOKEN_TTL`).
Grant `expires_at` and session expiry must be synchronized.

```
test: missing grant_type returns invalid_request (RFC 6749 Section 5.2: invalid_request)
test: unsupported grant_type returns unsupported_grant_type (RFC 6749 Section 5.2: unsupported_grant_type)
test: missing client_id returns invalid_request (RFC 6749 Section 4.1.3: client_id REQUIRED)
test: malformed code_verifier (wrong length/charset) returns invalid_request (before code lookup) (RFC 7636 Section 4.1: 43*128unreserved)
test: valid code exchange returns access_token, token_type=Bearer, refresh_token, scope, expires_in (RFC 6749 Section 5.1)
test: session created with expiry from MCP_OAUTH_REFRESH_TOKEN_TTL (not REFRESH_TOKEN_TTL)
test: malformed code_verifier returns invalid_request even when code is valid (proves format check runs first) (RFC 7636 Section 4.1)
test: activity record created with action=LOGIN, human-readable comment + server log with structured data
test: PKCE verification (S256) (RFC 7636 Section 4.6: BASE64URL(SHA256(code_verifier)) == code_challenge)
test: wrong code_verifier returns invalid_grant (RFC 7636 Section 4.6: invalid_grant on mismatch)
test: expired code returns invalid_grant (RFC 6749 Section 4.1.2: code MUST expire shortly; RFC 6749 Section 5.2: invalid_grant)
test: wrong client_id returns invalid_grant (RFC 6749 Section 4.1.3: code bound to client_id)
test: wrong redirect_uri returns invalid_grant (RFC 6749 Section 4.1.3: redirect_uri must match)
test: wrong resource returns invalid_target (RFC 8707 Section 2.2, RFC 8707 Section 5.2: invalid_target error)
test: code already used returns invalid_grant (no grant revocation) (RFC 6749 Section 4.1.2: code MUST NOT be used more than once)
test: concurrent code exchange - only one wins (atomic UPDATE) (RFC 6749 Section 4.1.2: single-use enforcement)
test: JWT includes session, scope=mcp:access, aud=resource (RFC 6749 Section 3.3, RFC 8707 Section 2)
test: refresh_token omitted if client didn't register refresh_token grant type (RFC 6749 Section 5.1: refresh_token OPTIONAL)
test: session created with oauth_client set
test: oauth_tokens row created with code_hash, resource, scope, expires_at
test: existing grant for same (client, user) is deleted before new grant is created (delete-then-insert in transaction, not upsert -- upsert is not portable across MySQL/MSSQL/Oracle)
test: code burn and grant creation in same transaction (rollback = code reusable)
test: Cache-Control: no-store and Pragma: no-cache in response (RFC 6749 Section 5.1: Cache-Control: no-store, Pragma: no-cache)
test: JWT NOT passed through auth.jwt emitFilter
```

### 2F. Token refresh

// RFC 6749 Section 6: Refreshing an Access Token // RFC 8707 Section 2.2: resource in token request; refresh bound to
original grant's resources // MCP Auth Spec: Implementation Requirements -- token rotation SHOULD be implemented

```typescript
refreshToken(params: RefreshParams): Promise<TokenResponse>
```

```
test: missing resource returns invalid_target (RFC 8707 Section 2.2: resource validation on refresh)
test: resource mismatch returns invalid_target (RFC 8707 Section 2.2: limited to originally-granted resources)
test: client without refresh_token grant type returns unauthorized_client (RFC 6749 Section 5.2: unauthorized_client)
test: valid refresh returns new tokens with scope (RFC 6749 Section 6, RFC 6749 Section 5.1)
test: rotation: old session deleted, new session created, grant pointer updated (MCP Auth Spec: Implementation Requirements -- token rotation)
test: all three operations in single transaction
test: grant expires_at renewed (sliding window)
test: concurrent refresh - only one wins (atomic UPDATE WHERE session=:old)
test: race loser with affected_rows=0 checks previous_session for reuse
test: reuse detected (previous_session match) -> grant revoked (RFC 6749 Section 10.4: refresh token rotation reuse detection)
test: unknown token returns invalid_grant (RFC 6749 Section 5.2: invalid_grant)
test: expired session returns invalid_grant (RFC 6749 Section 5.2: invalid_grant)
test: scope on refresh request validated (only mcp:access accepted) (RFC 6749 Section 6: scope MUST NOT include any scope not originally granted)
test: JWT aud preserved from grant's stored resource (RFC 8707 Section 2.2)
test: activity record created with action=UPDATE on refresh, human-readable comment + server log
```

### 2G. Token revocation

// RFC 7009 Section 2.1: Revocation Request (token, token_type_hint parameters) // RFC 7009 Section 2.2: Revocation
Response (200 for success and invalid tokens) // RFC 7009 Section 2.2.1: Error Response (uses RFC 6749 Section 5.2
format) // RFC 7009 Section 2.3: Cross-Origin Support (MAY support CORS)

```typescript
revokeToken(params: RevokeParams): Promise<void>
```

**Refresh-token revocation only.** Access-token revocation is explicitly not supported (see design spec Revocation
section: unverified JWT claims could be used to revoke live grants). The `token` parameter is always treated as a
refresh token (= session token).

Revocation looks up grants by `session` column only (NOT `previous_session`). The `previous_session` field is used
exclusively for reuse detection during refresh. Accepting it as a revocation handle would let anyone with a stale
rotated token (one generation old) kill the active grant.

```
test: valid refresh token (current session) revokes grant and session (RFC 7009 Section 2.1)
test: stale rotated token (matches previous_session only) returns 200 no-op (not a revocation handle)
test: client_id mismatch returns 200 (not invalid_client, per RFC 7009 Section 2.1) (RFC 7009 Section 2.2: 200 for invalid tokens)
test: unknown client_id returns invalid_client (RFC 6749 Section 5.2: invalid_client)
test: unknown token returns 200 (RFC 7009 Section 2.2: "invalid tokens do not cause an error response")
test: already-revoked token returns 200 (RFC 7009 Section 2.2)
test: token_type_hint ignored (known and unknown values) (RFC 7009 Section 2.1: token_type_hint is OPTIONAL hint)
test: missing token parameter returns invalid_request (RFC 7009 Section 2.1: token REQUIRED)
test: missing client_id returns invalid_request
test: malformed/empty body returns invalid_request
test: activity record created with action=LOGOUT on revocation, human-readable comment + server log
test: access token (JWT) submitted as token returns 200 (treated as unknown refresh token, no-op) (RFC 7009 Section 2.2)
```

### 2H. Cleanup

```typescript
cleanup(): Promise<void>
```

Runs on a dedicated schedule (`api/src/schedules/oauth-cleanup.ts`), registered alongside other schedules in `app.ts`.
There is no existing session cleanup schedule to piggyback on -- expired sessions are only cleaned up during
refresh/logout. The OAuth cleanup schedule handles codes, grants, orphaned grants, and orphaned clients.

Activity records use a human-readable `comment` string (e.g., 'OAuth grant issued for client Claude (mcp:access) to
user@example.com'). Server-level `logger.info()` with structured data (client_id, scope, resource, user_id, action, ip)
provides the machine-readable audit trail. A dedicated audit table is v2.

The `collection` field is set to `directus_oauth_tokens`, the `item` field is the grant ID, and `action` is `LOGIN`
(issuance), `UPDATE` (refresh), or `LOGOUT` (revocation). Records are subject to `ACTIVITY_RETENTION` like all activity.
Operators who need durable OAuth audit trails should set retention appropriately.

```
test: expired unused codes deleted
test: used codes older than 1 hour deleted
test: expired grants (expires_at < NOW()) deleted along with associated session
test: orphaned grants (session not in directus_sessions) deleted
test: orphaned clients deleted (no active sessions AND no oauth_tokens rows AND date_created > 24h ago)
test: client with permanent consent but no active sessions/tokens IS eligible for cleanup
test: client with active session is NOT eligible for cleanup (even if old)
test: client with lingering oauth_tokens row (but no session) is NOT eligible for cleanup
test: activity log records survive grant deletion (human-readable comment, no FK to grant)
test: activity log records survive client deletion (human-readable comment, no FK to client)
test: cleanup queries use indexed columns (expires_at, used_at, session)
```

---

## Phase 3: Controller Layer

**File:** `api/src/controllers/mcp-oauth.ts`

Express router. Unauthenticated endpoints mounted before `authenticate` in app.ts. Authenticated endpoints (validate,
decision) mounted after.

### 3A. Route structure

```
BEFORE authenticate (in app.ts):
  GET  /.well-known/oauth-protected-resource{/*path}  -> PRM metadata       // RFC 9728 Section 3
  GET  /.well-known/oauth-authorization-server{/*path} -> AS metadata        // RFC 8414 Section 3
  POST /mcp-oauth/register                             -> DCR               // RFC 7591 Section 3.1
  POST /mcp-oauth/token                                -> token exchange/refresh  // RFC 6749 Section 3.2
  POST /mcp-oauth/revoke                               -> revocation        // RFC 7009 Section 2.1

AFTER authenticate (in app.ts):
  POST /mcp-oauth/authorize/validate                   -> consent validation (cookie-only)  // RFC 6749 Section 3.1
  POST /mcp-oauth/authorize/decision                   -> consent decision (cookie-only, form POST)  // RFC 6749 Section 4.1.2
```

### 3B. Middleware per route

- Discovery (`.well-known`): no body parser needed, `Access-Control-Allow-Origin: *` (RFC 8414 Section 3: HTTP GET, RFC
  9728 Section 3)
- Register: `express.json()`, rate limiter (dedicated pool + global cap check), `ACAO: *` (RFC 7591 Section 3.1:
  application/json)
- Token: `express.urlencoded({ extended: false })`, duplicate-param rejection, rate limiter, `ACAO: *`,
  `Cache-Control: no-store`, `response_mode` rejection (reject non-query modes) (RFC 6749 Section 3.2:
  application/x-www-form-urlencoded, RFC 6749 Section 5.1: Cache-Control: no-store)
- Revoke: `express.urlencoded({ extended: false })`, duplicate-param rejection, `ACAO: *` (RFC 7009 Section 2.1:
  application/x-www-form-urlencoded, RFC 7009 Section 2.3: CORS)
- Validate: `express.json()`, cookie-only auth check (`req.tokenSource === 'cookie'`), same-origin CORS, Origin check
- Decision: `express.urlencoded({ extended: false })`, cookie-only auth check, same-origin CORS, Origin check,
  `Referrer-Policy: no-referrer` on 302 response (RFC 6749 Section 10.4: code leakage via Referer)

### 3C. Error handling

OAuth router has its own error handler that catches errors and formats as RFC 6749 JSON (`{ error, error_description }`)
before the global Directus error handler. DCR errors use RFC 7591 codes.

```
// RFC 6749 Section 5.2: error response format (error, error_description, error_uri)
// RFC 7591 Section 3.2.2: DCR error response format (invalid_redirect_uri, invalid_client_metadata)
test: discovery endpoints return JSON without authentication (RFC 8414 Section 3.2, RFC 9728 Section 3.2)
test: discovery endpoints accept requests with invalid Authorization header (mounted before auth)
test: register accepts JSON, returns RFC 7591 format errors (RFC 7591 Section 3.2.2)
test: token accepts urlencoded, returns RFC 6749 format errors (RFC 6749 Section 5.2)
test: validate rejects non-cookie tokens (header and query)
test: decision rejects non-cookie tokens
test: validate rejects cross-origin requests (Origin check) (RFC 6749 Section 10.12: CSRF prevention)
test: decision rejects cross-origin requests
test: Access-Control-Allow-Origin: * on public endpoints (RFC 7009 Section 2.3: CORS support)
test: no CORS headers on cookie endpoints
test: MCP 401 exposes WWW-Authenticate via Access-Control-Expose-Headers (RFC 6750 Section 3)
test: all unauthenticated endpoints call getSchema() directly (no req.schema)
test: duplicate form params on /mcp-oauth/token rejected as invalid_request (RFC 6749 Section 3.1: params MUST NOT be included more than once)
test: duplicate form params on /mcp-oauth/revoke rejected as invalid_request
test: response_mode=fragment on authorize rejected as invalid_request (RFC 8414 Section 2: response_modes_supported)
test: response_mode=form_post on authorize rejected as invalid_request
test: resource_metadata URL in WWW-Authenticate matches exact RFC 9728 path-inserted URL (including subpath) (RFC 9728 Section 5.1)
```

### 3D. Route registration in app.ts

**File:** `api/src/app.ts`

Mount unauthenticated OAuth routes between rate limiters and `authenticate`:

```typescript
// Around line 305 (after rate limiters, before authenticate)
if (env['MCP_OAUTH_ENABLED'] === true) {
	app.use(mcpOAuthPublicRouter); // .well-known, register, token, revoke
}

// Line 307: app.use(authenticate) -- UNCHANGED, no wrapper

// Immediately after authenticate:
if (env['MCP_OAUTH_ENABLED'] === true) {
	app.use(mcpOAuthGuard); // blocks OAuth sessions from non-MCP/non-OAuth routes
	app.use(mcpOAuthProtectedRouter); // authorize/validate, authorize/decision (call getSchema() directly)
}

// The /mcp route itself handles the no-credentials 401 (in the MCP controller, Phase 1J).
// For invalid/expired tokens, authenticate throws BEFORE the MCP router is reached.
// This is handled in error-handler.ts (see below).
```

**MCP 401 via error handler:** In `api/src/middleware/error-handler.ts`, add a conditional: if the error is
InvalidCredentials/InvalidToken and `req.path.startsWith('/mcp')` and `MCP_OAUTH_ENABLED`, return 401 + WWW-Authenticate
with `error="invalid_token"` instead of the default Directus error response. This touches one existing file with a small
conditional rather than wrapping authenticate.

```
test: MCP_OAUTH_ENABLED=false -> no OAuth routes mounted
test: MCP_OAUTH_ENABLED=true + MCP_ENABLED=false -> warning logged, OAuth disabled
test: discovery endpoints reachable without authentication
test: token endpoint reachable without authentication
test: consent endpoints require authentication
```

---

## Integration Tests (Phase 2[B])

End-to-end flow tests using the blackbox test infrastructure.

```
test: full OAuth flow - register, authorize, consent, exchange, access /mcp, refresh, revoke
test: subpath deployment - all discovery URLs correct
test: OAuth token cannot access /items, /graphql, /auth/*, WebSocket
test: regular Directus sessions still access /mcp normally
test: client deletion cascades to all related records
test: concurrent refresh - only one winner
test: expired grant cleaned up
test: cleanup doesn't delete in-flight authorization flows
```

---

## Vue Consent Page (Separate PR)

Deferred: frontend-only, no backend dependency. Ship as a follow-up PR.

**File:** `app/src/views/mcp-oauth-authorize.vue`

### Route registration

**File:** `app/src/router.ts`

Add to `defaultRoutes` array (before catch-all):

```typescript
{
    name: 'mcp-oauth-authorize',
    path: '/mcp-oauth/authorize',
    component: () => import('./views/mcp-oauth-authorize.vue'),
    meta: { public: false },
}
```

Route is relative to base `/admin/`. Auth guard redirects to login if not authenticated. No `app_access` check needed
(any authenticated user can consent).

The authorization endpoint URL advertised in AS metadata is `${PUBLIC_URL}/admin/mcp-oauth/authorize`. The `/admin/`
prefix comes from the Vue app's base path (`createWebHistory(getRootPath() + 'admin/')` in router.ts). All OAuth
redirect URLs to the consent page must include this prefix.

### Consent screen component

On mount:

1. Extract query params (client_id, redirect_uri, response_type, code_challenge, code_challenge_method, state, scope,
   resource)
2. Call `history.replaceState(null, '', window.location.pathname)` to scrub OAuth params from URL. This is
   defense-in-depth for browser history and casual observation only. It does NOT protect against scripts that run before
   the Vue component mounts (e.g., admin embeds). The URL params themselves are non-secret (client_id, code_challenge,
   state are all public values).
3. POST to `/mcp-oauth/authorize/validate` (XHR, sends session cookie)
4. On error with untrusted redirect (bad client_id/redirect_uri): show local error screen
5. On error with trusted redirect: redirect with error code + state + iss
6. On success: show consent screen

Consent screen displays:

- "Unverified third-party application" banner
- Client name
- Requested scope (mcp:access = "Access MCP tools and prompts")
- Redirect URI (prominently displayed, normalized host)
- Approve / Deny buttons

On approve/deny:

- Build hidden HTML form with `signed_params` (consent JWT) + `approved` (boolean)
- Submit form to POST /mcp-oauth/authorize/decision
- Browser follows 302 redirect natively (code never in JS)

```
test: unauthenticated user redirected to login, then back to consent page
test: valid params show consent screen with client name and redirect URI
test: invalid client_id shows local error (no redirect)
test: invalid redirect_uri shows local error (no redirect)
test: approve submits form and follows redirect
test: deny submits form and follows redirect with error=access_denied
test: error query param from decision endpoint displayed
```

---

## Execution Order

```
Phase 0: Foundation                                          -- 1 subagent
  Migration + env config (type-map.ts) + system data YAML + type changes (Accountability, DirectusTokenPayload)

---barrier---

Phase 1: Core implementation (all parallel)                  -- up to 7 subagents
  [A] Token source tracking + guards + mcp-aware auth (1A + 1H-1J)
  [B] Verify chain + accountability (1C-1D)
  [C] Session isolation in AuthenticationService (1E-1G)
  [D] Discovery + DCR service (2A-2B)
  [E] Authorization service (2C-2D)
  [F] Token exchange + refresh service (2E-2F)
  [G] Revocation + cleanup service + schedule (2G-2H)

Phase 2: Wiring + integration                               -- 2 subagents parallel
  [A] Controller + app.ts mounting + route tests
  [B] Integration test authoring

Vue consent page -> separate PR (frontend-only, no backend dependency)
```

---

## Files Changed (Summary)

### New files

- `api/src/database/migrations/YYYYMMDDA-add-mcp-oauth.ts`
- `api/src/services/mcp-oauth.ts`
- `api/src/services/mcp-oauth.test.ts`
- `api/src/controllers/mcp-oauth.ts`
- `api/src/controllers/mcp-oauth.test.ts`
- `api/src/middleware/mcp-oauth-guard.ts`
- `api/src/middleware/mcp-oauth-guard.test.ts`
- `api/src/schedules/oauth-cleanup.ts` (cleanup cannot piggyback on nonexistent session cleanup)
- `api/src/middleware/extract-token.test.ts` (new or modified)
- `app/src/views/mcp-oauth-authorize.vue` (deferred to separate PR)

### Modified files

- `api/src/middleware/extract-token.ts` (add tokenSource)
- `api/src/types/express.d.ts` (add tokenSource)
- `api/src/utils/verify-session-jwt.ts` (return oauth_client)
- `api/src/utils/get-accountability-for-token.ts` (populate oauth_client)
- `api/src/services/authentication.ts` (refresh guard, logout guard, updateStatefulSession)
- `api/src/websocket/authenticate.ts` (OAuth token rejection)
- `api/src/ai/mcp/server.ts` (401 discovery)
- `api/src/middleware/error-handler.ts` (MCP 401 conditional for /mcp paths)
- `api/src/app.ts` (route mounting, guard, feature flag)
- `app/src/router.ts` (consent route, deferred to separate PR)
- `packages/types/src/accountability.ts` (oauth_client field)
- `api/src/types/auth.ts` (scope, aud fields)
- `packages/env/src/constants/defaults.ts` (env vars)
- `packages/env/src/constants/type-map.ts` (boolean casting for MCP_OAUTH_ENABLED)
- `packages/system-data/src/fields/sessions.yaml` (add oauth_client field metadata)

### System data files (new)

- `packages/system-data/src/collections/` entries for oauth_clients, oauth_codes, oauth_consents, oauth_tokens
- `packages/system-data/src/fields/` YAML files for each new table
- `packages/system-data/src/relations/relations.yaml` (FK definitions)

---

## Appendix: Additional Test Cases from Review

These test cases were identified during the 5-reviewer implementation plan review and should be added to the
corresponding phases during implementation.

### Phase 2B (DCR)

```
test: redirect_uri exceeding 255 characters rejected
test: client_name with HTML tags is sanitized/rejected
test: client_name with null bytes rejected
test: http://127.0.0.1:8080/callback accepted (loopback variant)
test: http://[::1]:8080/callback accepted (loopback variant)
test: DCR response includes client_id_issued_at as integer unix timestamp
```

### Phase 2C (Authorization validation)

```
test: code_challenge_method=plain rejected (specific PKCE test)
test: response_type="code token" rejected (hybrid)
test: omitted scope defaults to mcp:access in validate response
test: empty scope string defaults to mcp:access
```

### Phase 2D (Authorization decision)

```
test: signed_params from user A rejected when submitted by user B (cross-user binding)
test: duplicate form fields in decision POST rejected as invalid_request
test: DB error during code issuance redirects with error=server_error, state, iss
test: redirect URL preserves existing query parameters from redirect_uri
test: denial redirect includes iss matching the authorization server issuer
```

### Phase 2E (Token exchange)

```
test: code_verifier with 42 chars returns invalid_request (boundary)
test: code_verifier with 43 chars passes format validation (boundary)
test: code_verifier with 128 chars passes format validation (boundary)
test: code_verifier with 129 chars returns invalid_request (boundary)
test: code_verifier with disallowed char ('+', space) returns invalid_request
test: missing code_verifier returns invalid_request
test: if grant creation fails (FK violation), code remains unused and retryable
test: code replay logs security warning with client_id and code_hash
test: token endpoint rate limiting enforced
```

### Phase 2F (Token refresh)

```
test: empty scope string on refresh accepted (inherits from grant)
test: scope=openid on refresh returns invalid_scope
test: reuse detection revokes both attacker's new session and grant (family-wide)
test: after reuse revocation, attacker's access token rejected on /mcp
test: OAuth refresh does NOT call updateStatefulSession / no grace period
```

### Phase 2H (Cleanup)

```
test: cleanup preserves unexpired unused codes (negative test)
test: cleanup preserves used codes younger than 1 hour (negative test)
test: expired grant cleanup also deletes the associated directus_sessions row
```

### Phase 1H (Global guard)

```
test: blocks OAuth sessions on /custom-extension-endpoint
test: blocks JWT with aud=<MCP resource URL> but no oauth_client (emitFilter bypass variant)
```

### Phase 3C (Controller)

```
test: OPTIONS preflight to /mcp-oauth/authorize/validate does not return ACAO header
test: validate rejects requests with missing Origin header
test: decision rejects requests with missing Origin header
test: POST /mcp-oauth/register with wrong Content-Type returns 400
test: POST /mcp-oauth/token with wrong Content-Type returns 400
test: GET /mcp-oauth/token returns 405
```

### Phase 4B (Vue consent page)

```
test: unauthenticated redirect to login preserves OAuth query params on return
test: decision form uses native HTML form submission (no fetch/XHR)
test: ?error=invalid_signature displays appropriate error message
test: ?error=expired displays appropriate error message
```
