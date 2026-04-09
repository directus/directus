import crypto from 'node:crypto';
import { Action } from '@directus/constants';
import { useEnv } from '@directus/env';
import type { AbstractServiceOptions, Accountability, SchemaOverview } from '@directus/types';
import jwt from 'jsonwebtoken';
import type { Knex } from 'knex';
import { getMcpUrls, MCP_ACCESS_SCOPE } from '../ai/mcp/utils.js';
import getDatabase from '../database/index.js';
import { useLogger } from '../logger/index.js';
import { fetchRolesTree } from '../permissions/lib/fetch-roles-tree.js';
import { fetchGlobalAccess } from '../permissions/modules/fetch-global-access/fetch-global-access.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';
import { getSecret } from '../utils/get-secret.js';
import { parseOAuthScope } from '../utils/parse-oauth-scope.js';
import { Url } from '../utils/url.js';
import { ActivityService } from './activity.js';

const DEFAULT_UNUSED_CLIENT_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3d -- matches env default
const MAX_REDIRECT_URIS = 10;
const MAX_REDIRECT_URI_LENGTH = 255;
const MAX_CLIENT_NAME_LENGTH = 200;

/** Consent JWT typ claim -- prevents token confusion with regular Directus JWTs */
const CONSENT_JWT_TYP = 'directus-mcp-consent+jwt';
/** Consent JWT audience -- binds the token to the decision endpoint */
const CONSENT_JWT_AUD = 'mcp-oauth-authorize-decision';

/**
 * RFC 6749/7591 error with structured code for JSON serialization.
 *
 * `code` maps to the OAuth `error` field. `redirectable` controls whether
 * the controller can redirect the error back to the client's redirect_uri
 * (only safe after redirect_uri is validated against registered URIs).
 */
export class OAuthError extends Error {
	constructor(
		public status: number,
		public code: string,
		public description: string,
		public redirectable: boolean = false,
	) {
		super(description);
		this.name = 'OAuthError';
	}
}

/** RFC 7591 Dynamic Client Registration response. */
export interface DCRResponse {
	client_id: string;
	client_name: string;
	redirect_uris: string[];
	grant_types: string[];
	response_types: string[];
	token_endpoint_auth_method: string;
	client_id_issued_at: number;
}

/** Authorization validation result. `signed_params` is an HMAC-SHA256 consent JWT. */
export interface ValidateResponse {
	signed_params: string;
	client_name: string;
	already_consented: boolean;
	redirect_uri: string;
	scope: string;
}

/** POST body for the consent decision endpoint. `approved` is string "true"/"false" from form POST. */
export interface DecisionParams {
	signed_params: string;
	approved: boolean;
}

/** RFC 6749 Section 4.1.3 token request (authorization_code grant). */
export interface TokenParams {
	grant_type?: string;
	client_id?: string;
	code?: string;
	redirect_uri?: string;
	code_verifier?: string;
	resource?: string;
}

/** RFC 6749 Section 5.1 token response. `refresh_token` is the raw session token (not hashed). */
export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	scope: string;
}

/** Request context captured at the controller layer for session and activity records. */
export interface TokenContext {
	ip: string;
	userAgent: string;
}

/** RFC 6749 Section 6 refresh token request. */
export interface RefreshParams {
	grant_type?: string;
	client_id?: string;
	refresh_token?: string;
	resource?: string;
	scope?: string;
}

/** RFC 7009 token revocation request. Always returns 200 (idempotent). */
export interface RevokeParams {
	token?: string;
	client_id?: string;
	token_type_hint?: string;
}

/** RFC 7636 Section 4.1: code_verifier uses unreserved characters, 43-128 length */
const CODE_VERIFIER_RE = /^[A-Za-z0-9\-._~]{43,128}$/;

/** RFC 7636 Section 4.2: S256 code_challenge is base64url-encoded SHA-256 (always 43 chars) */
const CODE_CHALLENGE_S256_RE = /^[A-Za-z0-9_-]{43}$/;

/** Params checked for duplicates before redirect_uri validation (non-redirectable errors) */
const PRE_TRUST_DUPLICATE_PARAMS = ['client_id', 'redirect_uri'] as const;

/** Params checked for duplicates after redirect_uri validation (redirectable errors) */
const POST_TRUST_DUPLICATE_PARAMS = [
	'response_type',
	'code_challenge',
	'code_challenge_method',
	'scope',
	'resource',
	'state',
	'response_mode',
] as const;

function checkDuplicateParams(params: Record<string, unknown>, keys: readonly string[], redirectable: boolean): void {
	for (const key of keys) {
		if (Array.isArray(params[key])) {
			throw new OAuthError(400, 'invalid_request', `Duplicate parameter: ${key}`, redirectable);
		}
	}
}

/**
 * OAuth 2.1 authorization server for MCP (Model Context Protocol) access.
 *
 * Implements public-client profile with mandatory PKCE:
 * - RFC 6749 / OAuth 2.1: authorization code grant, refresh token rotation
 * - RFC 7636: PKCE (S256 only, required for all flows)
 * - RFC 7591: Dynamic Client Registration (public clients, MCP_OAUTH_MAX_CLIENTS cap)
 * - RFC 8707: Resource Indicators (`resource` param bound to token audience)
 * - RFC 9728: Protected Resource Metadata discovery
 * - RFC 8414: Authorization Server Metadata discovery
 *
 * Security properties: codes stored as SHA-256 hashes, PKCE verified with timing-safe
 * compare, authorization codes burned atomically (UPDATE WHERE used_at IS NULL) before
 * validation, refresh tokens rotated with reuse detection.
 */
export class McpOAuthService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	/**
	 * RFC 9728 Protected Resource Metadata.
	 *
	 * Called by `GET /.well-known/oauth-protected-resource*`. This is the first endpoint an MCP
	 * client hits -- it discovers which authorization server protects the `/mcp` resource.
	 */
	getProtectedResourceMetadata(): Record<string, unknown> {
		const { issuerUrl, resourceUrl } = getMcpUrls();

		return {
			resource: resourceUrl,
			authorization_servers: [issuerUrl],
			scopes_supported: [MCP_ACCESS_SCOPE],
		};
	}

	/**
	 * RFC 8414 Authorization Server Metadata.
	 *
	 * Called by `GET /.well-known/oauth-authorization-server*`. The client fetches this after
	 * discovering the AS from the protected resource metadata, then uses the endpoint URLs
	 * to register (DCR) and start the authorization flow.
	 */
	getAuthorizationServerMetadata(): Record<string, unknown> {
		const { issuerUrl } = getMcpUrls();
		const env = useEnv();
		const baseUrl = env['PUBLIC_URL'] as string;

		const authorizationEndpoint = new Url(baseUrl).addPath('mcp-oauth', 'authorize');
		const tokenEndpoint = new Url(baseUrl).addPath('mcp-oauth', 'token');
		const registrationEndpoint = new Url(baseUrl).addPath('mcp-oauth', 'register');
		const revocationEndpoint = new Url(baseUrl).addPath('mcp-oauth', 'revoke');

		return {
			issuer: issuerUrl,
			authorization_endpoint: authorizationEndpoint.toString(),
			token_endpoint: tokenEndpoint.toString(),
			registration_endpoint: registrationEndpoint.toString(),
			revocation_endpoint: revocationEndpoint.toString(),
			response_types_supported: ['code'],
			grant_types_supported: ['authorization_code', 'refresh_token'],
			token_endpoint_auth_methods_supported: ['none'],
			revocation_endpoint_auth_methods_supported: ['none'],
			code_challenge_methods_supported: ['S256'],
			scopes_supported: [MCP_ACCESS_SCOPE],
			response_modes_supported: ['query'],
			authorization_response_iss_parameter_supported: true,
		};
	}

	/**
	 * RFC 7591 Dynamic Client Registration.
	 *
	 * Called by `POST /mcp-oauth/register`. This is how MCP clients self-register before
	 * starting the authorization flow. No authentication required.
	 *
	 * Validates: client_name, redirect_uris (HTTPS or localhost, no fragments),
	 * grant_types (must include authorization_code), token_endpoint_auth_method (only "none").
	 * Enforces a global cap via MCP_OAUTH_MAX_CLIENTS (default 10,000). client_id is a random UUID (not a secret).
	 *
	 * @param body - Raw request body (validated internally)
	 * @returns DCR response with assigned client_id
	 * @throws {OAuthError} `invalid_client_metadata` or `invalid_redirect_uri`
	 */
	async registerClient(body: unknown): Promise<DCRResponse> {
		const input = body as Record<string, unknown>;
		const env = useEnv();

		// RFC 7591 Section 2: client_name is REQUIRED
		const clientName = input['client_name'];

		if (typeof clientName !== 'string' || clientName.length === 0) {
			throw new OAuthError(400, 'invalid_client_metadata', 'client_name is required');
		}

		// Policy: length cap to prevent abuse via unauthenticated DCR
		if (clientName.length > MAX_CLIENT_NAME_LENGTH) {
			throw new OAuthError(
				400,
				'invalid_client_metadata',
				`client_name must not exceed ${MAX_CLIENT_NAME_LENGTH} characters`,
			);
		}

		// RFC 7591 Section 2: redirect_uris REQUIRED for authorization_code grant
		const redirectUris = input['redirect_uris'];

		if (!Array.isArray(redirectUris) || redirectUris.length === 0) {
			throw new OAuthError(400, 'invalid_redirect_uri', 'At least one redirect_uri is required');
		}

		// Policy: cap count to prevent abuse via unauthenticated DCR
		if (redirectUris.length > MAX_REDIRECT_URIS) {
			throw new OAuthError(400, 'invalid_redirect_uri', `Maximum ${MAX_REDIRECT_URIS} redirect URIs allowed`);
		}

		// RFC 6749 Section 3.1.2: redirect URIs must be absolute, no fragment
		// Policy: HTTPS required (localhost excepted), no userinfo
		for (const uri of redirectUris) {
			this.validateRedirectUri(uri);
		}

		// RFC 7591 Section 2: grant_types determines what grants the client can use
		const grantTypes = input['grant_types'];

		if (!Array.isArray(grantTypes) || grantTypes.length === 0) {
			throw new OAuthError(
				400,
				'invalid_client_metadata',
				'grant_types is required and must include authorization_code',
			);
		}

		if (!grantTypes.includes('authorization_code')) {
			throw new OAuthError(400, 'invalid_client_metadata', 'grant_types must include authorization_code');
		}

		// Policy: only authorization_code and refresh_token supported
		const allowedGrantTypes = ['authorization_code', 'refresh_token'];

		if (grantTypes.some((gt: string) => !allowedGrantTypes.includes(gt))) {
			throw new OAuthError(400, 'invalid_client_metadata', 'Unsupported grant type');
		}

		// RFC 7591 Section 2: spec defaults to client_secret_basic if omitted, but Section 3.1
		// allows the server to override requested metadata. We default to none because:
		// 1. We never issue client_secrets, so client_secret_basic is impossible to fulfill
		// 2. AS metadata advertises token_endpoint_auth_methods_supported: ['none']
		// 3. A client expecting client_secret_basic would fail at token exchange (no secret), which is correct
		const authMethod = input['token_endpoint_auth_method'] ?? 'none';

		if (authMethod !== 'none') {
			throw new OAuthError(400, 'invalid_client_metadata', 'Only token_endpoint_auth_method "none" is supported');
		}

		// RFC 7591 Section 2: response_types derived from grant_types if omitted
		const responseTypes = input['response_types'] as string[] | undefined;

		if (responseTypes !== undefined) {
			if (!Array.isArray(responseTypes) || responseTypes.length !== 1 || responseTypes[0] !== 'code') {
				throw new OAuthError(400, 'invalid_client_metadata', 'Only response_types ["code"] is supported');
			}
		}

		// Policy: global client cap to bound table growth from unauthenticated DCR (0 disables)
		const parsed = Number(env['MCP_OAUTH_MAX_CLIENTS']);
		const maxClients = Number.isNaN(parsed) ? 10_000 : parsed;

		if (maxClients > 0) {
			const [{ count }] = (await this.knex('directus_oauth_clients').count('* as count')) as [
				{ count: number | string },
			];

			if (Number(count) >= maxClients) {
				throw new OAuthError(400, 'invalid_client_metadata', 'Maximum number of registered clients reached');
			}
		}

		// Create client
		const clientId = crypto.randomUUID();
		const now = Math.floor(Date.now() / 1000);

		await this.knex('directus_oauth_clients').insert({
			client_id: clientId,
			client_name: clientName,
			redirect_uris: JSON.stringify(redirectUris),
			grant_types: JSON.stringify(grantTypes),
			token_endpoint_auth_method: 'none',
		});

		return {
			client_id: clientId,
			client_name: clientName as string,
			redirect_uris: redirectUris as string[],
			grant_types: grantTypes as string[],
			response_types: ['code'],
			token_endpoint_auth_method: 'none',
			client_id_issued_at: now,
		};
	}

	/**
	 * Validate an authorization request and produce a signed consent JWT.
	 *
	 * Called by `GET /mcp-oauth/authorize` (the consent page). The browser redirects here
	 * after the client constructs the authorization URL. If validation succeeds, the consent
	 * page renders with the signed JWT as a hidden form field.
	 *
	 * Validation order follows RFC 6749 Section 4.1.2.1 (pre-redirect vs post-redirect errors):
	 * 1. client_id lookup -- non-redirectable
	 * 2. redirect_uri exact match (RFC 6749 Section 3.1.2) -- non-redirectable
	 * 3. response_type (RFC 6749 Section 3.1.1) -- redirectable
	 * 4. PKCE code_challenge (RFC 7636 Section 4.4.1) -- redirectable
	 * 5. scope (RFC 6749 Section 3.3) -- redirectable
	 * 6. resource indicator (RFC 8707 Section 2) -- redirectable
	 *
	 * The consent JWT (HMAC-SHA256 with derived key, 5min expiry) binds the validated params
	 * to the user and session. It is rendered as a hidden form field on the consent page and
	 * verified in {@link processDecision} when the user submits the form. This serves as both
	 * CSRF protection and authorization parameter integrity.
	 *
	 * @param params - Authorization query/body params
	 * @param userId - Authenticated Directus user ID
	 * @param sessionHash - SHA-256 hex of the session token (binds consent to session)
	 * @returns Signed consent JWT and client display name
	 * @throws {OAuthError} Non-redirectable for client/redirect errors, redirectable after
	 */
	async validateAuthorization(
		params: Record<string, unknown>,
		userId: string,
		sessionHash: string,
	): Promise<ValidateResponse> {
		// Phase 1: Check pre-trust params for duplicates (non-redirectable)
		checkDuplicateParams(params, PRE_TRUST_DUPLICATE_PARAMS, false);

		const clientId = params['client_id'] as string | undefined;
		const redirectUri = params['redirect_uri'] as string | undefined;
		const responseType = params['response_type'] as string | undefined;
		const codeChallenge = params['code_challenge'] as string | undefined;
		const codeChallengeMethod = params['code_challenge_method'] as string | undefined;
		const scope = params['scope'] as string | undefined;
		const resource = params['resource'] as string | undefined;
		const state = params['state'] as string | undefined;

		// Validate client_id exists in DB - errors before redirect validation must not redirect
		if (!clientId) {
			throw new OAuthError(400, 'invalid_request', 'client_id is required');
		}

		const client = await this.knex('directus_oauth_clients').where('client_id', clientId).first();

		// Collapse client + redirect_uri errors to the same message to prevent enumeration
		if (!client) {
			throw new OAuthError(400, 'invalid_request', 'Invalid client_id or redirect_uri');
		}

		// Validate redirect_uri matches registered URIs (exact string match per RFC 6749 Section 3.1.2)
		if (!redirectUri) {
			throw new OAuthError(400, 'invalid_request', 'redirect_uri is required');
		}

		const registeredUris: string[] = JSON.parse(client['redirect_uris']);

		if (!registeredUris.includes(redirectUri)) {
			throw new OAuthError(400, 'invalid_request', 'Invalid client_id or redirect_uri');
		}

		// From here, errors are safe to potentially redirect (but we throw OAuthError for all)

		// Phase 2: Check post-trust params for duplicates (redirectable)
		checkDuplicateParams(params, POST_TRUST_DUPLICATE_PARAMS, true);

		// RFC 6749 Section 3.1.1: response_type REQUIRED
		if (!responseType) {
			throw new OAuthError(400, 'invalid_request', 'response_type is required', true);
		}

		if (responseType !== 'code') {
			throw new OAuthError(400, 'unsupported_response_type', 'Only response_type code is supported', true);
		}

		// RFC 7636 Section 4.4.1: code_challenge REQUIRED (we mandate PKCE on all flows)
		if (!codeChallenge) {
			throw new OAuthError(400, 'invalid_request', 'code_challenge is required', true);
		}

		if (!CODE_CHALLENGE_S256_RE.test(codeChallenge)) {
			throw new OAuthError(400, 'invalid_request', 'code_challenge must be a valid S256 challenge', true);
		}

		if (!codeChallengeMethod || codeChallengeMethod !== 'S256') {
			throw new OAuthError(400, 'invalid_request', 'code_challenge_method must be S256', true);
		}

		// Validate scope (default to mcp:access when omitted per RFC 6749 Section 3.3)
		const parsedScopes = parseOAuthScope(scope);
		const requestedScopes = parsedScopes.length > 0 ? parsedScopes : [MCP_ACCESS_SCOPE];

		if (!requestedScopes.includes(MCP_ACCESS_SCOPE)) {
			throw new OAuthError(400, 'invalid_scope', 'Scope must include mcp:access', true);
		}

		// Grant only what we support, regardless of what else was requested
		const normalizedScope = MCP_ACCESS_SCOPE;

		// RFC 8414: response_modes_supported advertises ["query"]; reject others
		const responseMode = params['response_mode'] as string | undefined;

		if (responseMode && responseMode !== 'query') {
			throw new OAuthError(400, 'invalid_request', 'Only response_mode query is supported', true);
		}

		// Validate resource (RFC 8707)
		const env = useEnv();
		const { resourceUrl: expectedResource } = getMcpUrls();
		const requireResource = env['MCP_OAUTH_REQUIRE_RESOURCE'] === true;
		const resolvedResource = resource || (!requireResource ? expectedResource : null);

		if (!resolvedResource) {
			throw new OAuthError(400, 'invalid_target', 'resource is required', true);
		}

		if (resolvedResource !== expectedResource) {
			throw new OAuthError(400, 'invalid_target', 'resource does not match the protected resource', true);
		}

		// Sign consent JWT with derived key
		const consentKey = this.getConsentKey();

		const signedParams = jwt.sign(
			{
				typ: CONSENT_JWT_TYP,
				aud: CONSENT_JWT_AUD,
				sub: userId,
				session_hash: sessionHash,
				client_id: clientId,
				redirect_uri: redirectUri,
				code_challenge: codeChallenge,
				code_challenge_method: codeChallengeMethod,
				scope: normalizedScope,
				resource: resolvedResource,
				state,
			},
			consentKey,
			{ expiresIn: '5m', algorithm: 'HS256' },
		);

		return {
			signed_params: signedParams,
			client_name: client['client_name'] as string,
			already_consented: false,
			redirect_uri: redirectUri,
			scope: normalizedScope,
		};
	}

	/**
	 * Process the user's consent decision (approve/deny).
	 *
	 * Called by `POST /mcp-oauth/authorize/decision` when the user submits the consent form.
	 * Verifies the consent JWT produced by {@link validateAuthorization} (audience, typ, sub,
	 * session binding), then either redirects with `error=access_denied` (RFC 6749 Section 4.1.2.1)
	 * or generates an authorization code (32 random bytes, stored as SHA-256 hash) and upserts
	 * a consent record. The redirect includes `iss` per RFC 9207 Section 2.
	 *
	 * Security checks before code issuance:
	 * - Consent JWT signature + expiry (HMAC-SHA256, 5min TTL)
	 * - `typ` claim prevents token confusion with other JWTs
	 * - `sub` must match the authenticated user (prevents cross-user replay)
	 * - `session_hash` must match the current session (prevents cross-session replay)
	 * - Client re-validated against DB (handles client deletion between consent and decision)
	 *
	 * @param params - Contains the signed consent JWT and approval boolean
	 * @param userId - Authenticated user (must match JWT `sub`)
	 * @param sessionToken - Raw session token (hashed and compared to JWT `session_hash`)
	 * @returns Redirect URL with `code` (approval) or `error` (denial) query params
	 * @throws {OAuthError} If consent JWT is invalid, expired, or session-mismatched
	 */
	async processDecision(params: DecisionParams, userId: string, sessionToken: string): Promise<string> {
		const { signed_params, approved } = params;

		// Verify consent JWT
		const consentKey = this.getConsentKey();

		let claims: Record<string, unknown>;

		try {
			claims = jwt.verify(signed_params, consentKey, {
				algorithms: ['HS256'],
				audience: CONSENT_JWT_AUD,
			}) as Record<string, unknown>;
		} catch {
			throw new OAuthError(400, 'invalid_request', 'Invalid or expired consent token');
		}

		// Verify typ claim
		if (claims['typ'] !== CONSENT_JWT_TYP) {
			throw new OAuthError(400, 'invalid_request', 'Invalid consent token type');
		}

		// Verify sub matches authenticated user
		if (claims['sub'] !== userId) {
			throw new OAuthError(400, 'invalid_request', 'Consent token user mismatch');
		}

		// Verify session binding
		const currentSessionHash = this.hashToken(sessionToken);

		if (claims['session_hash'] !== currentSessionHash) {
			throw new OAuthError(400, 'invalid_request', 'Session binding mismatch');
		}

		const redirectUri = claims['redirect_uri'] as string;
		const state = claims['state'] as string | undefined;
		const { issuerUrl } = getMcpUrls();

		// RFC 6749 Section 4.1.2.1: user denied the authorization request
		// Form urlencoded sends "true"/"false" as strings
		if (String(approved) !== 'true') {
			return this.buildRedirectUrl(redirectUri, { error: 'access_denied' }, state, issuerUrl);
		}

		// Approval path: re-validate client against DB
		const clientId = claims['client_id'] as string;

		const client = await this.knex('directus_oauth_clients').where('client_id', clientId).first();

		if (!client) {
			throw new OAuthError(400, 'invalid_request', 'Client no longer exists');
		}

		const registeredUris: string[] = JSON.parse(client['redirect_uris']);

		if (!registeredUris.includes(redirectUri)) {
			throw new OAuthError(400, 'invalid_request', 'redirect_uri no longer registered for this client');
		}

		// RFC 6749 Section 4.1.2: generate authorization code (opaque to client)
		const rawCode = crypto.randomBytes(32).toString('hex');
		const codeHash = this.hashToken(rawCode);

		// Store code (never store raw code)
		const env = useEnv();
		const codeExpiry = new Date(Date.now() + getMilliseconds(env['MCP_OAUTH_AUTH_CODE_TTL'], 0));

		await this.knex.transaction(async (trx) => {
			await trx('directus_oauth_codes').insert({
				id: crypto.randomUUID(),
				code_hash: codeHash,
				client: clientId,
				user: userId,
				redirect_uri: redirectUri,
				resource: claims['resource'] as string,
				code_challenge: claims['code_challenge'] as string,
				code_challenge_method: claims['code_challenge_method'] as string,
				scope: claims['scope'] as string,
				expires_at: codeExpiry,
			});

			// Upsert consent record. Read-then-write race is benign: concurrent inserts hit the
			// unique(user, client, redirect_uri) constraint, rolling back the loser's entire
			// transaction (including the code insert). The user simply re-approves.
			const existing = await trx('directus_oauth_consents')
				.where({ user: userId, client: clientId, redirect_uri: redirectUri })
				.first();

			const now = new Date();

			if (existing) {
				await trx('directus_oauth_consents').where('id', existing['id']).update({ date_updated: now });
			} else {
				await trx('directus_oauth_consents').insert({
					id: crypto.randomUUID(),
					user: userId,
					client: clientId,
					redirect_uri: redirectUri,
					scope: claims['scope'] as string,
					date_created: now,
					date_updated: now,
				});
			}
		});

		return this.buildRedirectUrl(redirectUri, { code: rawCode }, state, issuerUrl);
	}

	/**
	 * Exchange an authorization code for tokens (RFC 6749 Section 4.1.3).
	 *
	 * Called by the `POST /mcp-oauth/token` controller when `grant_type=authorization_code`.
	 * The client sends the code it received from the authorization redirect (produced by
	 * {@link processDecision}) along with its PKCE code_verifier.
	 *
	 * Pre-transaction:
	 * 1. Param validation (RFC 6749 Section 4.1.3: grant_type, code, redirect_uri, client_id)
	 * 2. code_verifier format check (RFC 7636 Section 4.1: unreserved chars, 43-128 length)
	 * 3. Code lookup by SHA-256 hash (raw code never stored)
	 *
	 * Inside transaction:
	 * 4. Atomic burn: `UPDATE WHERE used_at IS NULL` (RFC 6749 Section 10.5: single-use codes)
	 * 5. Post-burn validations (expiry, client_id, redirect_uri, resource)
	 *    Failures roll back the burn, restoring the code for retry
	 * 6. PKCE S256 verification via timing-safe compare (RFC 7636 Section 4.6)
	 * 7. User status check (must still be active)
	 * 8. Session + grant creation, replacing any existing grant for the same (client, user)
	 *
	 * Post-transaction:
	 * 9. JWT signed with scope=mcp:access, aud=resource URL (RFC 8707 Section 2)
	 * 10. refresh_token = raw session token (client stores it, server only keeps hash)
	 *
	 * @param params - Token request body (authorization_code grant)
	 * @param context - IP and user-agent for session/activity records
	 * @returns Token response (RFC 6749 Section 5.1) with access_token, optional refresh_token
	 * @throws {OAuthError} `invalid_grant` for code issues, `invalid_target` for resource mismatch
	 */
	async exchangeCode(params: TokenParams, context: TokenContext): Promise<TokenResponse> {
		const { nanoid } = await import('nanoid');
		const env = useEnv();
		const logger = useLogger();

		// 1. RFC 6749 Section 4.1.3: required token request params
		if (!params.grant_type) {
			throw new OAuthError(400, 'invalid_request', 'grant_type is required');
		}

		if (params.grant_type !== 'authorization_code') {
			throw new OAuthError(400, 'unsupported_grant_type', 'Only authorization_code grant is supported');
		}

		if (!params.client_id) {
			throw new OAuthError(400, 'invalid_request', 'client_id is required');
		}

		if (!params.code) {
			throw new OAuthError(400, 'invalid_request', 'code is required');
		}

		if (!params.redirect_uri) {
			throw new OAuthError(400, 'invalid_request', 'redirect_uri is required');
		}

		if (!params.code_verifier) {
			throw new OAuthError(400, 'invalid_request', 'code_verifier is required');
		}

		// 2. RFC 7636 Section 4.1: validate code_verifier format before DB lookup
		if (!CODE_VERIFIER_RE.test(params.code_verifier)) {
			throw new OAuthError(400, 'invalid_request', 'Invalid code_verifier format');
		}

		// 3. Hash incoming code and look up by code_hash (read-only, outside transaction)
		const codeHash = this.hashToken(params.code);

		const codeRecord = await this.knex('directus_oauth_codes').where({ code_hash: codeHash }).first();

		if (!codeRecord) {
			throw new OAuthError(400, 'invalid_grant', 'Authorization code is invalid or has expired');
		}

		function rejectCode(logFields: Record<string, unknown>, logMessage: string): never {
			logger.warn({ code_hash: codeHash, ...logFields }, logMessage);
			throw new OAuthError(400, 'invalid_grant', 'Authorization code is invalid or has expired');
		}

		// 4. Single transaction: burn-first, then validate, then create grant
		const sessionToken = nanoid(64);
		const sessionHash = this.hashToken(sessionToken);
		const refreshTtl = getMilliseconds(env['REFRESH_TOKEN_TTL'], 0);
		const accessTtl = getMilliseconds(env['ACCESS_TOKEN_TTL'], 0);
		const sessionExpiry = new Date(Date.now() + refreshTtl);
		const grantId = crypto.randomUUID();

		const { clientGrantTypes, clientName, userEmail, userRole, userId, scope, resource } = await this.knex.transaction(
			async (trx) => {
				// 4a. RFC 6749 Section 4.1.2: codes are single-use. Atomic burn via UPDATE WHERE used_at IS NULL
				const burned = await trx('directus_oauth_codes')
					.where({ code_hash: codeHash })
					.whereNull('used_at')
					.update({ used_at: new Date() });

				if (burned === 0) {
					rejectCode({}, 'Authorization code already used');
				}

				// 4b. Validate code fields (failure rolls back burn, restoring code)
				if (new Date(codeRecord['expires_at']) < new Date()) {
					rejectCode({}, 'Authorization code expired');
				}

				if (codeRecord['client'] !== params.client_id) {
					rejectCode({ expected: codeRecord['client'], got: params.client_id }, 'client_id mismatch');
				}

				if (codeRecord['redirect_uri'] !== params.redirect_uri) {
					rejectCode({}, 'redirect_uri mismatch');
				}

				const resolvedExchangeResource =
					params.resource || (!env['MCP_OAUTH_REQUIRE_RESOURCE'] ? codeRecord['resource'] : null);

				if (codeRecord['resource'] !== resolvedExchangeResource) {
					logger.warn(
						{ code_hash: codeHash, expected: codeRecord['resource'], got: params.resource },
						'resource mismatch',
					);

					throw new OAuthError(400, 'invalid_target', 'Authorization code is invalid or has expired');
				}

				// 4c. RFC 7636 Section 4.6: compute S256(code_verifier) and compare to stored challenge
				const computedChallenge = this.hashToken(params.code_verifier!, 'base64url');
				const storedChallenge = codeRecord['code_challenge'] as string;

				if (
					computedChallenge.length !== storedChallenge.length ||
					!crypto.timingSafeEqual(Buffer.from(computedChallenge), Buffer.from(storedChallenge))
				) {
					rejectCode({}, 'PKCE verification failed');
				}

				// 4d. Client lookup via trx
				const client = await trx('directus_oauth_clients').where('client_id', params.client_id).first();

				if (!client) {
					rejectCode({ client_id: params.client_id }, 'Unknown client during code exchange');
				}

				const txClientGrantTypes: string[] = JSON.parse(client['grant_types']);
				const txClientName = client['client_name'] as string;

				// 4e. User status check via trx
				const txUserId = codeRecord['user'] as string;

				const { email: txUserEmail, role: txUserRole } = await this.requireActiveUser(txUserId, trx);
				const txScope = (codeRecord['scope'] as string) || MCP_ACCESS_SCOPE;
				const txResource = codeRecord['resource'] as string;

				// 4f. Delete existing grant + its session if exists
				const existingGrant = await trx('directus_oauth_tokens')
					.where({ client: params.client_id, user: txUserId })
					.first();

				if (existingGrant) {
					await trx('directus_oauth_tokens').where({ client: params.client_id, user: txUserId }).delete();
					await trx('directus_sessions').where('token', existingGrant.session).delete();
				}

				// 4g. Create session + grant.
				// directus_sessions: the stateful session used by Directus for accountability resolution.
				// oauth_client FK marks it as an OAuth session (filtered out by refresh/logout guards).
				// token is the SHA-256 hash of the raw session token (which becomes the refresh_token).
				await trx('directus_sessions').insert({
					token: sessionHash,
					user: txUserId,
					expires: sessionExpiry,
					ip: context.ip,
					user_agent: context.userAgent,
					oauth_client: params.client_id,
				});

				// directus_oauth_tokens: the OAuth grant tracking the (client, user) relationship.
				// Links to the session via session hash. Holds resource + scope for token refresh,
				// and previous_session for reuse detection (populated on refresh rotation).
				await trx('directus_oauth_tokens').insert({
					id: grantId,
					client: params.client_id,
					user: txUserId,
					session: sessionHash,
					resource: txResource,
					code_hash: codeHash,
					scope: txScope,
					expires_at: sessionExpiry,
					date_created: new Date(),
				});

				return {
					clientGrantTypes: txClientGrantTypes,
					clientName: txClientName,
					userEmail: txUserEmail,
					userRole: txUserRole,
					userId: txUserId,
					scope: txScope,
					resource: txResource,
				};
			},
		);

		// 5. Sign JWT (bypassing emitter.emitFilter('auth.jwt'))
		const accessToken = await this.issueMcpAccessToken({
			userId,
			role: userRole,
			sessionHash,
			resource,
			accessTtl,
			ip: context.ip,
		});

		// Activity record
		await this.recordOAuthActivity({
			action: Action.LOGIN,
			userId,
			grantId,
			comment: `OAuth grant issued for client ${clientName} (${scope}) to ${userEmail}`,
			ip: context.ip,
			userAgent: context.userAgent,
		});

		logger.info(
			{ client_id: params.client_id, scope, resource, user_id: userId, action: 'oauth_token_issued', ip: context.ip },
			'OAuth token issued',
		);

		// 6. Build response
		const includeRefreshToken = clientGrantTypes.includes('refresh_token');

		return {
			access_token: accessToken,
			token_type: 'Bearer',
			expires_in: Math.floor(accessTtl / 1000),
			...(includeRefreshToken ? { refresh_token: sessionToken } : {}),
			scope: MCP_ACCESS_SCOPE,
		};
	}

	/**
	 * Refresh an access token with session rotation (RFC 6749 Section 6).
	 *
	 * Called by `POST /mcp-oauth/token` when `grant_type=refresh_token`. The client sends
	 * the refresh_token it received from {@link exchangeCode} or a previous refresh.
	 *
	 * Session rotation: hash incoming token, look up grant by `session`, atomically
	 * `UPDATE WHERE session=old_hash` to new hash. If 0 rows updated, check `previous_session`
	 * for reuse detection -- if found, revoke the entire grant (both grant and session deleted).
	 *
	 * @param params - Refresh token request body
	 * @param context - IP and user-agent for the new session
	 * @returns New token response with rotated refresh_token
	 * @throws {OAuthError} `invalid_grant` on reuse or expiry, `invalid_target` on resource mismatch
	 * @see exchangeCode for initial token issuance
	 */
	async refreshToken(params: RefreshParams, context: TokenContext): Promise<TokenResponse> {
		const { nanoid } = await import('nanoid');
		const env = useEnv();
		const logger = useLogger();

		// 1. Validate required params
		if (params.grant_type !== 'refresh_token') {
			throw new OAuthError(400, 'unsupported_grant_type', 'grant_type must be refresh_token');
		}

		if (!params.client_id) {
			throw new OAuthError(400, 'invalid_request', 'client_id is required');
		}

		if (!params.refresh_token) {
			throw new OAuthError(400, 'invalid_request', 'refresh_token is required');
		}

		if (env['MCP_OAUTH_REQUIRE_RESOURCE'] === true && !params.resource) {
			throw new OAuthError(400, 'invalid_target', 'resource is required');
		}

		if (params.scope && !parseOAuthScope(params.scope).includes(MCP_ACCESS_SCOPE)) {
			throw new OAuthError(400, 'invalid_scope', 'Scope must include mcp:access');
		}

		// 2. Verify client exists and supports refresh_token grant
		const client = await this.knex('directus_oauth_clients').where('client_id', params.client_id).first();

		// Collapse client existence + grant type errors to prevent enumeration
		if (!client) {
			throw new OAuthError(400, 'invalid_grant', 'Invalid refresh token');
		}

		const clientGrantTypes: string[] = JSON.parse(client['grant_types']);

		if (!clientGrantTypes.includes('refresh_token')) {
			throw new OAuthError(400, 'invalid_grant', 'Invalid refresh token');
		}

		// 3. Hash refresh_token and look up grant by session
		const oldSessionHash = this.hashToken(params.refresh_token);

		const grant = await this.knex('directus_oauth_tokens').where('session', oldSessionHash).first();

		if (!grant) {
			// 4. Reuse detection: check previous_session
			await this.knex.transaction(async (trx) => {
				await this.detectReuse(trx, oldSessionHash, params.client_id!, logger);
			});

			throw new OAuthError(400, 'invalid_grant', 'Invalid refresh token');
		}

		// 5. Verify refresh token belongs to the requesting client (RFC 6749 Section 10.4)
		if (grant['client'] !== params.client_id) {
			throw new OAuthError(400, 'invalid_grant', 'Invalid refresh token');
		}

		// 6. Validate resource matches grant's stored resource (RFC 8707)
		const resolvedRefreshResource = params.resource || (!env['MCP_OAUTH_REQUIRE_RESOURCE'] ? grant['resource'] : null);

		if (grant['resource'] !== resolvedRefreshResource) {
			throw new OAuthError(400, 'invalid_target', 'resource mismatch');
		}

		// 7. Check grant not expired
		if (new Date(grant['expires_at']) < new Date()) {
			throw new OAuthError(400, 'invalid_grant', 'Refresh token expired');
		}

		// 8. Check user status
		const userId = grant['user'] as string;

		const { email, role } = await this.requireActiveUser(userId, this.knex);

		// 9. Rotate session
		const newSessionToken = nanoid(64);
		const newSessionHash = this.hashToken(newSessionToken);
		const refreshTtl = getMilliseconds(env['REFRESH_TOKEN_TTL'], 0);
		const accessTtl = getMilliseconds(env['ACCESS_TOKEN_TTL'], 0);
		const newExpiry = new Date(Date.now() + refreshTtl);
		const resource = grant['resource'] as string;
		const scope = (grant['scope'] as string) || MCP_ACCESS_SCOPE;
		const grantId = grant['id'] as string;
		const clientName = client['client_name'] as string;

		// Session rotation in a single transaction
		await this.knex.transaction(async (trx) => {
			// Atomic UPDATE WHERE session = old_hash (concurrency protection)
			const updated = await trx('directus_oauth_tokens').where('session', oldSessionHash).update({
				session: newSessionHash,
				previous_session: oldSessionHash,
				expires_at: newExpiry,
			});

			if (updated === 0) {
				// Race loser: reuse detection within the same transaction
				await this.detectReuse(trx, oldSessionHash, params.client_id!, logger);
				throw new OAuthError(400, 'invalid_grant', 'Invalid refresh token');
			}

			// Delete old session, create new session
			await trx('directus_sessions').where('token', oldSessionHash).delete();

			await trx('directus_sessions').insert({
				token: newSessionHash,
				user: userId,
				expires: newExpiry,
				ip: context.ip,
				user_agent: context.userAgent,
				oauth_client: grant['client'],
			});
		});

		// 10. Sign new access token
		const accessToken = await this.issueMcpAccessToken({
			userId,
			role,
			sessionHash: newSessionHash,
			resource,
			accessTtl,
			ip: context.ip,
		});

		// Activity record
		await this.recordOAuthActivity({
			action: Action.UPDATE,
			userId,
			grantId,
			comment: `OAuth token refreshed for client ${clientName} (${scope}) by ${email}`,
			ip: context.ip,
			userAgent: context.userAgent,
		});

		logger.info(
			{
				client_id: params.client_id,
				scope,
				resource,
				user_id: userId,
				action: 'oauth_token_refreshed',
				ip: context.ip,
			},
			'OAuth token refreshed',
		);

		return {
			access_token: accessToken,
			token_type: 'Bearer',
			expires_in: Math.floor(accessTtl / 1000),
			refresh_token: newSessionToken,
			scope: MCP_ACCESS_SCOPE,
		};
	}

	/**
	 * Revoke a refresh token (RFC 7009 Section 2). Idempotent.
	 *
	 * Called by `POST /mcp-oauth/revoke`. The client sends its refresh_token to end the session.
	 *
	 * Per RFC 7009 Section 2.2, returns 200 for all cases -- successful revocation, unknown
	 * tokens, and unknown client_ids. This prevents client_id enumeration on the public endpoint.
	 * Only throws for missing required params (token, client_id).
	 *
	 * @param params - Token and client_id
	 * @throws {OAuthError} `invalid_request` if token or client_id is missing
	 */
	async revokeToken(params: RevokeParams): Promise<void> {
		const logger = useLogger();

		// RFC 7009 Section 2.1: token REQUIRED
		if (!params.token) {
			throw new OAuthError(400, 'invalid_request', 'token is required');
		}

		if (!params.client_id) {
			throw new OAuthError(400, 'invalid_request', 'client_id is required');
		}

		// Look up grant by token hash and verify client binding.
		// RFC 7009 Section 2.2: return 200 for all failure cases (no information leak).
		// For public clients, we don't distinguish unknown client_id from unknown token --
		// both silently succeed to prevent client_id enumeration.
		const tokenHash = this.hashToken(params.token);

		const grant = await this.knex('directus_oauth_tokens').where('session', tokenHash).first();

		if (!grant || grant['client'] !== params.client_id) {
			return;
		}

		const client = await this.knex('directus_oauth_clients').where('client_id', params.client_id).first();

		if (!client) {
			return;
		}

		const grantId = grant['id'] as string;
		const userId = grant['user'] as string;
		const clientName = client['client_name'] as string;

		// 5. Delete grant + session atomically
		await this.knex.transaction(async (trx) => {
			await trx('directus_oauth_tokens').where('id', grantId).delete();
			await trx('directus_sessions').where('token', tokenHash).delete();
		});

		// 6. Activity record
		const userRecord = await this.knex('directus_users').where('id', userId).select('email').first();
		const userEmail = userRecord?.email ?? 'unknown';

		await this.recordOAuthActivity({
			action: Action.LOGOUT,
			userId,
			grantId,
			comment: `OAuth token revoked for client ${clientName} by ${userEmail}`,
			ip: 'system',
			userAgent: 'system',
		});

		logger.info({ client_id: params.client_id, user_id: userId, action: 'oauth_token_revoked' }, 'OAuth token revoked');
	}

	/**
	 * Periodic cleanup of expired/orphaned OAuth data.
	 *
	 * Called by the `oauth-cleanup` scheduled job (cron: `MCP_OAUTH_CLEANUP_SCHEDULE`).
	 *
	 * Steps:
	 * 1. Expired unused codes
	 * 2. Used codes older than 1 hour (kept briefly for replay detection logging)
	 * 3. Expired grants + their sessions
	 * 4. Orphaned grants (session no longer in directus_sessions)
	 * 5. Stale clients in two tiers:
	 *    a) Never-authorized (no consents, no sessions/grants, older than MCP_OAUTH_CLIENT_UNUSED_TTL)
	 *    b) Idle authorized (has consents but no sessions/grants, older than MCP_OAUTH_CLIENT_IDLE_TTL; disabled when '0')
	 */
	async cleanup(): Promise<void> {
		const env = useEnv();
		const now = new Date();
		const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

		// 1. Delete expired unused codes
		await this.knex('directus_oauth_codes').where('expires_at', '<', now).whereNull('used_at').delete();

		// 2. Delete used (already-exchanged) codes older than 1 hour.
		// Kept briefly for replay detection logging; no impact on active sessions.
		await this.knex('directus_oauth_codes').whereNotNull('used_at').andWhere('used_at', '<', oneHourAgo).delete();

		// 3. Delete expired grants along with their sessions
		const expiredGrants = await this.knex('directus_oauth_tokens')
			.where('expires_at', '<', now)
			.select('id', 'session');

		if (expiredGrants.length > 0) {
			const sessionHashes = expiredGrants.map((g) => g.session);
			await this.knex('directus_sessions').whereIn('token', sessionHashes).delete();

			await this.knex('directus_oauth_tokens')
				.whereIn(
					'id',
					expiredGrants.map((g) => g.id),
				)
				.delete();
		}

		// 4. Delete orphaned grants (session not in directus_sessions)
		const orphanedGrants = await this.knex('directus_oauth_tokens')
			.leftJoin('directus_sessions', function () {
				this.on('directus_oauth_tokens.session', '=', 'directus_sessions.token');
			})
			.whereNull('directus_sessions.token')
			.select('directus_oauth_tokens.id');

		if (orphanedGrants.length > 0) {
			await this.knex('directus_oauth_tokens')
				.whereIn(
					'id',
					orphanedGrants.map((g) => g.id),
				)
				.delete();
		}

		// 5a. Tier 1: Never-authorized clients (no consent records, no active sessions/grants)
		const unusedTtl = getMilliseconds(env['MCP_OAUTH_CLIENT_UNUSED_TTL'], DEFAULT_UNUSED_CLIENT_TTL_MS);
		const unusedCutoff = new Date(now.getTime() - unusedTtl);

		const neverAuthorizedClients = await this.knex('directus_oauth_clients')
			.leftJoin('directus_oauth_consents', 'directus_oauth_clients.client_id', 'directus_oauth_consents.client')
			.leftJoin('directus_sessions', 'directus_oauth_clients.client_id', 'directus_sessions.oauth_client')
			.leftJoin('directus_oauth_tokens', 'directus_oauth_clients.client_id', 'directus_oauth_tokens.client')
			.whereNull('directus_oauth_consents.id')
			.whereNull('directus_sessions.token')
			.whereNull('directus_oauth_tokens.id')
			.where('directus_oauth_clients.date_created', '<', unusedCutoff)
			.select('directus_oauth_clients.client_id');

		if (neverAuthorizedClients.length > 0) {
			await this.knex('directus_oauth_clients')
				.whereIn(
					'client_id',
					neverAuthorizedClients.map((c) => c.client_id),
				)
				.delete();
		}

		// 5b. Tier 2: Idle authorized clients (have consents but no active sessions/grants)
		const idleTtl = getMilliseconds(env['MCP_OAUTH_CLIENT_IDLE_TTL'], 0);

		if (idleTtl > 0) {
			const idleCutoff = new Date(now.getTime() - idleTtl);

			const idleAuthorizedClients = await this.knex('directus_oauth_clients')
				.leftJoin('directus_sessions', 'directus_oauth_clients.client_id', 'directus_sessions.oauth_client')
				.leftJoin('directus_oauth_tokens', 'directus_oauth_clients.client_id', 'directus_oauth_tokens.client')
				.whereNull('directus_sessions.token')
				.whereNull('directus_oauth_tokens.id')
				.where('directus_oauth_clients.date_created', '<', idleCutoff)
				.whereNotIn(
					'directus_oauth_clients.client_id',
					neverAuthorizedClients.map((c) => c.client_id),
				)
				.select('directus_oauth_clients.client_id');

			if (idleAuthorizedClients.length > 0) {
				await this.knex('directus_oauth_clients')
					.whereIn(
						'client_id',
						idleAuthorizedClients.map((c) => c.client_id),
					)
					.delete();
			}
		}
	}

	private buildRedirectUrl(
		redirectUri: string,
		params: Record<string, string>,
		state: string | undefined,
		issuerUrl: string,
	): string {
		const url = new URL(redirectUri);

		for (const [key, value] of Object.entries(params)) {
			url.searchParams.set(key, value);
		}

		if (state) url.searchParams.set('state', state);

		url.searchParams.set('iss', issuerUrl);
		return url.toString();
	}

	private async issueMcpAccessToken(opts: {
		userId: string;
		role: string | null;
		sessionHash: string;
		resource: string;
		accessTtl: number;
		ip: string;
	}): Promise<string> {
		const rolesTree = await fetchRolesTree(opts.role, { knex: this.knex });

		const globalAccess = await fetchGlobalAccess(
			{ user: opts.userId, roles: rolesTree, ip: opts.ip },
			{ knex: this.knex },
		);

		return jwt.sign(
			{
				id: opts.userId,
				role: rolesTree[0] ?? null,
				app_access: globalAccess.app,
				admin_access: globalAccess.admin,
				session: opts.sessionHash,
				scope: MCP_ACCESS_SCOPE,
				aud: opts.resource,
			},
			getSecret(),
			{
				expiresIn: opts.accessTtl / 1000,
				issuer: 'directus',
			},
		);
	}

	private async recordOAuthActivity(opts: {
		action: (typeof Action)[keyof typeof Action];
		userId: string;
		grantId: string;
		comment: string;
		ip: string;
		userAgent: string;
	}): Promise<void> {
		const activityService = new ActivityService({ knex: this.knex, schema: this.schema });

		await activityService.createOne({
			action: opts.action,
			user: opts.userId,
			collection: 'directus_oauth_tokens',
			item: opts.grantId,
			comment: opts.comment,
			ip: opts.ip,
			user_agent: opts.userAgent,
		});
	}

	private async requireActiveUser(
		userId: string,
		knex: Knex | Knex.Transaction,
	): Promise<{ email: string; role: string | null }> {
		const userRecord = await knex('directus_users').where('id', userId).select('email', 'status', 'role').first();

		if (!userRecord || userRecord.status !== 'active') {
			throw new OAuthError(400, 'invalid_grant', 'User account is not active');
		}

		return { email: userRecord.email ?? 'unknown', role: userRecord.role ?? null };
	}

	/** Detect and revoke grants where previous_session matches (refresh token reuse). */
	private async detectReuse(
		db: Knex | Knex.Transaction,
		oldSessionHash: string,
		clientId: string,
		logger: ReturnType<typeof useLogger>,
	): Promise<void> {
		const reuseGrant = await db('directus_oauth_tokens').where('previous_session', oldSessionHash).first();

		if (reuseGrant) {
			await db('directus_oauth_tokens').where('id', reuseGrant['id']).delete();
			await db('directus_sessions').where('token', reuseGrant['session']).delete();

			logger.warn({ client_id: clientId, grant_id: reuseGrant['id'] }, 'Refresh token reuse detected, grant revoked');
		}
	}

	/** HMAC-SHA256 key derived from SECRET for signing/verifying consent JWTs. Domain-separated to prevent token confusion. */
	private getConsentKey(): Buffer {
		return crypto.createHmac('sha256', getSecret()).update('mcp-oauth-consent-v1').digest();
	}

	private hashToken(token: string, encoding: 'hex' | 'base64url' = 'hex'): string {
		return crypto.createHash('sha256').update(token).digest(encoding);
	}

	private validateRedirectUri(uri: unknown): void {
		if (typeof uri !== 'string') {
			throw new OAuthError(400, 'invalid_redirect_uri', 'redirect_uri must be a string');
		}

		if (uri.length > MAX_REDIRECT_URI_LENGTH) {
			throw new OAuthError(
				400,
				'invalid_redirect_uri',
				`redirect_uri must not exceed ${MAX_REDIRECT_URI_LENGTH} characters`,
			);
		}

		let parsed: URL;

		try {
			parsed = new URL(uri);
		} catch {
			throw new OAuthError(400, 'invalid_redirect_uri', `Invalid redirect URI: ${uri}`);
		}

		// No fragment
		if (parsed.hash) {
			throw new OAuthError(400, 'invalid_redirect_uri', 'redirect_uri must not contain a fragment');
		}

		// No userinfo
		if (parsed.username || parsed.password) {
			throw new OAuthError(400, 'invalid_redirect_uri', 'redirect_uri must not contain userinfo');
		}

		// Must be HTTPS, except localhost
		const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '::1';

		if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLocalhost)) {
			throw new OAuthError(400, 'invalid_redirect_uri', 'redirect_uri must use HTTPS (except for localhost)');
		}
	}
}
