import { exportJWK, generateKeyPair, type JWK, SignJWT } from 'jose';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { OAuthError } from './types/error.js';

const mockFetchExternalJson = vi.fn();

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		MCP_OAUTH_CIMD_ALLOW_HTTP: false,
		MCP_OAUTH_CIMD_ALLOWED_DOMAINS: [],
	}),
}));

vi.mock('./utils/external-json.js', () => ({
	fetchExternalJson: async (...args: unknown[]) => mockFetchExternalJson(...args),
}));

const { useEnv } = await import('@directus/env');

const { __clearJwksCachesForTests, JwksVerificationError, verifyClientAssertion } = await import('./jwks.js');

const clientId = 'https://client.example.com/oauth/client.json';
const jwksUri = 'https://client.example.com/oauth/jwks.json';
const tokenAudience = 'https://directus.example.com/mcp-oauth/token';
const now = new Date('2026-05-27T12:00:00.000Z');

let privateKey: CryptoKey;
let publicJwk: JWK;
let rotatedPrivateKey: CryptoKey;
let rotatedPublicJwk: JWK;

function addLeadingZeroOctet(value: string): string {
	const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
	const bytes = Buffer.from(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='), 'base64');
	return Buffer.concat([Buffer.from([0]), bytes]).toString('base64url');
}

async function expectInvalidClient(
	promise: Promise<unknown>,
	reason?: InstanceType<typeof JwksVerificationError>['reason'],
) {
	let error: unknown;

	try {
		await promise;
	} catch (err) {
		error = err;
	}

	expect(error).toBeInstanceOf(OAuthError);
	expect(error).toMatchObject({ status: 401, code: 'invalid_client' });

	if (reason !== undefined) {
		expect(error).toBeInstanceOf(JwksVerificationError);
		expect(error).toMatchObject({ reason });
	}
}

function mockJwks(keys: JWK[]) {
	mockFetchExternalJson.mockResolvedValue({
		status: 200,
		data: { keys },
		etag: null,
		cacheControl: undefined,
		expires: undefined,
	});
}

async function signAssertion(options: {
	kid?: string;
	key?: CryptoKey;
	clientId?: string;
	audience?: string;
	jti?: string;
	alg?: string;
	now?: Date;
}) {
	const issuedAt = Math.floor((options.now ?? now).getTime() / 1000);
	const key = options.key ?? privateKey;
	const alg = options.alg ?? 'RS256';

	return await new SignJWT({ jti: options.jti ?? crypto.randomUUID() })
		.setProtectedHeader({ alg, ...(options.kid !== undefined && { kid: options.kid }), typ: 'JWT' })
		.setIssuer(options.clientId ?? clientId)
		.setSubject(options.clientId ?? clientId)
		.setAudience(options.audience ?? tokenAudience)
		.setIssuedAt(issuedAt)
		.setExpirationTime(issuedAt + 120)
		.sign(key);
}

function compactJwt(header: Record<string, unknown>, payload: Record<string, unknown> = {}) {
	const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
	return `${encode(header)}.${encode(payload)}.signature`;
}

async function signCustomAssertion(options: {
	payload?: Record<string, unknown>;
	kid?: string;
	key?: CryptoKey;
	issuer?: string;
	subject?: string;
	audience?: string | string[];
	issuedAt?: number;
	expirationTime?: number;
	omitIssuedAt?: boolean;
	omitExpirationTime?: boolean;
}) {
	const issuedAt = options.issuedAt ?? Math.floor(now.getTime() / 1000);

	let jwt = new SignJWT(options.payload ?? { jti: crypto.randomUUID() })
		.setProtectedHeader({ alg: 'RS256', kid: options.kid ?? 'key-1', typ: 'JWT' })
		.setIssuer(options.issuer ?? clientId)
		.setSubject(options.subject ?? clientId)
		.setAudience(options.audience ?? tokenAudience);

	if (!options.omitIssuedAt) {
		jwt = jwt.setIssuedAt(issuedAt);
	}

	if (!options.omitExpirationTime) {
		jwt = jwt.setExpirationTime(options.expirationTime ?? issuedAt + 120);
	}

	return await jwt.sign(options.key ?? privateKey);
}

function verify(assertion: string, overrides: Partial<Parameters<typeof verifyClientAssertion>[0]> = {}) {
	return verifyClientAssertion({
		clientId,
		jwksUri,
		assertion,
		acceptedAudiences: [tokenAudience],
		now,
		...overrides,
	});
}

describe('verifyClientAssertion', () => {
	beforeAll(async () => {
		({ privateKey, publicKey: publicJwk } = await createRsaJwkPair('key-1'));
		({ privateKey: rotatedPrivateKey, publicKey: rotatedPublicJwk } = await createRsaJwkPair('key-2'));
	});

	beforeEach(() => {
		vi.useRealTimers();

		vi.mocked(useEnv).mockReturnValue({
			MCP_OAUTH_CIMD_ALLOW_HTTP: false,
			MCP_OAUTH_CIMD_ALLOWED_DOMAINS: [],
		} as any);

		mockFetchExternalJson.mockReset();
		__clearJwksCachesForTests();
	});

	it('verifies an RS256 client assertion and reuses the positive JWKS cache', async () => {
		mockJwks([publicJwk]);

		const firstAssertion = await signAssertion({ kid: 'key-1', jti: 'jti-1' });
		const secondAssertion = await signAssertion({ kid: 'key-1', jti: 'jti-2' });

		const verified = await verify(firstAssertion);
		await verify(secondAssertion);

		expect(verified.header).toMatchObject({ alg: 'RS256', kid: 'key-1' });
		expect(verified.payload).toMatchObject({ iss: clientId, sub: clientId, aud: tokenAudience, jti: 'jti-1' });
		expect(verified.claims).toMatchObject({ jti: 'jti-1', exp: expect.any(Number), iat: expect.any(Number) });
		expect(mockFetchExternalJson).toHaveBeenCalledTimes(1);

		expect(mockFetchExternalJson).toHaveBeenCalledWith(jwksUri, {
			maxBytes: 32_768,
			timeoutMs: 3_000,
			allowHttp: false,
			allowLoopbackForLocalDevelopment: false,
			redactionContext: 'MCP OAuth JWKS',
		});
	});

	it('rejects HTTP JWKS even when HTTP CIMD is explicitly enabled', async () => {
		vi.mocked(useEnv).mockReturnValue({
			MCP_OAUTH_CIMD_ALLOW_HTTP: true,
			MCP_OAUTH_CIMD_ALLOWED_DOMAINS: [],
		} as any);

		mockJwks([publicJwk]);

		const httpClientId = 'http://client.example.com/oauth/client.json';
		const assertion = await signAssertion({ kid: 'key-1', clientId: httpClientId });

		await expectInvalidClient(
			verify(assertion, {
				clientId: httpClientId,
				jwksUri: 'http://client.example.com/oauth/jwks.json',
			}),
			'invalid_jwks_uri',
		);

		expect(mockFetchExternalJson).not.toHaveBeenCalled();
	});

	it('expires the positive JWKS cache after 5 minutes', async () => {
		mockJwks([publicJwk]);

		await verify(await signAssertion({ kid: 'key-1', jti: 'jti-1' }));
		const beforePositiveCacheExpiry = new Date(now.getTime() + 299_000);

		await verify(await signAssertion({ kid: 'key-1', jti: 'jti-2', now: beforePositiveCacheExpiry }), {
			now: beforePositiveCacheExpiry,
		});

		expect(mockFetchExternalJson).toHaveBeenCalledTimes(1);

		const afterPositiveCacheExpiry = new Date(now.getTime() + 301_000);

		await verify(await signAssertion({ kid: 'key-1', jti: 'jti-3', now: afterPositiveCacheExpiry }), {
			now: afterPositiveCacheExpiry,
		});

		expect(mockFetchExternalJson).toHaveBeenCalledTimes(2);
	});

	it.each([
		['http without local opt-in', 'http://client.example.com/oauth/jwks.json'],
		['credentials', 'https://user:pass@client.example.com/oauth/jwks.json'],
		['fragment', 'https://client.example.com/oauth/jwks.json#keys'],
		['empty fragment', 'https://client.example.com/oauth/jwks.json#'],
		['dot segment', 'https://client.example.com/oauth/../jwks.json'],
		['non-canonical', 'https://client.example.com:443/oauth/jwks.json'],
		['IP hostname', 'https://192.0.2.1/oauth/jwks.json'],
		['cross-origin hostname', 'https://keys.example.com/oauth/jwks.json'],
		['cross-origin effective port', 'https://client.example.com:8443/oauth/jwks.json'],
	])('rejects invalid jwks_uri before fetching: %s', async (_name, invalidUri) => {
		const assertion = await signAssertion({ kid: 'key-1' });

		await expectInvalidClient(verify(assertion, { jwksUri: invalidUri }), 'invalid_jwks_uri');

		expect(mockFetchExternalJson).not.toHaveBeenCalled();
	});

	it.each([
		['non-RS256 alg', { alg: 'HS256', typ: 'JWT' }],
		['none alg', { alg: 'none', typ: 'JWT' }],
		['invalid typ', { alg: 'RS256', typ: 'id_token' }],
		['crit header', { alg: 'RS256', typ: 'JWT', crit: ['exp'] }],
		['jku header', { alg: 'RS256', typ: 'JWT', jku: 'https://client.example.com/jwks.json' }],
		['embedded jwk header', { alg: 'RS256', typ: 'JWT', jwk: {} }],
		['x5u header', { alg: 'RS256', typ: 'JWT', x5u: 'https://client.example.com/cert.pem' }],
		['x5c header', { alg: 'RS256', typ: 'JWT', x5c: ['certificate'] }],
		['enc header', { alg: 'RS256', typ: 'JWT', enc: 'A256GCM' }],
		['non-string kid', { alg: 'RS256', typ: 'JWT', kid: 42 }],
	])('rejects invalid assertion headers before fetching JWKS: %s', async (_name, header) => {
		await expectInvalidClient(verify(compactJwt(header)), 'invalid_header');

		expect(mockFetchExternalJson).not.toHaveBeenCalled();
	});

	it('enforces the CIMD domain allowlist before fetching', async () => {
		vi.mocked(useEnv).mockReturnValue({
			MCP_OAUTH_CIMD_ALLOW_HTTP: false,
			MCP_OAUTH_CIMD_ALLOWED_DOMAINS: ['allowed.example.com'],
		} as any);

		const assertion = await signAssertion({ kid: 'key-1' });

		await expectInvalidClient(verify(assertion), 'invalid_jwks_uri');

		expect(mockFetchExternalJson).not.toHaveBeenCalled();
	});

	it.each([
		['missing keys array', () => ({})],
		['private RSA parameter', () => ({ keys: [{ ...publicJwk, d: 'secret' }] })],
		['RSA modulus below 2048 bits', () => ({ keys: [{ ...publicJwk, n: 'AQ'.repeat(128) }] })],
		['unsupported RSA exponent', () => ({ keys: [{ ...publicJwk, e: 'Aw' }] })],
		['RSA modulus with padding', () => ({ keys: [{ ...publicJwk, n: `${publicJwk.n}=` }] })],
		['RSA modulus with non-base64url characters', () => ({ keys: [{ ...publicJwk, n: `${publicJwk.n}!` }] })],
		['RSA modulus with invalid base64url length', () => ({ keys: [{ ...publicJwk, n: 'A' }] })],
		[
			'RSA modulus with a non-minimal leading zero octet',
			() => ({ keys: [{ ...publicJwk, n: addLeadingZeroOctet(publicJwk.n as string) }] }),
		],
		['duplicate key_ops values', () => ({ keys: [{ ...publicJwk, key_ops: ['verify', 'verify'] }] })],
		['non-string key_ops value', () => ({ keys: [{ ...publicJwk, key_ops: ['verify', 42] }] })],
		['unrelated key_ops value', () => ({ keys: [{ ...publicJwk, key_ops: ['verify', 'encrypt'] }] })],
	])('rejects malformed JWKS documents: %s', async (_name, createJwks) => {
		mockFetchExternalJson.mockResolvedValue({
			status: 200,
			data: createJwks(),
			etag: null,
			cacheControl: undefined,
			expires: undefined,
		});

		const assertion = await signAssertion({ kid: 'key-1' });

		await expectInvalidClient(verify(assertion), 'invalid_jwks');
	});

	it('uses a compatible RSA signing key from mixed JWKS documents', async () => {
		mockJwks([
			{ kty: 'EC', crv: 'P-256', x: 'ignored', y: 'ignored', kid: 'ec-key' },
			{ ...rotatedPublicJwk, kid: 'ignored-ps256', alg: 'PS256' },
			{ ...rotatedPublicJwk, kid: 'ignored-encryption-use', use: 'enc' },
			{ ...rotatedPublicJwk, kid: 'ignored-sign-only', key_ops: ['sign'] },
			publicJwk,
		]);

		await expect(verify(await signAssertion({ kid: 'key-1' }))).resolves.toMatchObject({
			header: { alg: 'RS256', kid: 'key-1' },
		});
	});

	it('returns no_matching_key when a JWKS has no compatible RSA signing keys', async () => {
		mockJwks([
			{ kty: 'EC', crv: 'P-256', x: 'ignored', y: 'ignored', kid: 'ec-key' },
			{ ...rotatedPublicJwk, kid: 'ignored-ps256', alg: 'PS256' },
			{ ...rotatedPublicJwk, kid: 'ignored-encryption-use', use: 'enc' },
			{ ...rotatedPublicJwk, kid: 'ignored-sign-only', key_ops: ['sign'] },
		]);

		await expectInvalidClient(verify(await signAssertion({ kid: 'key-1' })), 'no_matching_key');
	});

	it('rejects JWKS documents with too many compatible RSA signing keys', async () => {
		const keys = Array.from({ length: 9 }, (_value, index) => ({ ...publicJwk, kid: `key-${index}` }));
		mockJwks(keys);

		await expectInvalidClient(verify(await signAssertion({ kid: 'key-1' })), 'invalid_jwks');
	});

	it('rejects duplicate compatible keys for a matching kid', async () => {
		mockJwks([publicJwk, { ...rotatedPublicJwk, kid: 'key-1' }]);

		await expectInvalidClient(verify(await signAssertion({ kid: 'key-1' })), 'no_matching_key');
	});

	it('allows no-kid assertions only when exactly one compatible key exists', async () => {
		mockJwks([publicJwk]);

		await expect(verify(await signAssertion({ kid: undefined }))).resolves.toMatchObject({
			header: { alg: 'RS256' },
		});

		__clearJwksCachesForTests();
		mockJwks([publicJwk, rotatedPublicJwk]);

		await expectInvalidClient(verify(await signAssertion({ kid: undefined })), 'no_matching_key');
	});

	it('does not refetch when a matching kid has a bad signature', async () => {
		mockJwks([publicJwk]);

		await expectInvalidClient(verify(await signAssertion({ kid: 'key-1', key: rotatedPrivateKey })), 'bad_signature');

		expect(mockFetchExternalJson).toHaveBeenCalledTimes(1);
	});

	it.each([
		['missing jti', {}],
		['empty jti', { jti: '' }],
		['overlong jti', { jti: 'a'.repeat(256) }],
	])('rejects assertions with %s', async (_name, payload) => {
		mockJwks([publicJwk]);

		await expectInvalidClient(verify(await signCustomAssertion({ payload })), 'invalid_claims');
	});

	it('rejects assertions whose lifetime exceeds five minutes', async () => {
		mockJwks([publicJwk]);
		const issuedAt = Math.floor(now.getTime() / 1000);

		await expectInvalidClient(
			verify(await signCustomAssertion({ payload: { jti: 'long-lived' }, issuedAt, expirationTime: issuedAt + 301 })),
			'invalid_claims',
		);
	});

	it('rejects assertions issued beyond clock tolerance', async () => {
		mockJwks([publicJwk]);
		const issuedAt = Math.floor(now.getTime() / 1000) + 61;

		await expectInvalidClient(
			verify(await signCustomAssertion({ payload: { jti: 'future-iat' }, issuedAt, expirationTime: issuedAt + 120 })),
			'invalid_claims',
		);
	});

	it('accepts assertions without iat when exp is within the maximum assertion lifetime', async () => {
		mockJwks([publicJwk]);
		const issuedAt = Math.floor(now.getTime() / 1000);

		await expect(
			verify(
				await signCustomAssertion({
					payload: { jti: 'missing-iat' },
					omitIssuedAt: true,
					expirationTime: issuedAt + 120,
				}),
			),
		).resolves.toMatchObject({
			claims: { jti: 'missing-iat', exp: issuedAt + 120 },
		});
	});

	it('rejects assertions without iat when exp is beyond the maximum assertion lifetime plus clock tolerance', async () => {
		mockJwks([publicJwk]);
		const issuedAt = Math.floor(now.getTime() / 1000);

		await expectInvalidClient(
			verify(
				await signCustomAssertion({
					payload: { jti: 'missing-iat-long-lived' },
					omitIssuedAt: true,
					expirationTime: issuedAt + 361,
				}),
			),
			'invalid_claims',
		);
	});

	it('rejects assertions without exp', async () => {
		mockJwks([publicJwk]);

		await expectInvalidClient(
			verify(await signCustomAssertion({ payload: { jti: 'missing-exp' }, omitExpirationTime: true })),
			'invalid_claims',
		);
	});

	it.each([
		['issuer mismatch', { issuer: 'https://other.example.com/oauth/client.json' }],
		['subject mismatch', { subject: 'https://other.example.com/oauth/client.json' }],
		['wrong audience', { audience: 'https://directus.example.com/mcp-oauth/revoke' }],
	])('rejects assertions with %s', async (_name, options) => {
		mockJwks([publicJwk]);

		await expectInvalidClient(
			verify(await signCustomAssertion({ payload: { jti: crypto.randomUUID() }, ...options })),
			'bad_signature',
		);
	});

	it('refetches once for an unknown kid and succeeds after key rotation', async () => {
		mockFetchExternalJson
			.mockResolvedValueOnce({
				status: 200,
				data: { keys: [publicJwk] },
				etag: null,
				cacheControl: undefined,
				expires: undefined,
			})
			.mockResolvedValueOnce({
				status: 200,
				data: { keys: [rotatedPublicJwk] },
				etag: null,
				cacheControl: undefined,
				expires: undefined,
			});

		await expect(verify(await signAssertion({ kid: 'key-2', key: rotatedPrivateKey }))).resolves.toMatchObject({
			header: { kid: 'key-2' },
		});

		expect(mockFetchExternalJson).toHaveBeenCalledTimes(2);
	});

	it('negative-caches failed initial fetches for 30 seconds', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(now);
		mockFetchExternalJson.mockRejectedValue(new OAuthError(400, 'invalid_client_metadata', 'fetch failed'));

		const assertion = await signAssertion({ kid: 'key-1' });

		await expectInvalidClient(verify(assertion), 'jwks_fetch_failed');
		await expectInvalidClient(verify(assertion), 'jwks_fetch_failed');
		expect(mockFetchExternalJson).toHaveBeenCalledTimes(1);

		const afterNegativeCacheExpiry = new Date(now.getTime() + 31_000);
		vi.setSystemTime(afterNegativeCacheExpiry);
		await expectInvalidClient(verify(assertion, { now: afterNegativeCacheExpiry }), 'jwks_fetch_failed');
		expect(mockFetchExternalJson).toHaveBeenCalledTimes(2);
	});

	it('keeps a valid cached JWKS when a refetch fails', async () => {
		mockFetchExternalJson
			.mockResolvedValueOnce({
				status: 200,
				data: { keys: [publicJwk] },
				etag: null,
				cacheControl: undefined,
				expires: undefined,
			})
			.mockRejectedValue(new OAuthError(400, 'invalid_client_metadata', 'fetch failed'));

		await verify(await signAssertion({ kid: 'key-1', jti: 'jti-1' }));

		await expectInvalidClient(
			verify(await signAssertion({ kid: 'key-2', key: rotatedPrivateKey, jti: 'jti-2' })),
			'jwks_fetch_failed',
		);

		await verify(await signAssertion({ kid: 'key-1', jti: 'jti-3' }));

		expect(mockFetchExternalJson).toHaveBeenCalledTimes(2);
	});

	it('shares parallel JWKS fetches through singleflight', async () => {
		let resolveFetch: (value: unknown) => void;

		const fetchPromise = new Promise((resolve) => {
			resolveFetch = resolve;
		});

		mockFetchExternalJson.mockReturnValue(fetchPromise);

		const assertionA = await signAssertion({ kid: 'key-1', jti: 'jti-a' });
		const assertionB = await signAssertion({ kid: 'key-1', jti: 'jti-b' });

		const verifications = Promise.all([verify(assertionA), verify(assertionB)]);

		resolveFetch!({
			status: 200,
			data: { keys: [publicJwk] },
			etag: null,
			cacheControl: undefined,
			expires: undefined,
		});

		await verifications;

		expect(mockFetchExternalJson).toHaveBeenCalledTimes(1);
	});

	it('negative-caches unknown-kid refetch misses per jwks_uri', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(now);
		mockJwks([publicJwk]);

		await verify(await signAssertion({ kid: 'key-1', jti: 'jti-1' }));

		await expectInvalidClient(
			verify(await signAssertion({ kid: 'key-2', key: rotatedPrivateKey, jti: 'jti-2' })),
			'no_matching_key',
		);

		await expectInvalidClient(
			verify(await signAssertion({ kid: 'key-3', key: rotatedPrivateKey, jti: 'jti-3' })),
			'no_matching_key',
		);

		expect(mockFetchExternalJson).toHaveBeenCalledTimes(2);

		const afterUnknownKeyCacheExpiry = new Date(now.getTime() + 31_000);
		vi.setSystemTime(afterUnknownKeyCacheExpiry);

		await expectInvalidClient(
			verify(await signAssertion({ kid: 'key-4', key: rotatedPrivateKey, jti: 'jti-4' }), {
				now: afterUnknownKeyCacheExpiry,
			}),
			'no_matching_key',
		);

		expect(mockFetchExternalJson).toHaveBeenCalledTimes(3);
	});
});

async function createRsaJwkPair(kid: string) {
	const { privateKey, publicKey } = await generateKeyPair('RS256', { modulusLength: 2048 });
	const publicJwk = await exportJWK(publicKey);

	return {
		privateKey,
		publicKey: {
			...publicJwk,
			kid,
			kty: 'RSA',
			alg: 'RS256',
			use: 'sig',
			key_ops: ['verify'],
		},
	};
}
