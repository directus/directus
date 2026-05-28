import {
	InvalidCredentialsError,
	InvalidProviderConfigError,
	InvalidProviderError,
	InvalidTokenError,
} from '@directus/errors';
import { errors as openidErrors } from 'openid-client';
import type { Logger } from 'pino';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useLogger } from '../../logger/index.js';
import { FAPIAuthDriver } from './fapi.js';

// ── Global mocks ────────────────────────────────────────────────────────────

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => ({ EMAIL_TEMPLATES_PATH: './templates' })),
}));

vi.mock('../../auth.js', () => ({
	getAuthProvider: vi.fn(),
}));

vi.mock('../../utils/get-secret.js', () => ({
	getSecret: vi.fn(() => 'test-secret'),
}));

vi.mock('../utils/generate-callback-url.js', () => ({
	generateCallbackUrl: vi.fn(() => 'http://localhost:8055/auth/login/test/callback'),
}));

vi.mock('../../logger');
vi.mock('../../database');

vi.mock('../../emitter', () => ({
	default: {
		emitFilter: vi.fn().mockImplementation((_event, payload) => Promise.resolve(payload)),
	},
}));

vi.mock('../../app', () => ({ default: {} }));
vi.mock('../../middleware/respond', () => ({ respond: vi.fn() }));

vi.mock('../../utils/get-schema', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../../utils/async-handler', () => ({
	default: (fn: any) => fn,
}));

// Mock DPoP utilities so we can control key material in tests
vi.mock('../utils/dpop.js', () => ({
	generateDpopKeypair: vi.fn(() => ({
		privateKey: { type: 'private', export: vi.fn(() => ({ kty: 'EC', crv: 'P-256' })) },
		publicKey: { type: 'public' },
	})),
	storeHandshakeDpopKey: vi.fn(),
	loadAndEvictHandshakeDpopKey: vi.fn(),
	dpopKeyToJwk: vi.fn(() => '{"kty":"EC","crv":"P-256","d":"private"}'),
	dpopKeyFromJwk: vi.fn(() => ({
		privateKey: { type: 'private' },
		publicKey: { type: 'public' },
	})),
}));

// Mock load-jwks — keep it simple; validity is tested in load-jwks unit tests
vi.mock('../utils/load-jwks.js', () => ({
	loadJwks: vi.fn(() => ({
		privateJwks: { keys: [{ kty: 'EC', crv: 'P-256', kid: 'sig-1', use: 'sig', alg: 'ES256' }] },
		publicJwks: { keys: [{ kty: 'EC', crv: 'P-256', kid: 'sig-1', use: 'sig', alg: 'ES256' }] },
		hasEncryptionKey: false,
	})),
}));

// ── openid-client mock ───────────────────────────────────────────────────────

const mockDpopProof = vi.fn();
const mockClientCtorSpy = vi.fn();

const mockClient: any = {
	pushedAuthorizationRequest: vi.fn(),
	callback: vi.fn(),
	userinfo: vi.fn(),
	refresh: vi.fn(),
	dpopProof: mockDpopProof,
	issuer: {
		metadata: {
			authorization_endpoint: 'https://test.com/authorize',
			pushed_authorization_request_endpoint: 'https://test.com/par',
			userinfo_endpoint: 'https://test.com/userinfo',
		},
	},
	metadata: { client_id: 'test-client-id' },
};

vi.mock('openid-client', () => ({
	Issuer: class MockIssuer {
		static discover = vi.fn().mockResolvedValue({
			metadata: {
				response_types_supported: ['code'],
				pushed_authorization_request_endpoint: 'https://test.com/par',
			},
			Client: class {
				constructor(metadata: any, jwks: any) {
					mockClientCtorSpy(metadata, jwks);
					return mockClient;
				}
			},
		});
	},
	custom: { http_options: Symbol('http_options') },
	generators: {
		codeVerifier: () => 'test-code-verifier',
		codeChallenge: (v: string) => `challenge-${v}`,
		nonce: () => 'test-nonce',
	},
	errors: {
		OPError: class OPError extends Error {
			error: string;
			error_description?: string;
			constructor(params: any) {
				super(params.error);
				this.error = params.error;
				this.error_description = params.error_description;
			}
		},
		RPError: class RPError extends Error {},
	},
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

let mockLogger: Logger;

beforeEach(() => {
	mockLogger = {
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	} as unknown as Logger;

	vi.mocked(useLogger).mockReturnValue(mockLogger);

	mockClient.dpopProof = mockDpopProof;

	// Default PAR response
	mockClient.pushedAuthorizationRequest.mockResolvedValue({
		request_uri: 'urn:ietf:params:oauth:request_uri:test-request-uri',
		expires_in: 90,
	});

	// Default token set
	mockClient.callback.mockResolvedValue({
		access_token: 'test-access-token',
		refresh_token: 'test-refresh-token',
		id_token: 'test-id-token',
		claims: () => ({ sub: 'user-sub-123', email: 'user@example.com' }),
	});

	mockClient.userinfo.mockResolvedValue({ sub: 'user-sub-123', email: 'user@example.com' });
});

afterEach(() => {
	vi.clearAllMocks();
});

const provider = 'fapi2test';

const validKeys = [{ kty: 'EC', crv: 'P-256', kid: 'sig-1', use: 'sig', alg: 'ES256', d: 'private-d', x: 'x', y: 'y' }];

const createFAPIConfig = (overrides: Record<string, any> = {}) => ({
	provider,
	issuerUrl: 'https://idp.example.com',
	clientId: 'test-client-id',
	clientTokenEndpointAuthMethod: 'private_key_jwt',
	clientPrivateKeys: validKeys,
	issuerDiscoveryMustSucceed: false,
	allowPublicRegistration: true,
	...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('FAPIAuthDriver', () => {
	describe('Constructor validation', () => {
		test('throws InvalidProviderConfigError when issuerUrl is missing', () => {
			expect(() => new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig({ issuerUrl: undefined }))).toThrow(
				InvalidProviderConfigError,
			);
		});

		test('throws InvalidProviderConfigError when clientId is missing', () => {
			expect(() => new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig({ clientId: undefined }))).toThrow(
				InvalidProviderConfigError,
			);
		});

		test('throws InvalidProviderConfigError when clientPrivateKeys is missing', () => {
			expect(() => new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig({ clientPrivateKeys: undefined }))).toThrow(
				InvalidProviderConfigError,
			);
		});

		test('throws InvalidProviderConfigError when clientTokenEndpointAuthMethod is not private_key_jwt', () => {
			expect(
				() =>
					new FAPIAuthDriver(
						{ knex: {} as any },
						createFAPIConfig({ clientTokenEndpointAuthMethod: 'client_secret_basic' }),
					),
			).toThrow(InvalidProviderConfigError);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining('clientTokenEndpointAuthMethod must be private_key_jwt'),
			);
		});

		test('throws InvalidProviderError when roleMapping is an Array instead of Object', () => {
			expect(
				() => new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig({ roleMapping: ['role1', 'role2'] })),
			).toThrow(InvalidProviderError);
		});

		test('creates driver successfully with valid config', () => {
			const driver = new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig());
			expect(driver).toBeDefined();
			expect(driver.client).toBeNull();
		});
	});

	describe('generateAuthUrl — PAR flow', () => {
		test('calls pushedAuthorizationRequest and builds authorize redirect with request_uri', async () => {
			const { generateDpopKeypair, storeHandshakeDpopKey } = await import('../utils/dpop.js');
			const driver = new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig());

			await driver['getClient']();

			const url = await driver.generateAuthUrl(
				'test-code-verifier',
				'test-nonce',
				false,
				'http://localhost:8055/callback',
			);

			// PAR was called
			expect(mockClient.pushedAuthorizationRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					response_type: 'code',
					code_challenge_method: 'S256',
					code_challenge: expect.any(String),
				}),
				expect.objectContaining({ DPoP: expect.anything() }),
			);

			// Result is a minimal authorize redirect, not the full param set
			expect(url).toMatch(/^https:\/\/test\.com\/authorize\?/);
			expect(url).toContain('client_id=test-client-id');
			expect(url).toContain('request_uri=');
			expect(url).not.toContain('code_challenge=');

			// DPoP keypair was generated and stashed in cache
			expect(generateDpopKeypair).toHaveBeenCalled();
			expect(storeHandshakeDpopKey).toHaveBeenCalled();
		});

		test('includes prompt=consent when prompt=true', async () => {
			const driver = new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig());
			await driver['getClient']();

			await driver.generateAuthUrl('test-code-verifier', 'test-nonce', true, 'http://localhost:8055/callback');

			expect(mockClient.pushedAuthorizationRequest).toHaveBeenCalledWith(
				expect.objectContaining({ prompt: 'consent' }),
				expect.anything(),
			);
		});
	});

	describe('getUserID', () => {
		test('throws InvalidCredentialsError when code is missing', async () => {
			const driver = new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig());
			await expect(driver.getUserID({ codeVerifier: 'v', state: 's' })).rejects.toThrow(InvalidCredentialsError);
		});

		test('throws InvalidCredentialsError when DPoP handshake key is missing from cache', async () => {
			const { loadAndEvictHandshakeDpopKey } = await import('../utils/dpop.js');
			vi.mocked(loadAndEvictHandshakeDpopKey).mockResolvedValueOnce(null);

			const driver = new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig());
			await driver['getClient']();

			await expect(
				driver.getUserID({ code: 'c', codeVerifier: 'v', nonce: 'test-nonce', state: 's', callbackUrl: 'http://x' }),
			).rejects.toThrow(InvalidCredentialsError);
		});

		test('uses same DPoP key for token exchange and userinfo', async () => {
			const { loadAndEvictHandshakeDpopKey } = await import('../utils/dpop.js');
			const handshakeKey = { privateKey: { type: 'private', name: 'handshake' }, publicKey: { type: 'public' } };
			vi.mocked(loadAndEvictHandshakeDpopKey).mockResolvedValueOnce(handshakeKey as any);

			const driver = new FAPIAuthDriver(
				{
					knex: {
						select: vi.fn().mockReturnThis(),
						from: vi.fn().mockReturnThis(),
						whereRaw: vi.fn().mockReturnThis(),
						first: vi.fn().mockResolvedValue({ id: 'existing-user-id' }),
					} as any,
				},
				createFAPIConfig(),
			);

			vi.spyOn(driver as any, 'getUsersService').mockReturnValue({ updateOne: vi.fn() });

			await driver['getClient']();

			await driver.getUserID({
				code: 'c',
				codeVerifier: 'test-code-verifier',
				nonce: 'test-nonce',
				state: 'challenge-test-code-verifier',
				callbackUrl: 'http://x',
			});

			// callback was called with the correct parameters, checks, and handshake DPoP key
			expect(mockClient.callback).toHaveBeenCalledWith(
				'http://x',
				{ code: 'c', state: 'challenge-test-code-verifier', iss: undefined },
				{ code_verifier: 'test-code-verifier', state: 'challenge-test-code-verifier', nonce: 'test-nonce' },
				expect.objectContaining({ DPoP: handshakeKey.privateKey }),
			);

			// userinfo was called with the SAME handshake DPoP key — not a fresh one
			expect(mockClient.userinfo).toHaveBeenCalledWith(
				'test-access-token',
				expect.objectContaining({ DPoP: handshakeKey.privateKey }),
			);
		});

		test('stores DPoP private key in auth_data alongside refresh token', async () => {
			const { loadAndEvictHandshakeDpopKey, dpopKeyToJwk } = await import('../utils/dpop.js');
			const handshakeKey = { privateKey: { type: 'private' }, publicKey: { type: 'public' } };
			vi.mocked(loadAndEvictHandshakeDpopKey).mockResolvedValueOnce(handshakeKey as any);
			vi.mocked(dpopKeyToJwk).mockReturnValueOnce('{"kty":"EC","d":"private"}');

			const mockUpdateOne = vi.fn();

			const driver = new FAPIAuthDriver(
				{
					knex: {
						select: vi.fn().mockReturnThis(),
						from: vi.fn().mockReturnThis(),
						whereRaw: vi.fn().mockReturnThis(),
						first: vi.fn().mockResolvedValue({ id: 'existing-user-id' }),
					} as any,
				},
				createFAPIConfig(),
			);

			vi.spyOn(driver as any, 'getUsersService').mockReturnValue({
				updateOne: mockUpdateOne,
			});

			await driver['getClient']();

			await driver.getUserID({
				code: 'c',
				codeVerifier: 'test-code-verifier',
				nonce: 'test-nonce',
				state: 'challenge-test-code-verifier',
				callbackUrl: 'http://x',
			});

			expect(mockUpdateOne).toHaveBeenCalledWith(
				'existing-user-id',
				expect.objectContaining({
					auth_data: expect.stringContaining('dpopPrivateJwk'),
				}),
			);

			const authDataArg = JSON.parse(mockUpdateOne.mock.calls[0]![1].auth_data);
			expect(authDataArg.refreshToken).toBe('test-refresh-token');
			expect(authDataArg.dpopPrivateJwk).toBe('{"kty":"EC","d":"private"}');
		});
	});

	describe('refresh', () => {
		test('passes DPoP key from auth_data to client.refresh', async () => {
			const { dpopKeyFromJwk } = await import('../utils/dpop.js');
			const restoredKey = { privateKey: { type: 'private', name: 'restored' }, publicKey: { type: 'public' } };
			vi.mocked(dpopKeyFromJwk).mockReturnValueOnce(restoredKey as any);

			mockClient.refresh.mockResolvedValueOnce({ refresh_token: undefined });

			const driver = new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig());
			await driver['getClient']();

			const user: any = {
				id: 'user-1',
				auth_data: JSON.stringify({ refreshToken: 'old-refresh', dpopPrivateJwk: '{"kty":"EC"}' }),
			};

			await driver.refresh(user);

			expect(mockClient.refresh).toHaveBeenCalledWith(
				'old-refresh',
				expect.objectContaining({ DPoP: restoredKey.privateKey }),
			);
		});

		test('falls back gracefully when no DPoP key in auth_data', async () => {
			const { dpopKeyFromJwk } = await import('../utils/dpop.js');
			vi.mocked(dpopKeyFromJwk).mockReturnValueOnce(null);
			mockClient.refresh.mockResolvedValueOnce({ refresh_token: undefined });

			const driver = new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig());
			await driver['getClient']();

			const user: any = {
				id: 'user-1',
				auth_data: JSON.stringify({ refreshToken: 'old-refresh' }),
			};

			await driver.refresh(user);

			// refresh still called without DPoP option
			expect(mockClient.refresh).toHaveBeenCalledWith('old-refresh', undefined);
		});

		test('wraps invalid_grant OP error as InvalidTokenError', async () => {
			const { dpopKeyFromJwk } = await import('../utils/dpop.js');
			vi.mocked(dpopKeyFromJwk).mockReturnValueOnce(null);

			mockClient.refresh.mockRejectedValueOnce(new openidErrors.OPError({ error: 'invalid_grant' }));

			const driver = new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig());
			await driver['getClient']();

			const user: any = {
				id: 'user-1',
				auth_data: JSON.stringify({ refreshToken: 'bad-refresh' }),
			};

			await expect(driver.refresh(user)).rejects.toThrow(InvalidTokenError);
		});
	});

	describe('JWKS encryption env-gating', () => {
		test('does not set JWE metadata when no enc key is configured', async () => {
			const { loadJwks } = await import('../utils/load-jwks.js');

			vi.mocked(loadJwks).mockReturnValue({
				privateJwks: { keys: [{ kty: 'EC', kid: 'sig-1', use: 'sig', alg: 'ES256' }] },
				publicJwks: { keys: [{ kty: 'EC', kid: 'sig-1', use: 'sig', alg: 'ES256' }] },
				hasEncryptionKey: false,
			});

			const driver = new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig());
			await driver['getClient']();

			const lastCallMetadata = mockClientCtorSpy.mock.calls.at(-1)?.[0];
			expect(lastCallMetadata).toBeDefined();
			expect(lastCallMetadata).not.toHaveProperty('id_token_encrypted_response_alg');
			expect(lastCallMetadata).not.toHaveProperty('id_token_encrypted_response_enc');
			expect(lastCallMetadata).not.toHaveProperty('userinfo_encrypted_response_alg');
			expect(lastCallMetadata).not.toHaveProperty('userinfo_encrypted_response_enc');
		});

		test('sets JWE metadata when enc key is present and config provides alg', async () => {
			const { loadJwks } = await import('../utils/load-jwks.js');

			vi.mocked(loadJwks).mockReturnValue({
				privateJwks: {
					keys: [
						{ kty: 'EC', kid: 'sig-1', use: 'sig', alg: 'ES256' },
						{ kty: 'EC', kid: 'enc-1', use: 'enc', alg: 'ECDH-ES+A256KW' },
					],
				},
				publicJwks: {
					keys: [
						{ kty: 'EC', kid: 'sig-1', use: 'sig', alg: 'ES256' },
						{ kty: 'EC', kid: 'enc-1', use: 'enc', alg: 'ECDH-ES+A256KW' },
					],
				},
				hasEncryptionKey: true,
			});

			const config = createFAPIConfig({
				clientIdTokenEncryptedResponseAlg: 'ECDH-ES+A256KW',
				clientIdTokenEncryptedResponseEnc: 'A256GCM',
			});

			const driver = new FAPIAuthDriver({ knex: {} as any }, config);
			await driver['getClient']();

			const lastCallMetadata = mockClientCtorSpy.mock.calls.at(-1)?.[0];

			expect(lastCallMetadata).toMatchObject({
				id_token_encrypted_response_alg: 'ECDH-ES+A256KW',
				id_token_encrypted_response_enc: 'A256GCM',
			});
		});

		test('sets token_endpoint_auth_signing_alg to match id_token_signed_response_alg', async () => {
			const driver = new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig());
			await driver['getClient']();

			const lastCallMetadata = mockClientCtorSpy.mock.calls.at(-1)?.[0];

			expect(lastCallMetadata).toMatchObject({
				token_endpoint_auth_method: 'private_key_jwt',
				token_endpoint_auth_signing_alg: 'PS256',
				id_token_signed_response_alg: 'PS256',
			});
		});
	});

	describe('getUserID — nested identifier (dot-path)', () => {
		test('resolves a nested dot-path identifier into the user lookup', async () => {
			const { loadAndEvictHandshakeDpopKey } = await import('../utils/dpop.js');

			vi.mocked(loadAndEvictHandshakeDpopKey).mockResolvedValueOnce({
				privateKey: { type: 'private' } as any,
				publicKey: { type: 'public' } as any,
			});

			mockClient.callback.mockResolvedValueOnce({
				access_token: 'access',
				refresh_token: 'refresh',
				id_token: 'id',
				claims: () => ({ sub_attributes: { identity_number: 'S1234567A' } }),
			});

			mockClient.userinfo.mockResolvedValueOnce({});

			const whereRawSpy = vi.fn().mockReturnThis();

			const driver = new FAPIAuthDriver(
				{
					knex: {
						select: vi.fn().mockReturnThis(),
						from: vi.fn().mockReturnThis(),
						whereRaw: whereRawSpy,
						first: vi.fn().mockResolvedValue({ id: 'existing-user-id' }),
					} as any,
				},
				createFAPIConfig({ identifierKey: 'sub_attributes.identity_number' }),
			);

			vi.spyOn(driver as any, 'getUsersService').mockReturnValue({
				updateOne: vi.fn(),
			});

			await driver['getClient']();

			const userId = await driver.getUserID({
				code: 'c',
				codeVerifier: 'test-code-verifier',
				nonce: 'test-nonce',
				state: 'challenge-test-code-verifier',
				callbackUrl: 'http://x',
			});

			expect(userId).toBe('existing-user-id');
			expect(whereRawSpy).toHaveBeenCalledWith('LOWER(??) = ?', ['external_identifier', 's1234567a']);
		});
	});
});

describe('createFAPIAuthRouter — JWKS route', () => {
	function getRouteHandler(router: any, method: string, path: string) {
		for (const layer of router.stack) {
			if (layer.route?.path === path && layer.route?.methods?.[method]) {
				return layer.route.stack[layer.route.stack.length - 1].handle;
			}
		}

		return undefined;
	}

	function createMockRes() {
		const res: any = {
			statusCode: 200,
			status: vi.fn(function status(this: any, code: number) {
				this.statusCode = code;
				return this;
			}),
			json: vi.fn(function json(this: any) {
				return this;
			}),
			setHeader: vi.fn(),
		};

		return res;
	}

	test('returns 503 when getPublicJwks returns null', async () => {
		const { getAuthProvider } = await import('../../auth.js');
		vi.mocked(getAuthProvider).mockReturnValue({ getPublicJwks: () => null } as any);

		const { createFAPIAuthRouter } = await import('./fapi.js');
		const router = createFAPIAuthRouter('test');
		const handler = getRouteHandler(router, 'get', '/jwks.json');

		const res = createMockRes();
		await handler({} as any, res);

		expect(res.status).toHaveBeenCalledWith(503);

		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ error: expect.stringContaining('JWKS not available') }),
		);
	});

	test('returns 503 when publicJwks.keys is empty', async () => {
		const { getAuthProvider } = await import('../../auth.js');
		vi.mocked(getAuthProvider).mockReturnValue({ getPublicJwks: () => ({ keys: [] }) } as any);

		const { createFAPIAuthRouter } = await import('./fapi.js');
		const router = createFAPIAuthRouter('test');
		const handler = getRouteHandler(router, 'get', '/jwks.json');

		const res = createMockRes();
		await handler({} as any, res);

		expect(res.status).toHaveBeenCalledWith(503);
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('no keys') }));
	});

	test('returns the public JWKS when configured', async () => {
		const publicJwks = {
			keys: [{ kty: 'EC', kid: 'sig-1', use: 'sig', alg: 'ES256', x: 'X', y: 'Y' }],
		};

		const { getAuthProvider } = await import('../../auth.js');
		vi.mocked(getAuthProvider).mockReturnValue({ getPublicJwks: () => publicJwks } as any);

		const { createFAPIAuthRouter } = await import('./fapi.js');
		const router = createFAPIAuthRouter('test');
		const handler = getRouteHandler(router, 'get', '/jwks.json');

		const res = createMockRes();
		await handler({} as any, res);

		expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
		expect(res.json).toHaveBeenCalledWith(publicJwks);
	});
});

describe('loadJwks (unit)', () => {
	// These tests exercise load-jwks.ts directly without the FAPI driver
	beforeEach(() => {
		vi.resetModules();
	});

	test('strips private key members from the public JWKS view', async () => {
		vi.doUnmock('../utils/load-jwks.js');
		const { loadJwks } = await import('../utils/load-jwks.js');

		const privateKey = {
			kty: 'EC',
			crv: 'P-256',
			kid: 'sig-1',
			use: 'sig',
			alg: 'ES256',
			d: 'private-d',
			x: 'public-x',
			y: 'public-y',
		};

		const { publicJwks } = loadJwks([privateKey], 'test');

		expect(publicJwks.keys[0]).not.toHaveProperty('d');
		expect(publicJwks.keys[0]).toHaveProperty('x', 'public-x');
		expect(publicJwks.keys[0]).toHaveProperty('y', 'public-y');
	});

	test('throws InvalidProviderConfigError when keys array is empty', async () => {
		vi.doUnmock('../utils/load-jwks.js');
		const { loadJwks } = await import('../utils/load-jwks.js');

		expect(() => loadJwks([], 'test')).toThrow('Invalid config');
	});

	test('throws InvalidProviderConfigError when sig key uses disallowed alg (RS256)', async () => {
		vi.doUnmock('../utils/load-jwks.js');
		const { loadJwks } = await import('../utils/load-jwks.js');

		expect(() =>
			loadJwks([{ kty: 'RSA', kid: 'sig-1', use: 'sig', alg: 'RS256', n: 'n', e: 'AQAB', d: 'd' }], 'test'),
		).toThrow('Invalid config');
	});

	test('throws InvalidProviderConfigError when no sig key is present (only enc)', async () => {
		vi.doUnmock('../utils/load-jwks.js');
		const { loadJwks } = await import('../utils/load-jwks.js');

		expect(() =>
			loadJwks([{ kty: 'EC', crv: 'P-256', kid: 'enc-1', use: 'enc', alg: 'ECDH-ES+A256KW', d: 'd' }], 'test'),
		).toThrow('Invalid config');
	});

	test('detects enc key and sets hasEncryptionKey=true', async () => {
		vi.doUnmock('../utils/load-jwks.js');
		const { loadJwks } = await import('../utils/load-jwks.js');

		const { hasEncryptionKey } = loadJwks(
			[
				{ kty: 'EC', crv: 'P-256', kid: 'sig-1', use: 'sig', alg: 'ES256', d: 'd', x: 'x', y: 'y' },
				{ kty: 'EC', crv: 'P-256', kid: 'enc-1', use: 'enc', alg: 'ECDH-ES+A256KW', d: 'd', x: 'x', y: 'y' },
			],
			'test',
		);

		expect(hasEncryptionKey).toBe(true);
	});

	test('throws InvalidProviderConfigError when enc key has no alg', async () => {
		vi.doUnmock('../utils/load-jwks.js');
		const { loadJwks } = await import('../utils/load-jwks.js');

		expect(() =>
			loadJwks(
				[
					{ kty: 'EC', crv: 'P-256', kid: 'sig-1', use: 'sig', alg: 'ES256', d: 'd', x: 'x', y: 'y' },
					{ kty: 'EC', crv: 'P-256', kid: 'enc-1', use: 'enc', d: 'd', x: 'x', y: 'y' },
				],
				'test',
			),
		).toThrow('Invalid config');
	});

	test('throws InvalidProviderConfigError when enc key uses disallowed alg', async () => {
		vi.doUnmock('../utils/load-jwks.js');
		const { loadJwks } = await import('../utils/load-jwks.js');

		expect(() =>
			loadJwks(
				[
					{ kty: 'EC', crv: 'P-256', kid: 'sig-1', use: 'sig', alg: 'ES256', d: 'd', x: 'x', y: 'y' },
					{ kty: 'EC', crv: 'P-256', kid: 'enc-1', use: 'enc', alg: 'none', d: 'd', x: 'x', y: 'y' },
				],
				'test',
			),
		).toThrow('Invalid config');
	});
});
