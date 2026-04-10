# MCP OAuth: Client ID Metadata Document (CIMD) Support

Follow-up to the MCP OAuth stack (PRs 1-5). Adds CIMD as a client registration mechanism alongside the existing Dynamic
Client Registration (DCR), aligning with the MCP spec's preferred (SHOULD-level) registration method.

**Branch:** `mcp-oauth-6-cimd`

**Spec references:**

- [draft-ietf-oauth-client-id-metadata-document-01](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/)
  (Note: MCP spec 2025-11-25 references `-00`; we target `-01`. No breaking changes between versions.)
- [MCP Authorization Spec (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
- [RFC 7591 -- Dynamic Client Registration](https://datatracker.ietf.org/doc/html/rfc7591)
- [RFC 9111 -- HTTP Caching](https://datatracker.ietf.org/doc/html/rfc9111)

## Background

CIMD inverts the DCR model: instead of clients POSTing metadata to the server's registration endpoint, clients publish a
JSON metadata document at an HTTPS URL they control, and servers fetch it on demand. The URL IS the client identity --
stable, portable across servers, and self-asserted via domain control.

The MCP spec positions CIMD as the preferred default (SHOULD), with DCR as a backwards-compatibility fallback (MAY). Our
v1 implementation only supported DCR. This PR adds CIMD support.

## Scope

**In scope:**

- CIMD client_id detection, fetching, validation, and storage
- Server metadata advertisement (`client_id_metadata_document_supported: true`)
- DCR updated to accept optional metadata fields (`client_uri`, `logo_uri`, `tos_uri`, `policy_uri`)
- Consent page updated with unverified client warning (both DCR and CIMD)
- CIMD clients visible in admin listing with registration_type badge
- Independent enable/disable toggles for DCR and CIMD (env vars + settings UI)
- Optional domain allowlist for restricting CIMD clients (env-only)

**Not in scope:**

- `private_key_jwt` authentication (only `"none"` / public client + PKCE)
- `logo_uri` display on consent page (stored but not rendered -- SSRF, tracking, content injection risks)
- `tos_uri` / `policy_uri` links on consent page (phishing risk for unverified clients)
- Admin trust tiers (trusted domains showing full branding -- future work)

## Client ID Detection

Positive CIMD detection at every endpoint that receives a `client_id` parameter:

1. **Starts with `https://`?** -> Validate as CIMD URL -> CIMD flow if valid, reject if invalid
2. **Anything else** -> DB lookup (covers UUIDs, future pre-registered formats)

```typescript
function detectClientIdType(clientId: string): 'dcr' | 'cimd' | null {
	if (clientId.startsWith('https://')) {
		return isValidCimdClientId(clientId) ? 'cimd' : null;
	}
	// Everything else: DB lookup (UUID today, extensible for future formats)
	return 'dcr';
}
```

This detects CIMD positively rather than as a fallback, avoiding issues if we later add non-UUID pre-registered client
IDs (CIMD draft section 6.9 only says generated IDs should not start with `https://`).

### CIMD URL Validation

Strict validation based on the IETF CIMD draft and AT Protocol implementation:

| Check                                                     | Rationale                                               |
| --------------------------------------------------------- | ------------------------------------------------------- |
| Valid URL (parseable by `new URL()`)                      | Basic                                                   |
| Scheme is `https:`                                        | No HTTP, no other schemes                               |
| Has non-root path (`pathname !== "/"`, `pathname !== ""`) | Root URLs are not metadata documents                    |
| No query string (`search === ""`)                         | Prevents cache poisoning via query parameter variations |
| No fragment (`hash === ""`)                               | Fragments are client-side, meaningless for fetch        |
| No credentials (`username === ""` && `password === ""`)   | Embedded creds are suspicious                           |
| No dot segments in path (no `.` or `..` segments)         | Prevents path traversal / normalization tricks          |
| Hostname is not an IP address                             | Domain ownership is the trust anchor, IPs have none     |
| No reserved TLDs                                          | Can't verify domain control for special-use TLDs        |
| URL length <= 255 characters                              | PK column constraint; IETF draft recommends short URLs  |
| Canonical form: `new URL(input).href === input`           | Prevents normalization-based bypasses                   |

**Reserved TLD blocklist** -- configurable via `MCP_OAUTH_CIMD_BLOCKED_TLDS` env var (comma-separated). Defaults:

| TLD          | RFC  | Reason                   |
| ------------ | ---- | ------------------------ |
| `.test`      | 6761 | Testing, never delegated |
| `.localhost` | 6761 | Loopback                 |
| `.invalid`   | 6761 | Always invalid           |
| `.example`   | 6761 | Documentation only       |
| `.local`     | 6762 | mDNS, not in global DNS  |
| `.onion`     | 7686 | Tor hidden services      |

Operators can add `.internal` (RFC 9476) or `.arpa` if their threat model requires it. The defaults cover TLDs that are
clearly non-routable and can never represent verifiable domain ownership.

```typescript
import { isIP } from 'node:net';

// Default: test,localhost,invalid,example,local,onion
// Configurable via MCP_OAUTH_CIMD_BLOCKED_TLDS env var
const blockedTlds = getBlockedTlds();

function isValidCimdClientId(input: string): boolean {
	let url: URL;
	try {
		url = new URL(input);
	} catch {
		logger.debug({ client_id: input, reason: 'unparseable' }, 'CIMD client_id rejected');
		return false;
	}

	const reject = (reason: string) => {
		logger.debug({ client_id: input, reason }, 'CIMD client_id rejected');
		return false;
	};

	if (url.protocol !== 'https:') return reject('not_https');
	if (url.pathname === '/' || url.pathname === '') return reject('root_path');
	if (url.search !== '') return reject('has_query');
	if (url.hash !== '') return reject('has_fragment');
	if (url.username !== '' || url.password !== '') return reject('has_credentials');
	if (url.pathname.split('/').some((s) => s === '.' || s === '..')) return reject('dot_segments');
	if (isIP(url.hostname) !== 0) return reject('ip_hostname');
	if (blockedTlds.some((tld) => url.hostname.toLowerCase().endsWith(tld))) return reject('blocked_tld');
	if (input.length > 255) return reject('too_long');
	if (url.href !== input) return reject('not_canonical');

	return true;
}
```

Each rejection is debug-logged with a structured `reason` tag for operator troubleshooting.

## Metadata Fetching

Uses the existing SSRF-protected HTTP client (`getAxios()` from `api/src/request/`).

**Fetch constraints:**

- `maxRedirects: 0` (no redirects -- CIMD draft Section 4 MUST NOT follow redirects; axios throws on 3xx, treated same
  as 4xx/5xx. Error handling should distinguish redirect errors for clear logging.)
- `maxContentLength: 5120` (5KB limit -- CIMD draft recommends max 5KB, not a normative SHOULD)
- `timeout: 3000` (3 seconds)
- Response must be HTTP 200 with `Content-Type` matching `application/json` or `application/*+json` (implementation
  policy; the CIMD draft is permissive about Content-Type, saying the document "MAY also be served with more specific
  content types as long as the response is JSON")

**SSRF protection** is handled by `getAxios()` which validates resolved IPs against `IMPORT_IP_DENY_LIST` at
socket/connection level (immune to URL obfuscation). The default deny list (`['0.0.0.0', '169.254.169.254']`) blocks the
local machine's interfaces and the AWS metadata endpoint. Note: it does not block all RFC 6890 special-use space on
other hosts (see CMS-2100). For CIMD specifically, the `isIP()` check in URL validation blocks IP-address hostnames
before any fetch attempt, providing an additional layer of protection.

## Metadata Document Validation

After fetching, validate the document structure. Add verified RFC section references when implementing.

**Required fields:**

1. `client_id` -- MUST equal the fetch URL exactly (CIMD draft Section 4.1)
2. `client_name` -- MUST be present, non-empty string (required by MCP spec, not CIMD draft)
3. `redirect_uris` -- MUST be present, non-empty array (required by MCP spec, not CIMD draft). Each URI validated same
   as DCR (HTTPS or localhost, no fragments)

**Defaulted fields:** 4. `grant_types` -- if present, must include `authorization_code`. Default:
`["authorization_code"]` 5. `response_types` -- if present, must be `["code"]`. Default: `["code"]`

**Authentication method validation:**

| `token_endpoint_auth_method` value | Result                      | Reason                                                           |
| ---------------------------------- | --------------------------- | ---------------------------------------------------------------- |
| absent                             | accept, default to `"none"` | Server policy: CIMD clients are public, shared secrets forbidden |
| `"none"`                           | accept                      | Public client + PKCE                                             |
| `"client_secret_basic"`            | reject                      | Forbidden by CIMD draft (shared secret)                          |
| `"client_secret_post"`             | reject                      | Forbidden by CIMD draft (shared secret)                          |
| `"client_secret_jwt"`              | reject                      | Forbidden by CIMD draft (shared secret)                          |
| `"private_key_jwt"`                | reject                      | Valid per CIMD draft, not supported by our server                |
| anything else                      | reject                      | Unknown method                                                   |

Error messages differentiate between spec-forbidden and server-unsupported methods.

**Forbidden fields:** 6. `client_secret` -- MUST NOT be present (reject if found) 7. `client_secret_expires_at` -- MUST
NOT be present (reject if found)

**Optional fields (stored if present):** 8. `client_uri`, `logo_uri`, `tos_uri`, `policy_uri` -- validated as HTTPS URLs
if present

**Unknown fields:** silently ignored (same as DCR per RFC 7591).

## Storage: Persistent CIMD

CIMD clients get a row in `directus_oauth_clients`, same table as DCR clients. The DB row is a cache of the fetched
metadata -- the source of truth remains the URL. This approach preserves all existing FK relationships (codes, tokens,
consents, sessions reference the clients table).

Prior art: Authlete and Keycloak both use the persistent model. AT Protocol uses ephemeral (no DB row, URL stored
directly in token tables), but our FK depth makes that impractical.

**Two resolution modes:**

`resolveClientWithFetch(clientId)` -- used only by `/authorize`. May trigger HTTP fetch:

```
resolveClientWithFetch(clientId)
  -> detectClientIdType(clientId)
     'dcr'  -> SELECT from directus_oauth_clients WHERE client_id = ?
     'cimd' -> SELECT from directus_oauth_clients WHERE client_id = ?
               -> row exists, metadata_expires_at > now  -> return row (no fetch)
               -> row exists, metadata_expires_at <= now  -> re-fetch (conditional)
                  -> 304 Not Modified: update metadata_expires_at, return row
                     (use new Cache-Control if present, else same TTL as before, else 1h default)
                  -> 200: validate, overwrite row, return row
                  -> failure: block request, return error
               -> no row -> fetch metadata, validate, INSERT row, return row
                  (on constraint violation from concurrent insert: SELECT existing row)
     null   -> reject (invalid_client)
```

`resolveClientFromDb(clientId)` -- used by `/token` (exchange + refresh) and `/revoke`. DB lookup only, never fetches:

```
resolveClientFromDb(clientId)
  -> SELECT from directus_oauth_clients WHERE client_id = ?
  -> row exists -> return row
  -> no row    -> reject (invalid_client)
```

Token exchange and refresh must not trigger CIMD fetches because: (a) it adds latency to machine-to-machine requests,
(b) a temporary metadata fetch failure would break valid token exchanges, and (c) the IETF draft does not require
re-validation at the token endpoint -- `/authorize` is the trust establishment point.

**Re-fetch behavior:** silent overwrite on metadata change. No token revocation, no diff-checking. Same as Keycloak and
AT Protocol. Existing tokens remain valid regardless of metadata changes. This is a conscious tradeoff: CIMD draft
section 6.3 says servers "should consider" the security impact of metadata changes. For v1, silent overwrite matches
industry precedent. Future work may add consent invalidation for changes to `redirect_uris` or
`token_endpoint_auth_method`.

**CIMD client cap:** shares the existing `MCP_OAUTH_MAX_CLIENTS` limit with DCR clients. Total registered + CIMD clients
cannot exceed the cap. This prevents unbounded row growth from attacker-generated CIMD URLs.

**On fetch failure:** block the current `/authorize` request (render error page or return OAuth error). Existing tokens
from prior successful fetches remain valid.

**Concurrent first-use:** if two `/authorize` requests race for the same CIMD client_id, both fetch and attempt INSERT.
The second INSERT hits a PK constraint violation. Catch the error, SELECT the existing row, and continue. Matches the
existing pattern in `processDecision` for concurrent consent inserts.

## Cache TTL

Three columns track cache freshness:

| Column                | Type        | Purpose                                           |
| --------------------- | ----------- | ------------------------------------------------- |
| `metadata_fetched_at` | timestamp   | When we last successfully fetched (audit trail)   |
| `metadata_expires_at` | timestamp   | When cached metadata goes stale (freshness check) |
| `metadata_etag`       | string(255) | ETag for conditional re-fetch (bandwidth savings) |

**TTL resolution** (per RFC 9111):

- `Cache-Control: no-store` -- treated as `no-cache` (always revalidate). RFC 9111 defines `no-store` for HTTP caches,
  not application databases. True transient handling is incompatible with our FK model (codes, tokens, consents all FK
  to the client row). Persisting but always revalidating is the practical equivalent.
- `Cache-Control: no-cache` -- persist but always revalidate (set `metadata_expires_at` to now)
- `Cache-Control: max-age=N` -- use N, clamped between 5 minutes (floor) and 24 hours (ceiling)
- `Expires` header -- used as fallback when no `Cache-Control` is present; clamped to same bounds
- No cache headers at all -- default to 1 hour
- Conditional re-fetch: send `If-None-Match: <metadata_etag>` when stale

**ETag lifecycle:**

- Populated from the `ETag` response header on 200 responses
- Cleared (set null) if 200 response has no `ETag` header
- Preserved on 304 Not Modified responses

**304 TTL behavior:**

- If 304 response includes `Cache-Control: max-age`: use that (clamped)
- If 304 response has no cache headers: reuse the previous TTL
- If no previous TTL available: use 1 hour default

## Schema Changes

New additive migration adding columns to `directus_oauth_clients`:

| Column                | Type          | Nullable | Default | Purpose                             |
| --------------------- | ------------- | -------- | ------- | ----------------------------------- |
| `registration_type`   | `string(10)`  | no       | `'dcr'` | `'dcr'` or `'cimd'`                 |
| `client_uri`          | `text`        | yes      | null    | Client homepage                     |
| `logo_uri`            | `text`        | yes      | null    | Client logo (stored, not displayed) |
| `tos_uri`             | `text`        | yes      | null    | Terms of service                    |
| `policy_uri`          | `text`        | yes      | null    | Privacy policy                      |
| `metadata_fetched_at` | `timestamp`   | yes      | null    | Last successful CIMD fetch          |
| `metadata_expires_at` | `timestamp`   | yes      | null    | When cached metadata goes stale     |
| `metadata_etag`       | `string(255)` | yes      | null    | ETag for conditional re-fetch       |

- `registration_type` defaults to `'dcr'` so existing rows are automatically correct
- Metadata cache columns are null for DCR clients
- URI columns use `text` type (stores off-page in MySQL, avoids row size limit issues with multiple long varchar
  columns)
- No new tables, no FK changes

**Settings migration** -- two new boolean columns in `directus_settings`:

| Column                   | Type    | Default | Purpose                                  |
| ------------------------ | ------- | ------- | ---------------------------------------- |
| `mcp_oauth_dcr_enabled`  | boolean | `true`  | Enable/disable DCR registration endpoint |
| `mcp_oauth_cimd_enabled` | boolean | `false` | Enable/disable CIMD client_id detection  |

**System data:** field definitions for all new columns in `packages/system-data`.

## Server Metadata & Discovery

**Authorization Server Metadata** (`/.well-known/oauth-authorization-server`):

- Add `client_id_metadata_document_supported: true` when CIMD is enabled
- Omit `client_id_metadata_document_supported` when CIMD is disabled
- Omit `registration_endpoint` when DCR is disabled
- Both fields conditional on their respective toggles

No changes to Protected Resource Metadata.

## Settings & Toggles

| Config                           | Type                | Default                                      | Scope                                |
| -------------------------------- | ------------------- | -------------------------------------------- | ------------------------------------ |
| `MCP_OAUTH_DCR_ENABLED`          | env var             | `true`                                       | Enable/disable DCR                   |
| `MCP_OAUTH_CIMD_ENABLED`         | env var             | `true`                                       | Enable/disable CIMD                  |
| `MCP_OAUTH_CIMD_ALLOWED_DOMAINS` | env var             | (empty)                                      | Domain allowlist, empty = accept all |
| `MCP_OAUTH_CIMD_BLOCKED_TLDS`    | env var             | `test,localhost,invalid,example,local,onion` | TLD blocklist for client_id URLs     |
| `MCP_OAUTH_CIMD_ALLOW_HTTP`      | env var             | `false`                                      | Dev/test: allow HTTP client_id URLs  |
| `mcp_oauth_dcr_enabled`          | setting + UI toggle | `true`                                       | Enable/disable DCR                   |
| `mcp_oauth_cimd_enabled`         | setting + UI toggle | `false`                                      | Enable/disable CIMD                  |

**Resolution:** both env var AND setting must be true for the feature to be active. Env vars default to `true` (allow),
settings default vary: DCR defaults `true` (preserve existing behavior on upgrade), CIMD defaults `false` (new feature,
opt-in). This means:

- Fresh install: DCR is on (existing behavior preserved), CIMD is off (admin must opt in via UI)
- Env var set to `false`: blocks the feature entirely regardless of setting (infrastructure-level lockdown)
- Same pattern as existing `mcp_oauth_enabled`

Note: `MCP_OAUTH_ENABLED` (the parent toggle) defaults to `false`, while `MCP_OAUTH_DCR_ENABLED` /
`MCP_OAUTH_CIMD_ENABLED` default to `true`. This is intentional: the parent is the opt-in gate, the sub-toggles are
allow/block switches.

**Gating mechanism:** env vars are checked per-request inside the service methods (same as how `checkOAuthSettings`
middleware queries `mcp_oauth_enabled` from the DB). The existing `checkOAuthSettings` middleware continues to check the
global `mcp_oauth_enabled` gate. DCR/CIMD checks are separate, inside the relevant service methods:

- DCR gate: checked at the start of `registerClient()`, returns 404 if disabled
- CIMD gate: checked inside `resolveClientWithFetch()` before any fetch attempt, returns `invalid_client` if disabled

**Env defaults:** all new env vars must be registered in `packages/env/src/constants/defaults.ts` with their default
values and in `packages/env/src/constants/directus-variables.ts` for env var validation.

**Settings UI descriptions:**

- DCR: "Allow MCP clients to register automatically using the OAuth 2.0 Dynamic Client Registration protocol (RFC
  7591)."
- CIMD: "Allow MCP clients to identify themselves using an HTTPS URL that hosts their metadata, without explicit
  registration (IETF draft-oauth-client-id-metadata-document)."

**Impact when disabled:**

- DCR disabled: `POST /register` returns 404
- CIMD disabled: non-UUID `client_id` at `/authorize` returns `invalid_client`. Token exchange and refresh for
  already-cached CIMD clients continue to work (same drain-naturally pattern as `mcp_oauth_enabled` -- disabling doesn't
  revoke existing tokens)

## Domain Allowlist

**Env var:** `MCP_OAUTH_CIMD_ALLOWED_DOMAINS`

Format: comma-separated domain list with optional wildcard prefix.

```
MCP_OAUTH_CIMD_ALLOWED_DOMAINS=cursor.com,*.anthropic.com,claude.ai
```

**Matching rules:**

- Empty / unset: accept any valid CIMD URL (open, default)
- Exact match: `cursor.com` matches only `cursor.com`
- Wildcard prefix: `*.anthropic.com` matches `tools.anthropic.com`, `dev.tools.anthropic.com`, but not `anthropic.com`
- Case-insensitive
- Checked after URL validation passes, before any fetch attempt
- Rejection returns `invalid_client` OAuth error

```typescript
function isDomainAllowed(hostname: string, patterns: string[]): boolean {
	const lower = hostname.toLowerCase();

	for (const pattern of patterns) {
		const p = pattern.toLowerCase().trim();

		if (p.startsWith('*.')) {
			const suffix = p.slice(1); // ".example.com"
			if (lower.endsWith(suffix)) return true;
		} else {
			if (lower === p) return true;
		}
	}

	return false;
}
```

No glob library -- `endsWith` for wildcards, `===` for exact. Same approach as Keycloak's `trusted-hosts`.

## Consent Page Changes

Uniform trust model: all dynamically registered clients (both DCR and CIMD) are unverified. Same warning for both.

**Updated layout:**

```
[Project Logo]
"ClientName is requesting access"
+----------------------------------+
| DETAILS                          |
| Name         My Cool Tool        |
| Domain       tools.acme.com      |  <- CIMD only
| Redirect URI http://localhost..  |
|              Local application   |  <- indicator
+----------------------------------+
"This MCP client is requesting to be
authorized. If you approve, it will
be able to access data on ProjectName
on your behalf. This application has
not been verified by ProjectName."
                  [Cancel] [Approve]
```

**Changes from current:**

1. **Domain row** -- CIMD only. Extracted from `client_id` URL hostname. Not shown for DCR.
2. **Unverified warning** -- appended to existing note text. Applies to both DCR and CIMD.
3. **Redirect URI indicators** (subtle inline text):
   - `localhost` / `127.0.0.1`: "Redirects to your local machine. Another application on this device could intercept
     this authorization." (warning -- per MCP spec, ASes SHOULD display additional warnings for localhost-only redirects
     due to the documented impersonation attack via attacker-controlled localhost ports)
   - Redirect origin differs from `client_id` origin (CIMD only): "Different domain" (warning)
   - Bare IP (non-loopback): "IP address" (warning)

**No changes:** project logo stays as-is (no client logo), no ToS/policy links.

**Renderer:** `ConsentPageData` gets optional `clientDomain?: string` and `registrationType: 'dcr' | 'cimd'`. Liquid
template uses conditionals for CIMD-specific rows.

## DCR Changes

`registerClient()` updated to accept and store optional metadata fields:

- `client_uri`, `logo_uri`, `tos_uri`, `policy_uri`
- Validated as HTTPS URLs if present, reasonable length cap
- Stored in new columns, displayed in admin detail page
- Set `registration_type: 'dcr'` explicitly on insert

No other behavioral changes to DCR.

## Service Layer

**New methods on `McpOAuthService`:**

- `resolveClientWithFetch(clientId: string)` -- client resolution with CIMD fetch capability. Detection -> DB lookup ->
  cache check -> fetch if needed -> upsert -> return client row. Used only by `validateAuthorizationRequest`.
- `resolveClientFromDb(clientId: string)` -- DB-only client lookup. Used by `exchangeCode`, `refreshToken`,
  `revokeToken`.
- `fetchCimdMetadata(clientId: string)` -- fetch and validate the metadata document. Returns parsed metadata or throws
  `OAuthError('invalid_client', ...)`.

**Modified methods:**

- `registerClient(body)` -- accept optional metadata fields, set `registration_type: 'dcr'`
- `validateAuthorizationRequest()` -- replace direct DB lookup with `resolveClientWithFetch()`. Pass `registrationType`
  and `clientDomain` to consent page data.
- `exchangeCode()`, `refreshToken()`, `revokeToken()` -- replace direct DB lookup with `resolveClientFromDb()`
- `serverMetadata()` -- conditionally include `client_id_metadata_document_supported` and `registration_endpoint`

**Cleanup:** no changes. Existing two-tier cleanup (never-authorized + idle clients) applies uniformly to both DCR and
CIMD client rows. CIMD clients get a consent record within seconds of row creation (user approves during the same
`/authorize` flow), so tier-1 cleanup (never-authorized) only catches abandoned CIMD flows -- correct behavior.

## Admin UI

**Client listing:** CIMD clients appear in the same list with a `registration_type` badge/tag.

**Client detail page:** shows all new fields (`client_uri`, `logo_uri`, `tos_uri`, `policy_uri`) for both types when
present. CIMD-specific cache fields (`metadata_fetched_at`, `metadata_expires_at`) shown for CIMD clients only. All
fields read-only. Revoke-only actions (existing behavior).

**Settings page:** two new toggles under MCP OAuth section with descriptions.

## Testing

**Unit tests (`mcp-oauth.test.ts`):**

- `isValidCimdClientId()` -- exhaustive: valid URLs, missing path, IP hostnames, blocked TLDs, fragments, credentials,
  dot segments, non-canonical form, HTTP scheme
- `detectClientIdType()` -- UUID vs CIMD vs invalid
- `isDomainAllowed()` -- exact match, wildcard match, case insensitivity, no match
- `fetchCimdMetadata()` -- valid doc, client_id mismatch, missing required fields, forbidden `client_secret` field,
  forbidden shared-secret auth methods, oversized response, non-200 status, timeout, non-JSON content type
- `resolveClient()` -- fresh cache hit (skip fetch), stale cache (re-fetch), 304 not modified, new CIMD client (insert),
  fetch failure with no cache (error), fetch failure with stale cache (error)
- `registerClient()` -- accepts and stores optional metadata fields
- `serverMetadata()` -- includes/omits `client_id_metadata_document_supported` and `registration_endpoint` based on
  settings

**Blackbox tests:**

- Spin up tiny HTTP server in test setup serving a static metadata JSON document
- Full CIMD authorize flow: `/authorize` with URL client_id -> consent -> decision -> token exchange -> refresh ->
  revoke
- Settings gates: CIMD disabled returns `invalid_client`, DCR disabled returns 404 on `/register`
- Domain allowlist: allowed domain succeeds, blocked domain returns `invalid_client`
- Invalid metadata documents: missing `client_name`, mismatched `client_id`, `client_secret` present
- Cache behavior: second `/authorize` with same client_id doesn't re-fetch (verify via server hit count)

**Not tested (covered elsewhere):**

- SSRF protection (existing `api/src/request/` test suite)
- Logo/ToS display (not implemented)

## Design Decisions

| Decision            | Choice                              | Rationale                                                               |
| ------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| Storage model       | Persistent (DB row)                 | FK depth makes ephemeral impractical. Authlete/Keycloak precedent.      |
| Re-fetch on change  | Silent overwrite                    | Keycloak and AT Protocol both do this. No token revocation.             |
| Auth methods        | `"none"` only                       | `private_key_jwt` not required by any spec for CIMD. Keeps scope small. |
| Trust policy        | Open by default                     | Matches FastMCP. Domain allowlist for restriction.                      |
| Consent trust model | Uniform unverified                  | Both DCR and CIMD are self-asserted, same warning.                      |
| Logo display        | Stored, not shown                   | SSRF, tracking, content injection risks. Future work behind trust tier. |
| ToS/policy links    | Stored, not shown                   | Phishing risk for unverified clients. Future work behind trust tier.    |
| Cache TTL           | 5min floor, 24h ceiling, 1h default | Matches Authlete (24h cap). Avoids excessive fetching.                  |
| Domain matching     | Simple endsWith + exact             | No glob library needed. Keycloak uses same approach.                    |
| Cleanup             | Same as DCR                         | Existing two-tier cleanup applies uniformly.                            |

## Spec Deviations

Intentional deviations from the IETF CIMD draft where we are stricter than required:

| Area           | Draft says                                 | We do                           | Reason                                                  |
| -------------- | ------------------------------------------ | ------------------------------- | ------------------------------------------------------- |
| Query strings  | SHOULD NOT be used                         | Rejected (MUST NOT)             | Prevents cache poisoning via query parameter variations |
| Root path      | MUST have a path component (`/` qualifies) | Rejected (must be non-root)     | No real-world metadata document lives at root           |
| Canonical form | Not explicitly required                    | Required (`url.href === input`) | Prevents normalization-based bypasses                   |
| URL length     | No limit specified                         | Max 255 characters              | PK column constraint; draft recommends short URLs       |

These deviations are documented so MCP clients know why otherwise-valid inputs may be rejected.

## Not In Scope (Future Work)

- `private_key_jwt` support for confidential CIMD clients
- Admin trust tiers (allowlisted domains get `client_name`, `logo_uri` display on consent)
- Server-side logo fetch, sanitization, and caching pipeline
- ToS/policy links for trusted clients
- Pre-registered client support
- CIMD domain reputation / age checks
- Consent invalidation on security-relevant metadata changes (`redirect_uris`, `token_endpoint_auth_method`)
