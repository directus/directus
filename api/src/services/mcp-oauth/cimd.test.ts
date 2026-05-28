import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OAuthError } from './types/error.js';

const { MockCimdEgressError, mockFetchExternalJson, mockValidateCimdHostnameEgress } = vi.hoisted(() => {
	class MockCimdEgressError extends Error {
		reason: string;

		constructor(reason: string) {
			super(`CIMD egress rejected: ${reason}`);
			this.name = 'CimdEgressError';
			this.reason = reason;
		}
	}

	return {
		MockCimdEgressError,
		mockFetchExternalJson: vi.fn(),
		mockValidateCimdHostnameEgress: vi.fn(),
	};
});

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		MCP_OAUTH_CIMD_ALLOW_HTTP: false,
		MCP_OAUTH_CIMD_BLOCKED_TLDS: ['test', 'localhost', 'invalid', 'example', 'local', 'onion'],
		MCP_OAUTH_CIMD_ALLOWED_DOMAINS: [],
	}),
}));

vi.mock('../../logger/index.js', () => ({
	useLogger: vi.fn().mockReturnValue({
		debug: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	}),
}));

vi.mock('./utils/cimd-egress.js', () => ({
	CimdEgressError: MockCimdEgressError,
	validateCimdHostnameEgress: (...args: unknown[]) => mockValidateCimdHostnameEgress(...args),
}));

vi.mock('./utils/external-json.js', () => ({
	fetchExternalJson: (...args: unknown[]) => mockFetchExternalJson(...args),
}));

// Must import after mocks
const { detectClientIdType, isValidCimdClientId, getAllowedDomains, resolveCacheTtl, fetchCimdMetadata } = await import(
	'./cimd.js'
);

const { useEnv } = await import('@directus/env');
const { useLogger } = await import('../../logger/index.js');

const invalidClientMetadata = { status: 400, code: 'invalid_client_metadata' } as const;
const MIN_CACHE_TTL_MS = 300_000;
const MAX_CACHE_TTL_MS = 86_400_000;
const DEFAULT_CACHE_TTL_MS = 3_600_000;

const PRIVATE_KEY_JWT_METADATA = {
	token_endpoint_auth_method: 'private_key_jwt',
	jwks_uri: 'https://myapp.example.com/jwks.json',
	token_endpoint_auth_signing_alg: 'RS256',
} as const;

function mockFetchMetadata(
	data: unknown,
	options: { etag?: string | null; cacheControl?: string; expires?: string } = {},
) {
	mockFetchExternalJson.mockResolvedValue({
		status: 200,
		data,
		etag: options.etag ?? null,
		cacheControl: options.cacheControl,
		expires: options.expires,
	});
}

function mockFetchNotModified(options: { etag?: string | null; cacheControl?: string; expires?: string } = {}) {
	mockFetchExternalJson.mockResolvedValue({
		status: 304,
		etag: options.etag ?? null,
		cacheControl: options.cacheControl,
		expires: options.expires,
	});
}

async function expectOAuthError(
	promise: Promise<unknown>,
	expected: { status: number; code: string; description?: string },
) {
	let error: unknown;

	try {
		await promise;
	} catch (err) {
		error = err;
	}

	expect(error).toBeInstanceOf(OAuthError);
	expect(error).toMatchObject(expected);
}

describe('detectClientIdType', () => {
	it('returns cimd for valid https URL with path', () => {
		expect(detectClientIdType('https://example.com/client')).toBe('cimd');
	});

	it('returns dcr for UUID-like string', () => {
		expect(detectClientIdType('550e8400-e29b-41d4-a716-446655440000')).toBe('dcr');
	});

	it('returns null for https URL that fails CIMD validation', () => {
		// Root path is not valid for CIMD
		expect(detectClientIdType('https://example.com/')).toBeNull();
	});

	it('returns dcr for non-https string', () => {
		expect(detectClientIdType('some-random-client-id')).toBe('dcr');
	});

	it('returns dcr for http URL (not https)', () => {
		expect(detectClientIdType('http://example.com/client')).toBe('dcr');
	});

	it('returns cimd for http URL when ALLOW_HTTP is true', () => {
		vi.mocked(useEnv).mockReturnValue({
			MCP_OAUTH_CIMD_ALLOW_HTTP: true,
			MCP_OAUTH_CIMD_BLOCKED_TLDS: [],
			MCP_OAUTH_CIMD_ALLOWED_DOMAINS: [],
		} as any);

		expect(detectClientIdType('http://myapp.dev/client')).toBe('cimd');

		vi.mocked(useEnv).mockReturnValue({
			MCP_OAUTH_CIMD_ALLOW_HTTP: false,
			MCP_OAUTH_CIMD_BLOCKED_TLDS: ['test', 'localhost', 'invalid', 'example', 'local', 'onion'],
			MCP_OAUTH_CIMD_ALLOWED_DOMAINS: [],
		} as any);
	});
});

describe('isValidCimdClientId', () => {
	it('accepts valid https URL with path', () => {
		expect(isValidCimdClientId('https://myapp.example.com/.well-known/oauth-client')).toBe(true);
	});

	it('rejects unparseable URL', () => {
		expect(isValidCimdClientId('not a url at all')).toBe(false);
	});

	it('rejects http scheme when ALLOW_HTTP is false', () => {
		expect(isValidCimdClientId('http://example.com/client')).toBe(false);
	});

	it('allows http scheme when ALLOW_HTTP is true', () => {
		vi.mocked(useEnv).mockReturnValueOnce({
			MCP_OAUTH_CIMD_ALLOW_HTTP: true,
			MCP_OAUTH_CIMD_BLOCKED_TLDS: [],
			MCP_OAUTH_CIMD_ALLOWED_DOMAINS: [],
		} as any);

		expect(isValidCimdClientId('http://myapp.dev/client')).toBe(true);
	});

	it('rejects root path', () => {
		expect(isValidCimdClientId('https://example.com/')).toBe(false);
	});

	it('rejects URL with query string', () => {
		expect(isValidCimdClientId('https://example.com/client?foo=bar')).toBe(false);
	});

	it('rejects URL with fragment', () => {
		expect(isValidCimdClientId('https://example.com/client#section')).toBe(false);
	});

	it('rejects URL with credentials', () => {
		expect(isValidCimdClientId('https://user:pass@example.com/client')).toBe(false);
	});

	it('rejects URL with dot segments in path', () => {
		expect(isValidCimdClientId('https://example.com/foo/../bar')).toBe(false);
	});

	it('rejects IPv4 hostname', () => {
		expect(isValidCimdClientId('https://192.168.1.1/client')).toBe(false);
	});

	it('rejects IPv4 hostname with trailing dot', () => {
		expect(isValidCimdClientId('https://127.0.0.1./client')).toBe(false);
	});

	it('rejects IPv6 hostname', () => {
		expect(isValidCimdClientId('https://[::1]/client')).toBe(false);
	});

	it.each(['test', 'localhost', 'invalid', 'example', 'local', 'onion'])('rejects blocked TLD .%s', (tld) => {
		expect(isValidCimdClientId(`https://myapp.${tld}/client`)).toBe(false);
	});

	it('rejects blocked TLD with trailing dot', () => {
		expect(isValidCimdClientId('https://myapp.localhost./client')).toBe(false);
	});

	it('rejects URL longer than 255 characters', () => {
		const longPath = 'a'.repeat(240);
		expect(isValidCimdClientId(`https://example.com/${longPath}`)).toBe(false);
	});

	it('rejects non-canonical URL (trailing dot in hostname)', () => {
		// URL constructor normalizes some things; this tests cases where href !== input
		// Port 443 is default for https and gets stripped by URL constructor
		expect(isValidCimdClientId('https://example.com:443/client')).toBe(false);
	});

	it('uses default blocked TLDs when env returns empty array', () => {
		vi.mocked(useEnv).mockReturnValueOnce({
			MCP_OAUTH_CIMD_ALLOW_HTTP: false,
			MCP_OAUTH_CIMD_BLOCKED_TLDS: [],
			MCP_OAUTH_CIMD_ALLOWED_DOMAINS: [],
		} as any);

		// .test is in the defaults
		expect(isValidCimdClientId('https://myapp.test/client')).toBe(false);
	});
});

describe('getAllowedDomains', () => {
	it('returns domains from env', () => {
		vi.mocked(useEnv).mockReturnValueOnce({
			MCP_OAUTH_CIMD_ALLOWED_DOMAINS: ['example.com', '*.foo.com'],
		} as any);

		expect(getAllowedDomains()).toEqual(['example.com', '*.foo.com']);
	});

	it('filters empty strings', () => {
		vi.mocked(useEnv).mockReturnValueOnce({
			MCP_OAUTH_CIMD_ALLOWED_DOMAINS: ['example.com', '', '*.foo.com', ''],
		} as any);

		expect(getAllowedDomains()).toEqual(['example.com', '*.foo.com']);
	});
});

describe('resolveCacheTtl', () => {
	const MIN_TTL = 300_000;
	const MAX_TTL = 86_400_000;
	const DEFAULT_TTL = 3_600_000;

	it('parses max-age and clamps to range', () => {
		expect(resolveCacheTtl({ 'cache-control': 'max-age=3600' })).toBe(3_600_000);
	});

	it('clamps max-age below floor to MIN_TTL', () => {
		expect(resolveCacheTtl({ 'cache-control': 'max-age=60' })).toBe(MIN_TTL);
	});

	it('clamps max-age above ceiling to MAX_TTL', () => {
		expect(resolveCacheTtl({ 'cache-control': 'max-age=200000' })).toBe(MAX_TTL);
	});

	it('returns 0 for no-store', () => {
		expect(resolveCacheTtl({ 'cache-control': 'no-store' })).toBe(0);
	});

	it('returns 0 for bare no-cache', () => {
		expect(resolveCacheTtl({ 'cache-control': 'no-cache' })).toBe(0);
	});

	it('does NOT return 0 for no-cache="Set-Cookie" (qualified no-cache)', () => {
		expect(resolveCacheTtl({ 'cache-control': 'no-cache="Set-Cookie", max-age=3600' })).toBe(3_600_000);
	});

	it('falls back to Expires header when no Cache-Control', () => {
		const future = new Date(Date.now() + 7_200_000).toUTCString();
		const result = resolveCacheTtl({ expires: future });
		// Should be roughly 7200s, but clamp within bounds
		expect(result).toBeGreaterThanOrEqual(MIN_TTL);
		expect(result).toBeLessThanOrEqual(MAX_TTL);
	});

	it('returns 0 for Expires in the past', () => {
		const past = new Date(Date.now() - 60_000).toUTCString();
		expect(resolveCacheTtl({ expires: past })).toBe(0);
	});

	it('returns DEFAULT_TTL when no headers present', () => {
		expect(resolveCacheTtl({})).toBe(DEFAULT_TTL);
	});

	it('prefers Cache-Control over Expires', () => {
		const future = new Date(Date.now() + 7_200_000).toUTCString();
		// max-age=600 = 600s = 600,000ms, clamped to MIN_TTL since 600,000 > 300,000 it stays as is
		expect(resolveCacheTtl({ 'cache-control': 'max-age=600', expires: future })).toBe(600_000);
	});

	it('handles case-insensitive MAX-AGE', () => {
		expect(resolveCacheTtl({ 'cache-control': 'MAX-AGE=3600' })).toBe(3_600_000);
	});
});

describe('fetchCimdMetadata', () => {
	beforeEach(() => {
		mockFetchExternalJson.mockReset();
		mockValidateCimdHostnameEgress.mockReset();
		mockValidateCimdHostnameEgress.mockResolvedValue({ addresses4: ['93.184.216.34'], addresses6: [] });
	});

	const validMetadata = {
		client_id: 'https://myapp.example.com/.well-known/oauth-client',
		client_name: 'My App',
		redirect_uris: ['https://myapp.example.com/callback'],
		grant_types: ['authorization_code'],
		response_types: ['code'],
		token_endpoint_auth_method: 'none',
	};

	it('fetches and returns valid metadata document', async () => {
		mockFetchMetadata(validMetadata, { etag: '"abc123"', cacheControl: 'max-age=3600' });

		const result = await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client');

		expect(result.notModified).toBe(false);
		expect(result.metadata).toBeDefined();
		expect(result.metadata!.client_id).toBe(validMetadata.client_id);
		expect(result.etag).toBe('"abc123"');
		expect(result.ttlMs).toBe(3_600_000);
		expect(mockValidateCimdHostnameEgress).toHaveBeenCalledWith('myapp.example.com');

		expect(mockFetchExternalJson).toHaveBeenCalledWith('https://myapp.example.com/.well-known/oauth-client', {
			allowHttp: false,
			allowLoopbackForLocalDevelopment: false,
			allowNotModified: false,
			redactionContext: 'CIMD metadata',
		});
	});

	it('rejects IP-literal URL hostnames before dispatch', async () => {
		await expectOAuthError(fetchCimdMetadata('https://[::1]/.well-known/oauth-client'), invalidClientMetadata);

		expect(mockValidateCimdHostnameEgress).not.toHaveBeenCalled();
		expect(mockFetchExternalJson).not.toHaveBeenCalled();
	});

	it('rejects public IP-literal URL hostnames before dispatch', async () => {
		await expectOAuthError(fetchCimdMetadata('https://8.8.8.8/.well-known/oauth-client'), invalidClientMetadata);

		expect(mockValidateCimdHostnameEgress).not.toHaveBeenCalled();
		expect(mockFetchExternalJson).not.toHaveBeenCalled();
	});

	it('maps CimdEgressError from preflight path to invalid_client_metadata', async () => {
		mockValidateCimdHostnameEgress.mockRejectedValue(new MockCimdEgressError('cimd_dns_special_use_ip'));

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);

		expect(mockFetchExternalJson).not.toHaveBeenCalled();
	});

	it('uses Expires for 200 response cache TTL when Cache-Control is absent', async () => {
		const expires = new Date(Date.now() + 7_200_000).toUTCString();

		mockFetchMetadata(validMetadata, { expires });

		const result = await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client');

		expect(result.ttlMs).toBeGreaterThanOrEqual(MIN_CACHE_TTL_MS);
		expect(result.ttlMs).toBeLessThanOrEqual(MAX_CACHE_TTL_MS);
		expect(result.ttlMs).not.toBe(DEFAULT_CACHE_TTL_MS);
	});

	it('uses Expires for 304 response cache TTL when Cache-Control is absent', async () => {
		const expires = new Date(Date.now() + 7_200_000).toUTCString();

		mockFetchNotModified({ etag: '"abc123"', expires });

		const result = await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client', '"old"');

		expect(result.notModified).toBe(true);
		expect(result.ttlMs).toBeGreaterThanOrEqual(MIN_CACHE_TTL_MS);
		expect(result.ttlMs).toBeLessThanOrEqual(MAX_CACHE_TTL_MS);
		expect(result.ttlMs).not.toBeNull();
	});

	it('rejects client_id mismatch', async () => {
		const logger = useLogger();

		mockFetchMetadata({ ...validMetadata, client_id: 'https://other.example.com/client' });

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);

		expect(logger.debug).not.toHaveBeenCalledWith(
			expect.objectContaining({ doc_client_id: 'https://other.example.com/client' }),
			expect.any(String),
		);
	});

	it('rejects missing client_name', async () => {
		mockFetchMetadata({ ...validMetadata, client_name: undefined });

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects client_name exceeding 200 chars', async () => {
		mockFetchMetadata({ ...validMetadata, client_name: 'x'.repeat(201) });

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects missing redirect_uris', async () => {
		mockFetchMetadata({ ...validMetadata, redirect_uris: undefined });

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects empty redirect_uris array', async () => {
		mockFetchMetadata({ ...validMetadata, redirect_uris: [] });

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects document with client_secret', async () => {
		mockFetchMetadata({ ...validMetadata, client_secret: 'secret123' });

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects document with client_secret_expires_at', async () => {
		mockFetchMetadata({ ...validMetadata, client_secret_expires_at: 0 });

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects shared-secret auth method (client_secret_basic)', async () => {
		mockFetchMetadata({ ...validMetadata, token_endpoint_auth_method: 'client_secret_basic' });

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('CIMD accepts private_key_jwt with same-origin jwks_uri and RS256 signing alg', async () => {
		mockFetchMetadata({ ...validMetadata, ...PRIVATE_KEY_JWT_METADATA });

		const result = await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client');

		expect(result.metadata).toMatchObject(PRIVATE_KEY_JWT_METADATA);
		expect(mockFetchExternalJson).toHaveBeenCalledTimes(1);
	});

	it('CIMD rejects private_key_jwt without jwks_uri', async () => {
		const { jwks_uri: _, ...privateKeyJwtWithoutJwksUri } = PRIVATE_KEY_JWT_METADATA;

		mockFetchMetadata({ ...validMetadata, ...privateKeyJwtWithoutJwksUri });

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('CIMD rejects private_key_jwt without token_endpoint_auth_signing_alg', async () => {
		const { token_endpoint_auth_signing_alg: _, ...privateKeyJwtWithoutAlg } = PRIVATE_KEY_JWT_METADATA;

		mockFetchMetadata({ ...validMetadata, ...privateKeyJwtWithoutAlg });

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('CIMD rejects private_key_jwt with non-RS256 signing alg', async () => {
		mockFetchMetadata({ ...validMetadata, ...PRIVATE_KEY_JWT_METADATA, token_endpoint_auth_signing_alg: 'ES256' });

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('CIMD rejects cross-origin private_key_jwt jwks_uri', async () => {
		mockFetchMetadata({
			...validMetadata,
			...PRIVATE_KEY_JWT_METADATA,
			jwks_uri: 'https://keys.example.net/jwks.json',
		});

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('CIMD rejects private_key_jwt jwks_uri outside the CIMD domain allowlist', async () => {
		vi.mocked(useEnv).mockReturnValue({
			MCP_OAUTH_CIMD_ALLOW_HTTP: false,
			MCP_OAUTH_CIMD_BLOCKED_TLDS: [],
			MCP_OAUTH_CIMD_ALLOWED_DOMAINS: ['allowed.example.com'],
		} as any);

		mockFetchMetadata({ ...validMetadata, ...PRIVATE_KEY_JWT_METADATA });

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('CIMD rejects malformed private_key_jwt jwks_uri', async () => {
		mockFetchMetadata({ ...validMetadata, ...PRIVATE_KEY_JWT_METADATA, jwks_uri: 'not-a-url' });

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it.each([
		['overlong URL', `https://myapp.example.com/${'a'.repeat(256)}`, 'jwks_uri is too long'],
		['http', 'http://myapp.example.com/jwks.json', 'jwks_uri must use HTTPS'],
		['credentials', 'https://user:pass@myapp.example.com/jwks.json', 'jwks_uri must not contain credentials'],
		['fragment', 'https://myapp.example.com/jwks.json#keys', 'jwks_uri must not contain a fragment'],
		['empty fragment', 'https://myapp.example.com/jwks.json#', 'jwks_uri must not contain a fragment'],
		['dot segment', 'https://myapp.example.com/oauth/../jwks.json', 'jwks_uri must not contain dot segments'],
		['IP literal', 'https://192.0.2.1/jwks.json', 'jwks_uri must not use an IP address'],
		['non-canonical default port', 'https://myapp.example.com:443/jwks.json', 'jwks_uri must be canonical'],
	])('CIMD rejects private_key_jwt jwks_uri with %s', async (_name, jwksUri, description) => {
		mockFetchMetadata({ ...validMetadata, ...PRIVATE_KEY_JWT_METADATA, jwks_uri: jwksUri });

		await expectOAuthError(fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'), {
			...invalidClientMetadata,
			description,
		});
	});

	it('CIMD rejects HTTP private_key_jwt jwks_uri when HTTP CIMD is explicitly enabled', async () => {
		vi.mocked(useEnv).mockReturnValue({
			MCP_OAUTH_CIMD_ALLOW_HTTP: true,
			MCP_OAUTH_CIMD_BLOCKED_TLDS: [],
			MCP_OAUTH_CIMD_ALLOWED_DOMAINS: [],
		} as any);

		const httpClientId = 'http://myapp.example.com/.well-known/oauth-client';

		mockFetchMetadata({
			...validMetadata,
			...PRIVATE_KEY_JWT_METADATA,
			client_id: httpClientId,
			redirect_uris: ['http://localhost:9876/callback'],
			jwks_uri: 'http://myapp.example.com/jwks.json',
		});

		await expectOAuthError(fetchCimdMetadata(httpClientId), {
			...invalidClientMetadata,
			description: 'jwks_uri must use HTTPS',
		});
	});

	it('rejects null response body', async () => {
		mockFetchMetadata(null);

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);

		try {
			await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client');
		} catch (err) {
			expect((err as any).code).toBe('invalid_client_metadata');
			expect((err as any).description).toBe('Client metadata document must be a JSON object');
		}
	});

	it('maps fetchExternalJson failures to generic metadata fetch errors', async () => {
		mockFetchExternalJson.mockRejectedValue(
			new OAuthError(
				400,
				'invalid_client_metadata',
				'CIMD metadata: External JSON response must use a JSON content type',
			),
		);

		await expectOAuthError(fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'), {
			...invalidClientMetadata,
			description: 'Failed to fetch client metadata document',
		});
	});

	it('passes HTTP and conditional request options into fetchExternalJson', async () => {
		vi.mocked(useEnv).mockReturnValue({
			MCP_OAUTH_CIMD_ALLOW_HTTP: true,
			MCP_OAUTH_CIMD_BLOCKED_TLDS: [],
			MCP_OAUTH_CIMD_ALLOWED_DOMAINS: [],
		} as any);

		const httpClientId = 'http://myapp.example.dev/.well-known/oauth-client';
		mockFetchMetadata({ ...validMetadata, client_id: httpClientId });

		await fetchCimdMetadata(httpClientId, '"old"');

		expect(mockFetchExternalJson).toHaveBeenCalledWith(httpClientId, {
			headers: { 'If-None-Match': '"old"' },
			allowHttp: true,
			allowLoopbackForLocalDevelopment: false,
			allowNotModified: true,
			redactionContext: 'CIMD metadata',
		});
	});

	it('handles 304 Not Modified with etag', async () => {
		mockFetchNotModified();

		const result = await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client', '"abc123"');

		expect(result.notModified).toBe(true);
		expect(result.metadata).toBeUndefined();
		expect(result.ttlMs).toBeNull();
	});

	it('304 with Cache-Control max-age returns parsed TTL', async () => {
		mockFetchNotModified({ cacheControl: 'max-age=3600' });

		const result = await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client', '"abc123"');

		expect(result.notModified).toBe(true);
		expect(result.metadata).toBeUndefined();
		expect(result.ttlMs).toBe(3_600_000);
	});

	it('rejects non-200/304 status (e.g. redirect)', async () => {
		mockFetchExternalJson.mockRejectedValue(new OAuthError(400, 'invalid_client_metadata', 'Request failed'));

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('maps request-layer failures to invalid_client_metadata', async () => {
		mockFetchExternalJson.mockRejectedValue(new Error('Network failed'));

		try {
			await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client');
			expect.unreachable('Expected OAuthError');
		} catch (err) {
			expect(err).toBeInstanceOf(OAuthError);

			expect(err).toMatchObject({
				status: 400,
				code: 'invalid_client_metadata',
				description: 'Failed to fetch client metadata document',
			});
		}
	});

	it('defaults grant_types to authorization_code when absent', async () => {
		const { grant_types: _, ...metaWithoutGrants } = validMetadata;

		mockFetchMetadata(metaWithoutGrants);

		const result = await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client');
		expect(result.metadata!.grant_types).toEqual(['authorization_code']);
	});

	it('rejects grant_types that do not include authorization_code', async () => {
		mockFetchMetadata({ ...validMetadata, grant_types: ['client_credentials'] });

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects response_types other than ["code"]', async () => {
		mockFetchMetadata({ ...validMetadata, response_types: ['token'] });

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('defaults token_endpoint_auth_method to none when absent', async () => {
		const { token_endpoint_auth_method: _, ...metaWithoutAuth } = validMetadata;

		mockFetchMetadata(metaWithoutAuth);

		const result = await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client');
		expect(result.metadata!.token_endpoint_auth_method).toBe('none');
	});

	it('validates optional URI fields as HTTPS', async () => {
		mockFetchMetadata({ ...validMetadata, client_uri: 'http://insecure.example.com' });

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('accepts valid optional URI fields', async () => {
		mockFetchMetadata({
			...validMetadata,
			client_uri: 'https://myapp.example.com',
			logo_uri: 'https://myapp.example.com/logo.png',
			tos_uri: 'https://myapp.example.com/tos',
			policy_uri: 'https://myapp.example.com/policy',
		});

		const result = await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client');
		expect(result.metadata).toBeDefined();
	});

	it('rejects invalid redirect_uris (HTTP non-localhost)', async () => {
		mockFetchMetadata({ ...validMetadata, redirect_uris: ['http://example.com/callback'] });

		await expectOAuthError(fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'), {
			status: 400,
			code: 'invalid_redirect_uri',
		});
	});
});
