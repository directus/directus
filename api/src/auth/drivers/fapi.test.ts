import { useEnv } from '@directus/env';
import {
	ErrorCode,
	InvalidCredentialsError,
	InvalidPayloadError,
	InvalidProviderConfigError,
	InvalidProviderError,
	InvalidTokenError,
	ServiceUnavailableError,
} from '@directus/errors';
import { errors as openidErrors } from 'openid-client';
import type { Logger } from 'pino';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getAuthProvider } from '../../auth.js';
import { useLogger } from '../../logger/index.js';
import { resolveLoginRedirect } from '../utils/resolve-login-redirect.js';
import { createFAPIAuthRouter, FAPIAuthDriver } from './fapi.js';

// ── Global mocks ────────────────────────────────────────────────────────────

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => ({
		EMAIL_TEMPLATES_PATH: './templates',
		PUBLIC_URL: 'http://localhost:8055',
		SESSION_COOKIE_NAME: 'directus_session_token',
		REFRESH_TOKEN_COOKIE_NAME: 'directus_refresh_token',
	})),
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

// Shared spies for the router-handler collaborators (hoisted so they can be referenced
// inside the vi.mock factories below).
const { mockLogin, mockVerifyJWT } = vi.hoisted(() => ({
	mockLogin: vi.fn(),
	mockVerifyJWT: vi.fn(),
}));

vi.mock('../../services/authentication.js', () => ({
	AuthenticationService: vi.fn(() => ({ login: mockLogin })),
}));

vi.mock('../../utils/jwt.js', () => ({
	verifyJWT: mockVerifyJWT,
}));

vi.mock('../utils/resolve-login-redirect.js', () => ({
	resolveLoginRedirect: vi.fn((redirect: unknown) => redirect ?? '/'),
}));

vi.mock('../../permissions/utils/create-default-accountability.js', () => ({
	createDefaultAccountability: vi.fn(() => ({})),
}));

vi.mock('../../utils/get-ip-from-req.js', () => ({
	getIPFromReq: vi.fn(() => '127.0.0.1'),
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

		test('constructs without eagerly creating the OIDC client', () => {
			const driver = new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig());
			expect(driver.client).toBeNull();
		});
	});

	describe('generateAuthUrl — PAR flow', () => {
		test('builds a minimal PAR authorize redirect with request_uri', async () => {
			const driver = new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig());

			await driver['getClient']();

			const url = await driver.generateAuthUrl(
				'test-code-verifier',
				'test-nonce',
				false,
				'http://localhost:8055/callback',
			);

			// PAR was called with PKCE params and a DPoP proof
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
		});

		test('generates and stashes a handshake DPoP key', async () => {
			const { generateDpopKeypair, storeHandshakeDpopKey } = await import('../utils/dpop.js');
			const driver = new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig());

			await driver['getClient']();

			await driver.generateAuthUrl('test-code-verifier', 'test-nonce', false, 'http://localhost:8055/callback');

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

	test('accepts a pre-parsed JWKS-shaped object', async () => {
		vi.doUnmock('../utils/load-jwks.js');
		const { loadJwks } = await import('../utils/load-jwks.js');

		const { privateJwks, publicJwks } = loadJwks(
			{ keys: [{ kty: 'EC', crv: 'P-256', kid: 'sig-1', use: 'sig', alg: 'ES256', d: 'd', x: 'x', y: 'y' }] },
			'test',
		);

		expect(privateJwks.keys).toHaveLength(1);
		expect(publicJwks.keys[0]).not.toHaveProperty('d');
	});

	test('throws InvalidProviderConfigError on duplicate kid', async () => {
		vi.doUnmock('../utils/load-jwks.js');
		const { loadJwks } = await import('../utils/load-jwks.js');

		expect(() =>
			loadJwks(
				[
					{ kty: 'EC', crv: 'P-256', kid: 'dupe', use: 'sig', alg: 'ES256', d: 'd', x: 'x', y: 'y' },
					{ kty: 'EC', crv: 'P-256', kid: 'dupe', use: 'sig', alg: 'ES256', d: 'd', x: 'x', y: 'y' },
				],
				'test',
			),
		).toThrow('Invalid config');
	});

	test('throws InvalidProviderConfigError when use is neither sig nor enc', async () => {
		vi.doUnmock('../utils/load-jwks.js');
		const { loadJwks } = await import('../utils/load-jwks.js');

		expect(() =>
			loadJwks([{ kty: 'EC', crv: 'P-256', kid: 'k1', use: 'tls', alg: 'ES256', d: 'd', x: 'x', y: 'y' }], 'test'),
		).toThrow('Invalid config');
	});

	test('throws InvalidProviderConfigError when rawKeys is neither string nor object', async () => {
		vi.doUnmock('../utils/load-jwks.js');
		const { loadJwks } = await import('../utils/load-jwks.js');

		expect(() => loadJwks(42 as unknown, 'test')).toThrow('Invalid config');
	});

	test('throws InvalidProviderConfigError on malformed JSON string', async () => {
		vi.doUnmock('../utils/load-jwks.js');
		const { loadJwks } = await import('../utils/load-jwks.js');

		expect(() => loadJwks('{ not valid json', 'test')).toThrow('Invalid config');
	});
});

// ── Router login + callback handlers ──────────────────────────────────────────

const makeEnv = (overrides: Record<string, unknown> = {}) => ({
	EMAIL_TEMPLATES_PATH: './templates',
	PUBLIC_URL: 'http://localhost:8055',
	SESSION_COOKIE_NAME: 'directus_session_token',
	REFRESH_TOKEN_COOKIE_NAME: 'directus_refresh_token',
	...overrides,
});

describe('createFAPIAuthRouter — login + callback handlers', () => {
	function getRouteHandlers(router: any, method: string, path: string): any[] {
		for (const layer of router.stack) {
			if (layer.route?.path === path && layer.route?.methods?.[method]) {
				return layer.route.stack.map((l: any) => l.handle);
			}
		}

		return [];
	}

	function createMockRes() {
		const res: any = {
			statusCode: 200,
			locals: {},
			status: vi.fn(function status(this: any, code: number) {
				this.statusCode = code;
				return this;
			}),
			json: vi.fn(function json(this: any) {
				return this;
			}),
			redirect: vi.fn(),
			cookie: vi.fn(),
			clearCookie: vi.fn(),
			setHeader: vi.fn(),
		};

		return res;
	}

	function createMockReq(overrides: Record<string, any> = {}) {
		const { cookies = {}, query = {}, body = {}, headers = {}, schema = {} } = overrides;

		return {
			cookies,
			query,
			body,
			schema,
			protocol: 'http',
			get: (name: string) => headers[name.toLowerCase()],
		} as any;
	}

	const mockProvider = {
		generateCodeVerifier: vi.fn(() => 'test-code-verifier'),
		generateNonce: vi.fn(() => 'test-nonce'),
		generateAuthUrl: vi.fn(),
		getPublicJwks: vi.fn(),
	};

	beforeEach(() => {
		mockLogin.mockReset();
		mockVerifyJWT.mockReset();
		vi.mocked(useEnv).mockReturnValue(makeEnv());
		vi.mocked(getAuthProvider).mockReturnValue(mockProvider as any);
		vi.mocked(resolveLoginRedirect).mockImplementation((redirect: unknown) => (redirect ?? '/') as string);
		mockProvider.generateAuthUrl.mockResolvedValue('https://idp.example.com/authorize?client_id=x&request_uri=urn:y');
	});

	describe('GET / (login init)', () => {
		test('sets the login cookie and redirects to the PAR authorize URL', async () => {
			const router = createFAPIAuthRouter('test');
			const [handler] = getRouteHandlers(router, 'get', '/');

			const req = createMockReq({
				query: { redirect: 'http://localhost:8055/landing' },
				headers: { host: 'localhost:8055' },
			});

			const res = createMockRes();
			await handler(req, res);

			expect(res.cookie).toHaveBeenCalledWith(
				'fapi.test',
				expect.any(String),
				expect.objectContaining({ httpOnly: true }),
			);

			expect(res.redirect).toHaveBeenCalledWith('https://idp.example.com/authorize?client_id=x&request_uri=urn:y');
		});

		test('redirects to admin login with SERVICE_UNAVAILABLE when generateAuthUrl throws', async () => {
			mockProvider.generateAuthUrl.mockRejectedValueOnce(new Error('PAR down'));

			const router = createFAPIAuthRouter('test');
			const [handler] = getRouteHandlers(router, 'get', '/');

			const res = createMockRes();
			await handler(createMockReq({ headers: { host: 'localhost:8055' } }), res);

			expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/admin/login'));
			expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining(`reason=${ErrorCode.ServiceUnavailable}`));
		});

		test('throws InvalidPayloadError when the redirect is not allowed', async () => {
			vi.mocked(resolveLoginRedirect).mockImplementationOnce(() => {
				throw new Error('not allowed');
			});

			const router = createFAPIAuthRouter('test');
			const [handler] = getRouteHandlers(router, 'get', '/');

			const req = createMockReq({ query: { redirect: 'http://evil.test' }, headers: { host: 'localhost:8055' } });

			await expect(handler(req, createMockRes())).rejects.toThrow(InvalidPayloadError);
		});
	});

	describe('POST /callback', () => {
		test('303-redirects the posted form body to the GET callback', () => {
			const router = createFAPIAuthRouter('test');
			const handlers = getRouteHandlers(router, 'post', '/callback');
			// [express.urlencoded, handler, respond] — grab the handler itself
			const handler = handlers[handlers.length - 2];

			const res = createMockRes();
			handler(createMockReq({ body: { code: 'abc', state: 'xyz' } }), res);

			expect(res.redirect).toHaveBeenCalledWith(303, expect.stringContaining('./callback?'));
			expect(res.redirect).toHaveBeenCalledWith(303, expect.stringContaining('code=abc'));
		});
	});

	describe('GET /callback', () => {
		const cookieData = {
			verifier: 'test-code-verifier',
			nonce: 'test-nonce',
			prompt: false,
			otp: undefined,
			callbackUrl: 'http://localhost:8055/auth/login/test/callback',
			redirect: 'http://localhost:8055/landing',
		};

		function callbackReq(overrides: Record<string, any> = {}) {
			return createMockReq({
				cookies: { 'fapi.test': 'signed-cookie' },
				query: { code: 'auth-code', state: 'state-val', iss: 'https://idp.example.com' },
				headers: { host: 'localhost:8055', 'user-agent': 'vitest', origin: 'http://localhost:8055' },
				...overrides,
			});
		}

		test('redirects to admin login when the cookie cannot be verified', async () => {
			mockVerifyJWT.mockImplementationOnce(() => {
				throw new Error('bad cookie');
			});

			const router = createFAPIAuthRouter('test');
			const [handler] = getRouteHandlers(router, 'get', '/callback');

			const res = createMockRes();
			await handler(callbackReq(), res, vi.fn());

			expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining(`reason=${ErrorCode.InvalidCredentials}`));
		});

		test('session mode with redirect sets the session cookie and redirects', async () => {
			mockVerifyJWT.mockReturnValueOnce(cookieData).mockReturnValueOnce({});
			mockLogin.mockResolvedValueOnce({ accessToken: 'AT', refreshToken: 'RT', expires: 900 });

			const router = createFAPIAuthRouter('test');
			const [handler] = getRouteHandlers(router, 'get', '/callback');

			const res = createMockRes();
			await handler(callbackReq(), res, vi.fn());

			expect(res.clearCookie).toHaveBeenCalledWith('fapi.test');
			expect(res.cookie).toHaveBeenCalledWith('directus_session_token', 'AT', expect.anything());
			expect(res.redirect).toHaveBeenCalledWith('http://localhost:8055/landing');
		});

		test('no redirect (token mode) sets res.locals payload and calls next', async () => {
			mockVerifyJWT.mockReturnValueOnce({ ...cookieData, redirect: undefined }).mockReturnValueOnce({});
			mockLogin.mockResolvedValueOnce({ accessToken: 'AT', refreshToken: 'RT', expires: 900 });

			const router = createFAPIAuthRouter('test');
			const [handler] = getRouteHandlers(router, 'get', '/callback');

			const res = createMockRes();
			const next = vi.fn();
			await handler(callbackReq(), res, next);

			expect(res.locals.payload).toEqual({ data: { access_token: 'AT', refresh_token: 'RT', expires: 900 } });
			expect(next).toHaveBeenCalled();
		});

		test('refresh mode sets the refresh-token cookie', async () => {
			vi.mocked(useEnv).mockReturnValue(makeEnv({ AUTH_TEST_MODE: 'json' }));
			mockVerifyJWT.mockReturnValueOnce(cookieData).mockReturnValueOnce({});
			mockLogin.mockResolvedValueOnce({ accessToken: 'AT', refreshToken: 'RT', expires: 900 });

			const router = createFAPIAuthRouter('test');
			const [handler] = getRouteHandlers(router, 'get', '/callback');

			const res = createMockRes();
			await handler(callbackReq(), res, vi.fn());

			expect(res.cookie).toHaveBeenCalledWith('directus_refresh_token', 'RT', expect.anything());
		});

		test('InvalidToken without prompt re-initiates login with prompt=true', async () => {
			mockVerifyJWT.mockReturnValueOnce(cookieData);
			mockLogin.mockRejectedValueOnce(new InvalidTokenError());

			const router = createFAPIAuthRouter('test');
			const [handler] = getRouteHandlers(router, 'get', '/callback');

			const res = createMockRes();
			await handler(callbackReq(), res, vi.fn());

			expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('prompt=true'));
		});

		test('generic login error redirects to the redirect URL with the error reason', async () => {
			mockVerifyJWT.mockReturnValueOnce(cookieData);
			mockLogin.mockRejectedValueOnce(new InvalidCredentialsError());

			const router = createFAPIAuthRouter('test');
			const [handler] = getRouteHandlers(router, 'get', '/callback');

			const res = createMockRes();
			await handler(callbackReq(), res, vi.fn());

			expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining(`reason=${ErrorCode.InvalidCredentials}`));
		});

		test('enforce_tfa access token redirects to the TFA setup page', async () => {
			mockVerifyJWT.mockReturnValueOnce(cookieData).mockReturnValueOnce({ enforce_tfa: true });
			mockLogin.mockResolvedValueOnce({ accessToken: 'AT', refreshToken: 'RT', expires: 900 });

			const router = createFAPIAuthRouter('test');
			const [handler] = getRouteHandlers(router, 'get', '/callback');

			const res = createMockRes();
			await handler(callbackReq(), res, vi.fn());

			expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('admin/tfa-setup'));
		});
	});
});

describe('handleFapiError (via refresh)', () => {
	const userWith = (authData: Record<string, unknown>) =>
		({ id: 'user-1', auth_data: JSON.stringify(authData) }) as any;

	test('maps a non-invalid_grant OP error to ServiceUnavailableError', async () => {
		const { dpopKeyFromJwk } = await import('../utils/dpop.js');
		vi.mocked(dpopKeyFromJwk).mockReturnValueOnce(null);

		mockClient.refresh.mockRejectedValueOnce(
			new openidErrors.OPError({ error: 'server_error', error_description: 'boom' }),
		);

		const driver = new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig());
		await driver['getClient']();

		await expect(driver.refresh(userWith({ refreshToken: 'rt' }))).rejects.toThrow(ServiceUnavailableError);
	});

	test('maps an RP error to ServiceUnavailableError', async () => {
		const { dpopKeyFromJwk } = await import('../utils/dpop.js');
		vi.mocked(dpopKeyFromJwk).mockReturnValueOnce(null);

		mockClient.refresh.mockRejectedValueOnce(new openidErrors.RPError('id_token validation failed'));

		const driver = new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig());
		await driver['getClient']();

		await expect(driver.refresh(userWith({ refreshToken: 'rt' }))).rejects.toThrow(ServiceUnavailableError);
	});

	test('rethrows an unknown error unchanged', async () => {
		const { dpopKeyFromJwk } = await import('../utils/dpop.js');
		vi.mocked(dpopKeyFromJwk).mockReturnValueOnce(null);

		const boom = new Error('totally unexpected');
		mockClient.refresh.mockRejectedValueOnce(boom);

		const driver = new FAPIAuthDriver({ knex: {} as any }, createFAPIConfig());
		await driver['getClient']();

		await expect(driver.refresh(userWith({ refreshToken: 'rt' }))).rejects.toThrow(boom);
	});
});

describe('getUserID — registration branches', () => {
	const tokenSet = {
		access_token: 'AT',
		refresh_token: 'RT',
		id_token: 'IT',
		claims: () => ({ sub: 'new-sub', email: 'new@example.com', email_verified: true }),
	};

	const validPayload = {
		code: 'c',
		codeVerifier: 'test-code-verifier',
		nonce: 'test-nonce',
		state: 'challenge-test-code-verifier',
		callbackUrl: 'http://x',
	};

	function driverWithFirstResults(firstResults: unknown[], config: Record<string, any> = {}) {
		const first = vi.fn();
		firstResults.forEach((r) => first.mockResolvedValueOnce(r));

		return new FAPIAuthDriver(
			{
				knex: {
					select: vi.fn().mockReturnThis(),
					from: vi.fn().mockReturnThis(),
					whereRaw: vi.fn().mockReturnThis(),
					first,
				} as any,
			},
			createFAPIConfig(config),
		);
	}

	beforeEach(async () => {
		const { loadAndEvictHandshakeDpopKey } = await import('../utils/dpop.js');

		vi.mocked(loadAndEvictHandshakeDpopKey).mockResolvedValue({
			privateKey: { type: 'private' } as any,
			publicKey: { type: 'public' } as any,
		});

		mockClient.callback.mockResolvedValue(tokenSet);
		mockClient.userinfo.mockResolvedValue({});
	});

	test('registers a new user when public registration is allowed', async () => {
		const createOne = vi.fn();
		const driver = driverWithFirstResults([undefined, { id: 'new-user-id' }], { allowPublicRegistration: true });
		vi.spyOn(driver as any, 'getUsersService').mockReturnValue({ createOne, updateOne: vi.fn() });
		await driver['getClient']();

		const userId = await driver.getUserID(validPayload);

		expect(createOne).toHaveBeenCalled();
		expect(userId).toBe('new-user-id');
	});

	test('throws InvalidCredentialsError when public registration is disabled', async () => {
		const driver = driverWithFirstResults([undefined], { allowPublicRegistration: false });
		vi.spyOn(driver as any, 'getUsersService').mockReturnValue({ createOne: vi.fn(), updateOne: vi.fn() });
		await driver['getClient']();

		await expect(driver.getUserID(validPayload)).rejects.toThrow(InvalidCredentialsError);
	});

	test('throws InvalidCredentialsError when a verified email is required but missing', async () => {
		mockClient.callback.mockResolvedValueOnce({
			...tokenSet,
			claims: () => ({ sub: 'new-sub', email: 'new@example.com', email_verified: false }),
		});

		const driver = driverWithFirstResults([undefined], { allowPublicRegistration: true, requireVerifiedEmail: true });
		vi.spyOn(driver as any, 'getUsersService').mockReturnValue({ createOne: vi.fn(), updateOne: vi.fn() });
		await driver['getClient']();

		await expect(driver.getUserID(validPayload)).rejects.toThrow(InvalidCredentialsError);
	});

	test('maps a RecordNotUnique create failure to InvalidProviderError', async () => {
		const dup = Object.assign(new Error('duplicate'), { name: 'DirectusError', code: 'RECORD_NOT_UNIQUE' });
		const createOne = vi.fn().mockRejectedValueOnce(dup);
		const driver = driverWithFirstResults([undefined], { allowPublicRegistration: true });
		vi.spyOn(driver as any, 'getUsersService').mockReturnValue({ createOne, updateOne: vi.fn() });
		await driver['getClient']();

		await expect(driver.getUserID(validPayload)).rejects.toThrow(InvalidProviderError);
	});
});
