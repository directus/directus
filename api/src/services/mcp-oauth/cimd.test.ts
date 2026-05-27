import type { AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OAuthError } from './types/error.js';

const { MockCimdEgressError, mockCimdLookup, mockCreateCimdLookup } = vi.hoisted(() => {
	class MockCimdEgressError extends Error {
		reason: string;

		constructor(reason: string) {
			super(`CIMD egress rejected: ${reason}`);
			this.name = 'CimdEgressError';
			this.reason = reason;
		}
	}

	const mockCimdLookup = vi.fn();

	return {
		MockCimdEgressError,
		mockCimdLookup,
		mockCreateCimdLookup: vi.fn(() => mockCimdLookup),
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

const mockAxiosGet = vi.fn();

vi.mock('../../request/index.js', () => ({
	getAxios: vi.fn().mockResolvedValue({
		get: (...args: unknown[]) => mockAxiosGet(...args),
	} as unknown as AxiosInstance),
}));

vi.mock('./utils/cimd-egress.js', () => ({
	CimdEgressError: MockCimdEgressError,
	createCimdLookup: mockCreateCimdLookup,
}));

// Must import after mocks
const { detectClientIdType, isValidCimdClientId, getAllowedDomains, resolveCacheTtl, fetchCimdMetadata } = await import(
	'./cimd.js'
);

const { useEnv } = await import('@directus/env');

const invalidClientMetadata = { status: 400, code: 'invalid_client_metadata' } as const;

async function expectOAuthError(promise: Promise<unknown>, expected: { status: number; code: string }) {
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
		mockAxiosGet.mockReset();
		mockCimdLookup.mockClear();
		mockCreateCimdLookup.mockClear();
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
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json', etag: '"abc123"', 'cache-control': 'max-age=3600' },
			data: validMetadata,
		});

		const result = await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client');

		expect(result.notModified).toBe(false);
		expect(result.metadata).toBeDefined();
		expect(result.metadata!.client_id).toBe(validMetadata.client_id);
		expect(result.etag).toBe('"abc123"');
		expect(result.ttlMs).toBe(3_600_000);
		expect(mockCreateCimdLookup).toHaveBeenCalledWith({ deadlineAt: expect.any(Number) });

		expect(mockAxiosGet).toHaveBeenCalledWith(
			'https://myapp.example.com/.well-known/oauth-client',
			expect.objectContaining({ lookup: mockCimdLookup, proxy: false }),
		);
	});

	it('rejects IP-literal URL hostnames before dispatch', async () => {
		await expectOAuthError(fetchCimdMetadata('https://[::1]/.well-known/oauth-client'), invalidClientMetadata);

		expect(mockAxiosGet).not.toHaveBeenCalled();
	});

	it('maps CimdEgressError from lookup path to invalid_client_metadata', async () => {
		mockAxiosGet.mockRejectedValue(new MockCimdEgressError('blocked_private_ip'));

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects client_id mismatch', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: { ...validMetadata, client_id: 'https://other.example.com/client' },
		});

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects missing client_name', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: { ...validMetadata, client_name: undefined },
		});

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects client_name exceeding 200 chars', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: { ...validMetadata, client_name: 'x'.repeat(201) },
		});

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects missing redirect_uris', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: { ...validMetadata, redirect_uris: undefined },
		});

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects empty redirect_uris array', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: { ...validMetadata, redirect_uris: [] },
		});

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects document with client_secret', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: { ...validMetadata, client_secret: 'secret123' },
		});

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects document with client_secret_expires_at', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: { ...validMetadata, client_secret_expires_at: 0 },
		});

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects shared-secret auth method (client_secret_basic)', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: { ...validMetadata, token_endpoint_auth_method: 'client_secret_basic' },
		});

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects private_key_jwt (not supported by server)', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: { ...validMetadata, token_endpoint_auth_method: 'private_key_jwt' },
		});

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects null response body', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: null,
		});

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

	it('rejects non-JSON content type', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'text/html' },
			data: validMetadata,
		});

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it.each(['application/jsonp', 'application/json-seq', 'application/jsonxyz'])(
		'rejects non-JSON application subtype %s',
		async (contentType) => {
			mockAxiosGet.mockResolvedValue({
				status: 200,
				headers: { 'content-type': contentType },
				data: validMetadata,
			});

			await expectOAuthError(
				fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
				invalidClientMetadata,
			);
		},
	);

	it('accepts application/*+json content type', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/vnd.example+json; charset=utf-8', etag: '"v1"' },
			data: validMetadata,
		});

		const result = await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client');
		expect(result.notModified).toBe(false);
		expect(result.metadata).toBeDefined();
	});

	it('handles 304 Not Modified with etag', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 304,
			headers: {},
			data: null,
		});

		const result = await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client', '"abc123"');

		expect(result.notModified).toBe(true);
		expect(result.metadata).toBeUndefined();
		expect(result.ttlMs).toBeNull();
	});

	it('304 with Cache-Control max-age returns parsed TTL', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 304,
			headers: { 'cache-control': 'max-age=3600' },
			data: null,
		});

		const result = await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client', '"abc123"');

		expect(result.notModified).toBe(true);
		expect(result.metadata).toBeUndefined();
		expect(result.ttlMs).toBe(3_600_000);
	});

	it('rejects non-200/304 status (e.g. redirect)', async () => {
		mockAxiosGet.mockRejectedValue(
			Object.assign(new Error('Request failed'), {
				response: { status: 301, headers: {}, data: null },
				isAxiosError: true,
			}),
		);

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('maps request-layer denied IP failures to invalid_client_metadata', async () => {
		mockAxiosGet.mockRejectedValue(new Error('Requested domain "metadata.example" resolves to a denied IP address'));

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

		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: metaWithoutGrants,
		});

		const result = await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client');
		expect(result.metadata!.grant_types).toEqual(['authorization_code']);
	});

	it('rejects grant_types that do not include authorization_code', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: { ...validMetadata, grant_types: ['client_credentials'] },
		});

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('rejects response_types other than ["code"]', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: { ...validMetadata, response_types: ['token'] },
		});

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('defaults token_endpoint_auth_method to none when absent', async () => {
		const { token_endpoint_auth_method: _, ...metaWithoutAuth } = validMetadata;

		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: metaWithoutAuth,
		});

		const result = await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client');
		expect(result.metadata!.token_endpoint_auth_method).toBe('none');
	});

	it('validates optional URI fields as HTTPS', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: { ...validMetadata, client_uri: 'http://insecure.example.com' },
		});

		await expectOAuthError(
			fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'),
			invalidClientMetadata,
		);
	});

	it('accepts valid optional URI fields', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: {
				...validMetadata,
				client_uri: 'https://myapp.example.com',
				logo_uri: 'https://myapp.example.com/logo.png',
				tos_uri: 'https://myapp.example.com/tos',
				policy_uri: 'https://myapp.example.com/policy',
			},
		});

		const result = await fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client');
		expect(result.metadata).toBeDefined();
	});

	it('rejects invalid redirect_uris (HTTP non-localhost)', async () => {
		mockAxiosGet.mockResolvedValue({
			status: 200,
			headers: { 'content-type': 'application/json' },
			data: { ...validMetadata, redirect_uris: ['http://example.com/callback'] },
		});

		await expectOAuthError(fetchCimdMetadata('https://myapp.example.com/.well-known/oauth-client'), {
			status: 400,
			code: 'invalid_redirect_uri',
		});
	});
});
