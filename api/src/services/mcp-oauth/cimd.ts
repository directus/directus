import { isIP } from 'node:net';
import { performance } from 'node:perf_hooks';
import { useEnv } from '@directus/env';
import type { AxiosRequestConfig } from 'axios';
import { useLogger } from '../../logger/index.js';
import { getAxios } from '../../request/index.js';
import { OAuthError } from './types/error.js';
import { CimdEgressError, createCimdLookup } from './utils/cimd-egress.js';
import { validateRedirectUri } from './utils/redirect.js';

const MIN_TTL_MS = 300_000; // 5 minutes
const MAX_TTL_MS = 86_400_000; // 24 hours
const DEFAULT_TTL_MS = 3_600_000; // 1 hour
const MAX_CLIENT_NAME_LENGTH = 200;
const MAX_URL_LENGTH = 255;

const DEFAULT_BLOCKED_TLDS = ['test', 'localhost', 'invalid', 'example', 'local', 'onion'];

/**
 * Forbidden shared-secret auth methods per draft-ietf-oauth-client-id-metadata-document-01 Section 4.1:
 * "the token_endpoint_auth_method property MUST NOT include client_secret_post, client_secret_basic,
 * client_secret_jwt, or any other method based around a shared symmetric secret."
 */
const FORBIDDEN_AUTH_METHODS = new Set(['client_secret_basic', 'client_secret_post', 'client_secret_jwt']);

export interface CimdMetadata {
	client_id: string;
	client_name: string;
	redirect_uris: string[];
	grant_types: string[];
	response_types?: string[];
	token_endpoint_auth_method: string;
	client_uri?: string;
	logo_uri?: string;
	tos_uri?: string;
	policy_uri?: string;
}

export interface FetchResult {
	notModified: boolean;
	metadata?: CimdMetadata;
	etag?: string | null;
	ttlMs: number | null;
}

/**
 * Detect whether a client_id is a CIMD URL or a DCR-registered ID.
 * Returns 'cimd' for valid CIMD URLs, 'dcr' for anything else that should go to DB lookup,
 * or null if it looks like a CIMD URL but fails validation.
 */
export function detectClientIdType(clientId: string): 'dcr' | 'cimd' | null {
	if (clientId.startsWith('https://') || (useEnv()['MCP_OAUTH_CIMD_ALLOW_HTTP'] && clientId.startsWith('http://'))) {
		return isValidCimdClientId(clientId) ? 'cimd' : null;
	}

	return 'dcr';
}

/**
 * Strict CIMD client_id URL validation with debug logging on each rejection.
 */
export function isValidCimdClientId(input: string): boolean {
	const logger = useLogger();
	const env = useEnv();

	let url: URL;

	try {
		url = new URL(input);
	} catch {
		logger.debug({ client_id: input, reason: 'unparseable URL' }, 'CIMD client_id rejected');
		return false;
	}

	// Protocol check
	const allowHttp = env['MCP_OAUTH_CIMD_ALLOW_HTTP'] as boolean;

	if (url.protocol !== 'https:' && !(allowHttp && url.protocol === 'http:')) {
		logger.debug({ client_id: input, reason: 'not HTTPS' }, 'CIMD client_id rejected');
		return false;
	}

	// Non-root path
	if (url.pathname === '/') {
		logger.debug({ client_id: input, reason: 'root path' }, 'CIMD client_id rejected');
		return false;
	}

	// No query string
	if (url.search) {
		logger.debug({ client_id: input, reason: 'query string present' }, 'CIMD client_id rejected');
		return false;
	}

	// No fragment
	if (url.hash) {
		logger.debug({ client_id: input, reason: 'fragment present' }, 'CIMD client_id rejected');
		return false;
	}

	// No credentials
	if (url.username || url.password) {
		logger.debug({ client_id: input, reason: 'credentials in URL' }, 'CIMD client_id rejected');
		return false;
	}

	// No dot segments in path
	if (/(?:^|\/)\.\.?(?:\/|$)/.test(url.pathname)) {
		logger.debug({ client_id: input, reason: 'dot segments in path' }, 'CIMD client_id rejected');
		return false;
	}

	const hostname = url.hostname.replace(/\.$/, '').toLowerCase();

	// No IP address hostname (strip brackets for IPv6)
	const bareHost = hostname.replace(/^\[|\]$/g, '');

	if (isIP(bareHost)) {
		logger.debug({ client_id: input, reason: 'IP address hostname' }, 'CIMD client_id rejected');
		return false;
	}

	// Blocked TLDs
	const envTlds = env['MCP_OAUTH_CIMD_BLOCKED_TLDS'] as string[];
	const tlds = envTlds.length > 0 ? envTlds : DEFAULT_BLOCKED_TLDS;
	const suffixes = tlds.map((t) => `.${t.toLowerCase()}`);

	for (const suffix of suffixes) {
		if (hostname === suffix.slice(1) || hostname.endsWith(suffix)) {
			logger.debug({ client_id: input, reason: `blocked TLD: ${suffix}` }, 'CIMD client_id rejected');
			return false;
		}
	}

	// URL length
	if (input.length > MAX_URL_LENGTH) {
		logger.debug({ client_id: input, reason: 'URL too long' }, 'CIMD client_id rejected');
		return false;
	}

	// Canonical form
	if (url.href !== input) {
		logger.debug({ client_id: input, reason: `non-canonical (${url.href})` }, 'CIMD client_id rejected');
		return false;
	}

	return true;
}

/** Read allowed domains from env, filtering empty strings. */
export function getAllowedDomains(): string[] {
	const env = useEnv();
	return (env['MCP_OAUTH_CIMD_ALLOWED_DOMAINS'] as string[]).filter((s) => s !== '');
}

/**
 * Parse Cache-Control and Expires headers per RFC 9111.
 * Returns TTL in milliseconds, clamped to [5min, 24h]. Default: 1h.
 */
export function resolveCacheTtl(headers: Record<string, string>): number {
	const cc = headers['cache-control'];

	if (cc) {
		const directives = cc.split(',').map((d) => d.trim());

		for (const directive of directives) {
			const eqIdx = directive.indexOf('=');
			const name = (eqIdx === -1 ? directive : directive.slice(0, eqIdx)).toLowerCase();

			// Bare no-store / no-cache (without '=' qualifier) means always revalidate
			if (name === 'no-store' && eqIdx === -1) return 0;
			if (name === 'no-cache' && eqIdx === -1) return 0;
		}

		// Look for max-age
		for (const directive of directives) {
			const eqIdx = directive.indexOf('=');

			if (eqIdx === -1) continue;

			const name = directive.slice(0, eqIdx).toLowerCase();

			if (name === 'max-age') {
				const seconds = parseInt(directive.slice(eqIdx + 1), 10);

				if (!isNaN(seconds)) {
					const ms = seconds * 1000;
					return Math.min(MAX_TTL_MS, Math.max(MIN_TTL_MS, ms));
				}
			}
		}
	}

	// Fallback to Expires
	const expires = headers['expires'];

	if (expires) {
		const expiresMs = new Date(expires).getTime();

		if (!isNaN(expiresMs)) {
			const delta = expiresMs - Date.now();

			if (delta <= 0) return 0;

			return Math.min(MAX_TTL_MS, Math.max(MIN_TTL_MS, delta));
		}
	}

	return DEFAULT_TTL_MS;
}

/** Validate a URI is HTTPS. Used for optional metadata fields (client_uri, logo_uri, etc.). */
function validateOptionalHttpsUri(value: unknown, field: string): void {
	if (typeof value !== 'string') {
		throw new OAuthError(400, 'invalid_client_metadata', `${field} must be a string`);
	}

	try {
		const parsed = new URL(value);

		if (parsed.protocol !== 'https:') {
			throw new OAuthError(400, 'invalid_client_metadata', `${field} must use HTTPS`);
		}
	} catch (err) {
		if (err instanceof OAuthError) throw err;
		throw new OAuthError(400, 'invalid_client_metadata', `${field} is not a valid URL`);
	}
}

const CONTENT_TYPE_JSON_RE = /^application\/(?:json|[\w.-]+\+json)(?:\s*;|$)/i;

/**
 * Fetch and validate a CIMD metadata document.
 * When `etag` is provided, sends If-None-Match and accepts 304.
 */
export async function fetchCimdMetadata(clientId: string, etag?: string): Promise<FetchResult> {
	const logger = useLogger();
	const axios = await getAxios();
	let url: URL;

	try {
		url = new URL(clientId);
	} catch {
		logger.debug({ client_id: clientId, reason: 'unparseable URL' }, 'CIMD metadata fetch rejected');
		throw new OAuthError(400, 'invalid_client_metadata', 'Failed to fetch client metadata document');
	}

	const bareHost = url.hostname.replace(/^\[|\]$/g, '');

	if (isIP(bareHost)) {
		logger.debug({ client_id: clientId, reason: 'IP address hostname' }, 'CIMD metadata fetch rejected');
		throw new OAuthError(400, 'invalid_client_metadata', 'Failed to fetch client metadata document');
	}

	const headers: Record<string, string> = {};

	if (etag) {
		headers['If-None-Match'] = etag;
	}

	let response;

	try {
		const deadlineAt = performance.now() + 3000;

		const requestConfig: AxiosRequestConfig = {
			headers,
			lookup: createCimdLookup({ deadlineAt }),
			maxRedirects: 0,
			maxContentLength: 5120,
			proxy: false,
			timeout: 3000,
			responseType: 'json',
			validateStatus: (s) => s === 200 || (etag ? s === 304 : false),
		};

		response = await axios.get(clientId, requestConfig);
	} catch (err: any) {
		if (err instanceof CimdEgressError) {
			const reason = (err as { reason?: unknown }).reason;

			logger.debug(
				{ client_id: clientId, ...(typeof reason === 'string' ? { reason } : {}) },
				'CIMD metadata fetch rejected',
			);

			throw new OAuthError(400, 'invalid_client_metadata', 'Failed to fetch client metadata document');
		}

		logger.debug({ client_id: clientId, error: err?.message }, 'CIMD metadata fetch failed');
		throw new OAuthError(400, 'invalid_client_metadata', 'Failed to fetch client metadata document');
	}

	// 304 Not Modified
	if (response.status === 304) {
		const respHeaders = response.headers as Record<string, string>;
		const hasCacheControl = !!respHeaders['cache-control'];
		return { notModified: true, ttlMs: hasCacheControl ? resolveCacheTtl(respHeaders) : null };
	}

	// Content-Type validation
	const contentType = response.headers['content-type'] as string | undefined;

	if (!contentType || !CONTENT_TYPE_JSON_RE.test(contentType)) {
		throw new OAuthError(400, 'invalid_client_metadata', 'Client metadata document must be JSON');
	}

	const doc = response.data;

	if (!doc || typeof doc !== 'object') {
		throw new OAuthError(400, 'invalid_client_metadata', 'Client metadata document must be a JSON object');
	}

	// client_id must match fetch URL exactly
	if (doc.client_id !== clientId) {
		logger.debug({ client_id: clientId, doc_client_id: doc.client_id }, 'CIMD client_id mismatch');

		throw new OAuthError(400, 'invalid_client_metadata', 'client_id in document does not match fetch URL');
	}

	// client_name: present, non-empty, max length
	if (!doc.client_name || typeof doc.client_name !== 'string' || doc.client_name.trim().length === 0) {
		throw new OAuthError(400, 'invalid_client_metadata', 'client_name is required');
	}

	if (doc.client_name.length > MAX_CLIENT_NAME_LENGTH) {
		throw new OAuthError(
			400,
			'invalid_client_metadata',
			`client_name must not exceed ${MAX_CLIENT_NAME_LENGTH} characters`,
		);
	}

	// redirect_uris: present, non-empty array, each validated
	if (!Array.isArray(doc.redirect_uris) || doc.redirect_uris.length === 0) {
		throw new OAuthError(400, 'invalid_client_metadata', 'redirect_uris is required and must be a non-empty array');
	}

	for (const uri of doc.redirect_uris) {
		try {
			validateRedirectUri(uri);
		} catch (err) {
			if (err instanceof OAuthError) throw err;
			throw new OAuthError(400, 'invalid_redirect_uri', 'Invalid redirect URI in metadata document');
		}
	}

	// client_secret / client_secret_expires_at must NOT be present
	if ('client_secret' in doc) {
		throw new OAuthError(400, 'invalid_client_metadata', 'CIMD documents must not contain client_secret');
	}

	if ('client_secret_expires_at' in doc) {
		throw new OAuthError(400, 'invalid_client_metadata', 'CIMD documents must not contain client_secret_expires_at');
	}

	// grant_types: default to authorization_code, must include it
	if (doc.grant_types !== undefined && !Array.isArray(doc.grant_types)) {
		throw new OAuthError(400, 'invalid_client_metadata', 'grant_types must be an array');
	}

	const grantTypes: string[] = doc.grant_types ?? ['authorization_code'];

	if (!grantTypes.includes('authorization_code')) {
		throw new OAuthError(400, 'invalid_client_metadata', 'grant_types must include authorization_code');
	}

	// response_types: if present, must be ["code"]
	if (doc.response_types !== undefined) {
		if (!Array.isArray(doc.response_types) || doc.response_types.length !== 1 || doc.response_types[0] !== 'code') {
			throw new OAuthError(400, 'invalid_client_metadata', 'response_types must be ["code"] if present');
		}
	}

	// token_endpoint_auth_method: default to "none", only "none" accepted
	if (doc.token_endpoint_auth_method !== undefined && typeof doc.token_endpoint_auth_method !== 'string') {
		throw new OAuthError(400, 'invalid_client_metadata', 'token_endpoint_auth_method must be a string');
	}

	const authMethod = doc.token_endpoint_auth_method ?? 'none';

	if (FORBIDDEN_AUTH_METHODS.has(authMethod)) {
		throw new OAuthError(400, 'invalid_client_metadata', 'Shared-secret authentication methods are forbidden for CIMD');
	}

	if (authMethod !== 'none') {
		throw new OAuthError(400, 'invalid_client_metadata', `Unsupported token_endpoint_auth_method: ${authMethod}`);
	}

	// Optional URI fields
	for (const field of ['client_uri', 'logo_uri', 'tos_uri', 'policy_uri'] as const) {
		if (doc[field] !== undefined) {
			validateOptionalHttpsUri(doc[field], field);
		}
	}

	const responseHeaders = response.headers as Record<string, string>;

	const metadata: CimdMetadata = {
		client_id: doc.client_id,
		client_name: doc.client_name,
		redirect_uris: doc.redirect_uris,
		grant_types: grantTypes,
		response_types: doc.response_types,
		token_endpoint_auth_method: authMethod,
		...(doc.client_uri && { client_uri: doc.client_uri }),
		...(doc.logo_uri && { logo_uri: doc.logo_uri }),
		...(doc.tos_uri && { tos_uri: doc.tos_uri }),
		...(doc.policy_uri && { policy_uri: doc.policy_uri }),
	};

	return {
		notModified: false,
		metadata,
		etag: (responseHeaders['etag'] as string) ?? null,
		ttlMs: resolveCacheTtl(responseHeaders),
	};
}
