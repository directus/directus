import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => ({
		EMAIL_TEMPLATES_PATH: './templates',
	})),
}));

vi.mock('../../logger');
vi.mock('../../database');

vi.mock('../../emitter', () => ({
	default: {
		emitFilter: vi.fn().mockImplementation((_event, payload) => Promise.resolve(payload)),
	},
}));

vi.mock('../../app', () => ({
	default: {},
}));

vi.mock('../../middleware/respond', () => ({
	respond: vi.fn(),
}));

vi.mock('../../utils/get-schema', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../../utils/async-handler', () => ({
	default: (fn: any) => fn,
}));

vi.mock('openid-client', () => {
	const mockClient = {
		authorizationUrl: vi.fn((params) => `https://test.com/authorize?${JSON.stringify(params)}`),
		callbackParams: vi.fn(),
		callback: vi.fn(),
		userinfo: vi.fn(),
		refresh: vi.fn(),
		issuer: {
			metadata: {
				userinfo_endpoint: 'https://test.com/userinfo',
			},
		},
	};

	return {
		Issuer: class MockIssuer {
			static Client: any;
			static discover = vi.fn().mockResolvedValue({
				metadata: {
					response_types_supported: ['code'],
				},
				Client: class {
					constructor() {
						return mockClient;
					}
				},
			});

			constructor() {}
			Client = class {
				constructor() {
					return mockClient;
				}
			};
		},
		custom: {
			http_options: Symbol('http_options'),
		},
		generators: {
			codeVerifier: () => 'test-code-verifier',
			codeChallenge: (verifier: string) => `challenge-${verifier}`,
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
	};
});

import { useEnv } from '@directus/env';
import { useLogger } from '../../logger/index.js';
import * as oauthCallbacks from '../../utils/oauth-callbacks.js';
import { OpenIDAuthDriver } from './openid.js';
import type { Logger } from 'pino';
import {
	InvalidProviderConfigError,
	InvalidProviderError,
	InvalidCredentialsError,
	InvalidTokenError,
	ServiceUnavailableError,
	ErrorCode,
} from '@directus/errors';
import { errors as openidErrors } from 'openid-client';

let mockLogger: Logger;

beforeEach(() => {
	mockLogger = {
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	} as unknown as Logger;

	vi.mocked(useLogger).mockReturnValue(mockLogger);
});

afterEach(() => {
	vi.clearAllMocks();
});

const provider = 'okta';

const createOpenIDConfig = (overrides: Record<string, any> = {}) => ({
	provider,
	issuerUrl: `https://${provider}.com`,
	clientId: 'test-client-id',
	clientSecret: 'test-client-secret',
	issuerDiscoveryMustSucceed: false,
	...overrides,
});

describe('OpenIDAuthDriver', () => {
	describe('Constructor', () => {
		describe('Validation', () => {
			test.each([
				{ field: 'issuerUrl', config: { provider, clientId: 'id', clientSecret: 'secret' } },
				{ field: 'clientId', config: { provider, issuerUrl: 'url', clientSecret: 'secret' } },
				{ field: 'clientSecret', config: { provider, issuerUrl: 'url', clientId: 'id' } },
				{ field: 'provider', config: { issuerUrl: 'url', clientId: 'id', clientSecret: 'secret' } },
			])('throws InvalidProviderConfigError when $field is missing', ({ config }) => {
				expect(() => new OpenIDAuthDriver({ knex: {} as any }, config as any)).toThrow(InvalidProviderConfigError);
				expect(mockLogger.error).toHaveBeenCalledWith('Invalid provider config');
			});

			test('throws InvalidProviderError when roleMapping is an Array instead of Object', () => {
				const config = createOpenIDConfig({
					roleMapping: ['role1', 'role2'],
				});

				expect(() => new OpenIDAuthDriver({ knex: {} as any }, config)).toThrow(InvalidProviderError);

				expect(mockLogger.error).toHaveBeenCalledWith(
					expect.stringContaining('[OpenID] Expected a JSON-Object as role mapping'),
				);
			});

			test('creates driver successfully with all required config', () => {
				const config = createOpenIDConfig();
				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

				expect(driver).toBeDefined();
				expect(driver.client).toBeNull();
			});
		});

		describe('Configuration', () => {
			test('generates redirectUris using generateRedirectUrls utility', () => {
				const spy = vi.spyOn(oauthCallbacks, 'generateRedirectUrls');

				vi.mocked(useEnv).mockReturnValue({
					[`AUTH_${provider.toUpperCase()}_REDIRECT_ALLOW_LIST`]: 'http://external.com,http://internal.com',
				});

				const config = createOpenIDConfig();
				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

				expect(spy).toHaveBeenCalledWith(provider, 'OpenID');
				expect(driver.redirectUris).toHaveLength(2);
				expect(driver.redirectUris[0]?.toString()).toBe(`http://external.com/auth/login/${provider}/callback`);
				expect(driver.redirectUris[1]?.toString()).toBe(`http://internal.com/auth/login/${provider}/callback`);

				spy.mockRestore();
			});

			test('sets empty redirectUris when no REDIRECT_ALLOW_LIST', () => {
				vi.mocked(useEnv).mockReturnValue({});

				const config = createOpenIDConfig();
				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

				expect(driver.redirectUris).toEqual([]);
			});
		});

		describe('Client preload', () => {
			test('initializes with client=null and preloads client asynchronously', () => {
				const config = createOpenIDConfig();
				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

				expect(driver.client).toBeNull();
			});

			test('logs error when client preload fails', async () => {
				const getClientSpy = vi
					.spyOn(OpenIDAuthDriver.prototype as any, 'getClient')
					.mockRejectedValue(new Error('Discovery failed'));

				const config = createOpenIDConfig();

				new OpenIDAuthDriver({ knex: {} as any }, config);

				// Flush microtasks for .catch()
				await Promise.resolve();

				expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), '[OpenID] Failed to fetch provider config');

				getClientSpy.mockRestore();
			});

			test('does not call process.exit when issuerDiscoveryMustSucceed is false', async () => {
				const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

				const getClientSpy = vi.spyOn(OpenIDAuthDriver.prototype as any, 'getClient').mockRejectedValue(new Error());

				const config = createOpenIDConfig();

				new OpenIDAuthDriver({ knex: {} as any }, config);

				// Flush microtasks for .catch()
				await Promise.resolve();

				expect(processExitSpy).not.toHaveBeenCalled();

				processExitSpy.mockRestore();
				getClientSpy.mockRestore();
			});

			test('calls process.exit(1) when issuerDiscoveryMustSucceed is not false and discovery fails', async () => {
				const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

				const getClientSpy = vi.spyOn(OpenIDAuthDriver.prototype as any, 'getClient').mockRejectedValue(new Error());

				const config = createOpenIDConfig({
					issuerDiscoveryMustSucceed: true,
				});

				new OpenIDAuthDriver({ knex: {} as any }, config);

				// Flush microtasks .catch()
				await Promise.resolve();

				expect(mockLogger.error).toHaveBeenCalledWith(
					expect.stringContaining(
						`AUTH_${provider.toUpperCase()}_ISSUER_DISCOVERY_MUST_SUCCEED is enabled and discovery failed, exiting`,
					),
				);

				expect(processExitSpy).toHaveBeenCalledWith(1);

				processExitSpy.mockRestore();
				getClientSpy.mockRestore();
			});
		});
	});

	describe('generateCodeVerifier', () => {
		test('returns a code verifier string', () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			const verifier = driver.generateCodeVerifier();

			expect(verifier).toBe('test-code-verifier');
		});
	});

	describe('generateAuthUrl', () => {
		test('generates authorization URL with default parameters', async () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			await driver['getClient']();

			const codeVerifier = driver.generateCodeVerifier();
			const authUrl = await driver.generateAuthUrl(codeVerifier, false);

			expect(authUrl).toBeDefined();
			expect(authUrl).toContain('https://test.com/authorize');
		});

		test('includes prompt parameter when prompt=true', async () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			await driver['getClient']();

			const codeVerifier = driver.generateCodeVerifier();
			const authUrl = await driver.generateAuthUrl(codeVerifier, true);

			expect(authUrl).toBeDefined();
			expect(authUrl).toContain('prompt');
		});

		test('uses custom redirectUri when provided', async () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			await driver['getClient']();

			const codeVerifier = driver.generateCodeVerifier();
			const customRedirectUri = `http://external.com/auth/login/${provider}/callback`;
			const authUrl = await driver.generateAuthUrl(codeVerifier, false, customRedirectUri);

			expect(authUrl).toBeDefined();
			expect(authUrl).toContain(customRedirectUri);
		});
	});

	describe('getUserID', () => {
		describe('Validation', () => {
			test.each([
				{ field: 'code', payload: { codeVerifier: 'test-verifier', state: 'test-state' } },
				{ field: 'codeVerifier', payload: { code: 'test-code', state: 'test-state' } },
				{ field: 'state', payload: { code: 'test-code', codeVerifier: 'test-verifier' } },
			])(`throws InvalidCredentialsError when $field is missing`, async ({ payload }) => {
				const config = createOpenIDConfig();
				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

				await expect(driver.getUserID(payload)).rejects.toThrow(InvalidCredentialsError);
				expect(mockLogger.warn).toHaveBeenCalledWith('[OpenID] No code, codeVerifier or state in payload');
			});
		});

		describe('PKCE', () => {
			test('calls codeChallenge and passes hashed state to callback (S256 mode)', async () => {
				const driver = new OpenIDAuthDriver({ knex: {} as any }, createOpenIDConfig());
				await driver['getClient']();

				const mockTokenSet = {
					claims: () => ({ sub: '123', email: 'test@test.com' }),
				};

				const callbackSpy = vi.spyOn(driver.client!, 'callback').mockResolvedValue(mockTokenSet as any);
				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue('user-id');

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				const callbackArgs = callbackSpy.mock.calls[0];

				expect(callbackArgs?.[2]).toEqual({
					code_verifier: 'test-verifier',
					state: 'challenge-test-verifier',
					nonce: 'challenge-test-verifier',
				});
			});

			test('does not call codeChallenge and passes codeVerifier as state (plain mode)', async () => {
				const config = createOpenIDConfig({
					plainCodeChallenge: true,
				});

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				const callbackSpy = vi.spyOn(driver.client!, 'callback').mockResolvedValue({
					claims: vi.fn(),
				} as any);

				vi.spyOn(driver.client!, 'userinfo').mockResolvedValue({ sub: '123', email: 'test@test.com' } as any);
				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue('user-id');

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				const callbackArgs = callbackSpy.mock.calls[0];

				expect(callbackArgs?.[2]).toEqual({
					code_verifier: 'test-verifier',
					state: 'test-verifier',
					nonce: 'test-verifier',
				});
			});

			test('merges claims from tokenSet and userinfo endpoint', async () => {
				const config = createOpenIDConfig();

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				const mockTokenSet = {
					access_token: 'test-access-token',
					claims: vi.fn(),
				};

				vi.spyOn(driver.client!, 'callback').mockResolvedValue(mockTokenSet as any);

				const userinfoSpy = vi.spyOn(driver.client!, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
				} as any);

				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue('user-id');
				vi.spyOn(driver as any, 'getUsersService').mockReturnValue({ updateOne: vi.fn() });

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				expect(userinfoSpy).toHaveBeenCalledWith(mockTokenSet.access_token);
			});
		});

		describe('Group mapping', () => {
			test('uses defaultRoleId when no groups in userInfo', async () => {
				const config = createOpenIDConfig({
					defaultRoleId: 'default-role-123',
					allowPublicRegistration: true,
				});

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				vi.spyOn(driver.client!, 'callback').mockResolvedValue({
					claims: () => vi.fn(),
				} as any);

				vi.spyOn(driver.client!, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
				} as any);

				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue(undefined);

				const createOneSpy = vi.fn().mockResolvedValue('new-user-id');
				vi.spyOn(driver as any, 'getUsersService').mockReturnValue({ createOne: createOneSpy });

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				expect(createOneSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						role: 'default-role-123',
					}),
				);
			});

			test('maps group to role when user is in roleMap group', async () => {
				const config = createOpenIDConfig({
					allowPublicRegistration: true,
					roleMapping: {
						'github-org-admins': 'admin-role-id',
						'github-org-editors': 'editor-role-id',
					},
				});

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				vi.spyOn(driver.client!, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
					groups: ['github-org-admins', 'other-group'],
				} as any);

				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue(undefined);

				const createOneSpy = vi.fn().mockResolvedValue('new-user-id');
				vi.spyOn(driver as any, 'getUsersService').mockReturnValue({ createOne: createOneSpy });

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				expect(createOneSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						role: 'admin-role-id',
					}),
				);
			});

			test('uses custom groupClaimName to read groups from userInfo', async () => {
				const config = createOpenIDConfig({
					allowPublicRegistration: true,
					groupClaimName: 'custom_groups',
					roleMapping: {
						'admin-group': 'admin-role-id',
					},
				});

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				vi.spyOn(driver.client!, 'callback').mockResolvedValue({
					claims: () => vi.fn(),
				} as any);

				vi.spyOn(driver.client!, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
					custom_groups: ['admin-group'],
				} as any);

				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue(undefined);

				const createOneSpy = vi.fn().mockResolvedValue('new-user-id');
				vi.spyOn(driver as any, 'getUsersService').mockReturnValue({ createOne: createOneSpy });

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				expect(createOneSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						role: 'admin-role-id',
					}),
				);
			});

			test('logs debug when groupClaim is empty but roleMap is configured', async () => {
				const config = createOpenIDConfig({
					roleMapping: {
						'admin-group': 'admin-role-id',
					},
				});

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				vi.spyOn(driver.client!, 'callback').mockResolvedValue({
					claims: () => vi.fn(),
				} as any);

				vi.spyOn(driver.client!, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
				} as any);

				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue('existing-user-id');

				vi.spyOn(driver as any, 'getUsersService').mockReturnValue({
					updateOne: vi.fn(),
				});

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				expect(mockLogger.debug).toHaveBeenCalledWith(
					'[OpenID] Configured group claim with name "groups" does not exist or is empty.',
				);
			});
		});

		describe('Identifier extraction', () => {
			test('extracts identifier from custom identifierKey', async () => {
				const config = createOpenIDConfig({
					identifierKey: 'user_id',
				});

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				vi.spyOn(driver.client!, 'userinfo').mockResolvedValue({
					user_id: 'user_id_test',
					email: 'test@test.com',
				} as any);

				const fetchUserIdSpy = vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue('existing-user');

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				expect(fetchUserIdSpy).toHaveBeenCalledWith('user_id_test');
			});

			test('throws InvalidCredentialsError when no identifier found', async () => {
				const config = createOpenIDConfig({
					identifierKey: 'sub',
				});

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				vi.spyOn(driver.client!, 'callback').mockResolvedValue({
					claims: vi.fn(),
				} as any);

				vi.spyOn(driver.client!, 'userinfo').mockResolvedValue({} as any);

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await expect(driver.getUserID(payload)).rejects.toThrow(InvalidCredentialsError);
				expect(mockLogger.warn).toHaveBeenCalledWith(
					`[OpenID] Failed to find user identifier for provider "${provider}"`,
				);
			});
		});

		describe('UserPayload construction', () => {
			test('extracts first_name and last_name from userInfo', async () => {
				const config = createOpenIDConfig({
					allowPublicRegistration: true,
					firstNameKey: 'given_name',
					lastNameKey: 'family_name',
				});

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				const mockTokenSet = {
					access_token: 'test-access-token',
					claims: vi.fn(),
				};

				vi.spyOn(driver.client!, 'callback').mockResolvedValue(mockTokenSet as any);

				vi.spyOn(driver.client!, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
					given_name: 'John',
					family_name: 'Doe',
				} as any);

				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue(undefined);

				const createOneSpy = vi.fn();
				vi.spyOn(driver as any, 'getUsersService').mockReturnValue({ createOne: createOneSpy });

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				expect(createOneSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						first_name: 'John',
						last_name: 'Doe',
					}),
				);
			});

			test('includes auth_data with refresh_token when present', async () => {
				const config = createOpenIDConfig({
					defaultRoleId: 'role-id',
					allowPublicRegistration: true,
				});

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				const mockTokenSet = {
					access_token: 'test-access-token',
					refresh_token: 'refresh-token-123',
					claims: vi.fn(),
				};

				vi.spyOn(driver.client!, 'callback').mockResolvedValue(mockTokenSet as any);

				vi.spyOn(driver.client!, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
				} as any);

				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue(undefined);

				const createOneSpy = vi.fn();
				vi.spyOn(driver as any, 'getUsersService').mockReturnValue({ createOne: createOneSpy });

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				expect(createOneSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						auth_data: JSON.stringify({ refreshToken: 'refresh-token-123' }),
					}),
				);
			});

			test('does not include auth_data when no refresh_token', async () => {
				const config = createOpenIDConfig({
					defaultRoleId: 'role-id',
					allowPublicRegistration: true,
				});

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				vi.spyOn(driver.client!, 'callback').mockResolvedValue({
					claims: vi.fn(),
				} as any);

				vi.spyOn(driver.client!, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
				} as any);

				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue(undefined);

				const createOneSpy = vi.fn();
				vi.spyOn(driver as any, 'getUsersService').mockReturnValue({ createOne: createOneSpy });

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				expect(createOneSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						auth_data: undefined,
					}),
				);
			});
		});

		describe('Update existing user', () => {
			test('includes role in update payload when roleMapping exists', async () => {
				const config = createOpenIDConfig({
					roleMapping: {
						'admin-group': 'admin-role-id',
					},
				});

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				vi.spyOn(driver.client!, 'callback').mockResolvedValue({
					claims: vi.fn(),
				} as any);

				vi.spyOn(driver.client!, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
					groups: ['admin-group'],
				} as any);

				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue('existing-user-id');

				const updateOneSpy = vi.fn();
				vi.spyOn(driver as any, 'getUsersService').mockReturnValue({ updateOne: updateOneSpy });

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				expect(updateOneSpy).toHaveBeenCalledWith(
					'existing-user-id',
					expect.objectContaining({
						role: 'admin-role-id',
					}),
				);
			});

			test('includes user info in update payload when syncUserInfo is true', async () => {
				const config = createOpenIDConfig({
					syncUserInfo: true,
				});

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				const mockTokenSet = {
					access_token: 'test-access-token',
					refresh_token: 'refresh-token',
					claims: vi.fn(),
				};

				vi.spyOn(driver.client!, 'callback').mockResolvedValue(mockTokenSet as any);

				vi.spyOn(driver.client!, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
					given_name: 'Jane',
					family_name: 'Smith',
				} as any);

				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue('existing-user-id');

				const updateOneSpy = vi.fn();
				vi.spyOn(driver as any, 'getUsersService').mockReturnValue({ updateOne: updateOneSpy });

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				expect(updateOneSpy).toHaveBeenCalledWith(
					'existing-user-id',
					expect.objectContaining({
						first_name: 'Jane',
						last_name: 'Smith',
					}),
				);
			});

			test('does not call updateOne when payload is empty', async () => {
				const config = createOpenIDConfig({
					defaultRoleId: 'role-id',
				});

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				vi.spyOn(driver.client!, 'callback').mockResolvedValue({
					claims: vi.fn(),
				} as any);

				vi.spyOn(driver.client!, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
				} as any);

				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue('existing-user-id');

				const updateOneSpy = vi.fn();
				vi.spyOn(driver as any, 'getUsersService').mockReturnValue({ updateOne: updateOneSpy });

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				const result = await driver.getUserID(payload);

				expect(updateOneSpy).not.toHaveBeenCalled();
				expect(result).toBe('existing-user-id');
			});
		});

		describe('Create new user', () => {
			test('throws InvalidCredentialsError when allowPublicRegistration is false and user not found', async () => {
				const config = createOpenIDConfig({
					allowPublicRegistration: false,
				});

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				vi.spyOn(driver.client!, 'callback').mockResolvedValue({
					claims: vi.fn(),
				} as any);

				vi.spyOn(driver.client!, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
				} as any);

				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue(undefined);

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await expect(driver.getUserID(payload)).rejects.toThrow(InvalidCredentialsError);

				expect(mockLogger.warn).toHaveBeenCalledWith(
					`[OpenID] User doesn't exist, and public registration not allowed for provider "${provider}"`,
				);
			});

			test('throws InvalidProviderError when user creation fails with RecordNotUnique', async () => {
				const config = createOpenIDConfig({
					allowPublicRegistration: true,
				});

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				vi.spyOn(driver.client!, 'callback').mockResolvedValue({
					claims: vi.fn(),
				} as any);

				vi.spyOn(driver.client!, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
				} as any);

				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue(undefined);

				const recordNotUniqueError: any = new InvalidProviderError();
				recordNotUniqueError.code = ErrorCode.RecordNotUnique;

				vi.spyOn(driver as any, 'getUsersService').mockReturnValue({
					createOne: vi.fn().mockRejectedValue(recordNotUniqueError as any),
				});

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await expect(driver.getUserID(payload)).rejects.toThrow(InvalidProviderError);

				expect(mockLogger.warn).toHaveBeenCalledWith(
					recordNotUniqueError,
					'[OpenID] Failed to register user. User not unique',
				);
			});
		});

		describe('Error handling', () => {
			test('throws error from handleError when callback fails', async () => {
				const config = createOpenIDConfig();

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				const callbackError = new Error('Callback failed');
				vi.spyOn(driver.client!, 'callback').mockRejectedValue(callbackError);

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await expect(driver.getUserID(payload)).rejects.toThrow();
			});

			test('throws error from handleError when userinfo fails', async () => {
				const config = createOpenIDConfig();

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				vi.spyOn(driver.client!, 'callback').mockResolvedValue({
					claims: vi.fn(),
				} as any);

				const userinfoError = new Error('Userinfo failed');
				vi.spyOn(driver.client!, 'userinfo').mockRejectedValue(userinfoError);

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await expect(driver.getUserID(payload)).rejects.toThrow();
			});
		});

		describe('Multi-domain callbacks', () => {
			test('uses correct callback URL based on originUrl in payload', async () => {
				vi.mocked(useEnv).mockReturnValue({
					[`AUTH_${provider.toUpperCase()}_REDIRECT_ALLOW_LIST`]: 'http://localhost:8080,http://external.com',
				});

				const config = createOpenIDConfig({
					allowPublicRegistration: true,
				});

				const driver = new OpenIDAuthDriver({ knex: {} as any }, config);
				await driver['getClient']();

				const mockUserInfo = {
					email: 'test@example.com',
				};

				const mockTokenSet = {
					access_token: 'test-access-token',
					refresh_token: 'test-refresh-token',
					claims: () => mockUserInfo,
				};

				vi.spyOn(driver.client!, 'callbackParams').mockReturnValue({});
				const callbackSpy = vi.spyOn(driver.client!, 'callback').mockResolvedValue(mockTokenSet as any);
				vi.spyOn(driver.client!, 'userinfo').mockResolvedValue(mockUserInfo as any);
				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue(undefined);

				vi.spyOn(driver as any, 'getUsersService').mockReturnValue({
					createOne: vi.fn().mockResolvedValue('new-user-id'),
				});

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
					originUrl: 'http://external.com',
				};

				await driver.getUserID(payload);

				// Verify callback was called with the correct callback URL for external.com
				expect(callbackSpy).toHaveBeenCalledWith(
					`http://external.com/auth/login/${provider}/callback`,
					expect.any(Object),
					expect.any(Object),
				);
			});
		});
	});

	describe('login', () => {
		test('calls refresh method', async () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			const refreshSpy = vi.spyOn(driver, 'refresh').mockResolvedValue();

			const user = { id: 'user-123' } as any;

			await driver.login(user);

			expect(refreshSpy).toHaveBeenCalledWith(user);
		});
	});

	describe('refresh', () => {
		test('does nothing when user has no auth_data', async () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			await driver['getClient']();

			const refreshClientSpy = vi.spyOn(driver.client!, 'refresh');

			const user = { id: 'user-123', auth_data: undefined } as any;

			await driver.refresh(user);

			expect(refreshClientSpy).not.toHaveBeenCalled();
		});

		test('does nothing when auth_data has no refreshToken', async () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			await driver['getClient']();

			const refreshClientSpy = vi.spyOn(driver.client!, 'refresh');

			const user = { id: 'user-123', auth_data: { other: 'data' } } as any;

			await driver.refresh(user);

			expect(refreshClientSpy).not.toHaveBeenCalled();
		});

		test('parses auth_data when it is a JSON string', async () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			await driver['getClient']();

			const mockTokenSet = { access_token: 'new-token', refresh_token: 'new-refresh' };
			const refreshClientSpy = vi.spyOn(driver.client!, 'refresh').mockResolvedValue(mockTokenSet as any);

			vi.spyOn(driver as any, 'getUsersService').mockReturnValue({
				updateOne: vi.fn(),
			});

			const user = {
				id: 'user-123',
				auth_data: JSON.stringify({ refreshToken: 'old-refresh-token' }),
			} as any;

			await driver.refresh(user);

			expect(refreshClientSpy).toHaveBeenCalledWith('old-refresh-token');
		});

		test('logs warning when auth_data string is invalid JSON', async () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			await driver['getClient']();

			const refreshClientSpy = vi.spyOn(driver.client!, 'refresh');

			const user = {
				id: 'user-123',
				auth_data: 'invalid-json{',
			} as any;

			await driver.refresh(user);

			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.stringContaining(`[OpenID] Session data isn't valid JSON: ${user.auth_data}`),
			);

			expect(refreshClientSpy).not.toHaveBeenCalled();
		});

		test('calls client.refresh with refreshToken from auth_data object', async () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			await driver['getClient']();

			const mockTokenSet = { access_token: 'new-token', refresh_token: 'new-refresh' };
			const refreshClientSpy = vi.spyOn(driver.client!, 'refresh').mockResolvedValue(mockTokenSet as any);

			vi.spyOn(driver as any, 'getUsersService').mockReturnValue({
				updateOne: vi.fn(),
			});

			const user = {
				id: 'user-123',
				auth_data: { refreshToken: 'test-refresh-token' },
			} as any;

			await driver.refresh(user);

			expect(refreshClientSpy).toHaveBeenCalledWith('test-refresh-token');
		});

		test('updates user with new refresh_token when provided', async () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			await driver['getClient']();

			const mockTokenSet = { access_token: 'new-token', refresh_token: 'new-refresh-token' };
			vi.spyOn(driver.client!, 'refresh').mockResolvedValue(mockTokenSet as any);

			const updateOneSpy = vi.fn();

			vi.spyOn(driver as any, 'getUsersService').mockReturnValue({
				updateOne: updateOneSpy,
			});

			const user = {
				id: 'user-123',
				auth_data: { refreshToken: 'old-refresh-token' },
			} as any;

			await driver.refresh(user);

			expect(updateOneSpy).toHaveBeenCalledWith(user.id, {
				auth_data: JSON.stringify({ refreshToken: mockTokenSet.refresh_token }),
			});
		});

		test('does not update user when no new refresh_token provided', async () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			await driver['getClient']();

			const mockTokenSet = { access_token: 'new-token' };
			vi.spyOn(driver.client!, 'refresh').mockResolvedValue(mockTokenSet as any);

			const updateOneSpy = vi.fn();

			vi.spyOn(driver as any, 'getUsersService').mockReturnValue({
				updateOne: updateOneSpy,
			});

			const user = {
				id: 'user-123',
				auth_data: { refreshToken: 'old-refresh-token' },
			} as any;

			await driver.refresh(user);

			expect(updateOneSpy).not.toHaveBeenCalled();
		});

		test('throws error from handleError when client.refresh fails', async () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			await driver['getClient']();

			const refreshError = new Error('Refresh failed');
			vi.spyOn(driver.client!, 'refresh').mockRejectedValue(refreshError);

			const user = {
				id: 'user-123',
				auth_data: { refreshToken: 'old-refresh-token' },
			} as any;

			await expect(driver.refresh(user)).rejects.toThrow();
		});
	});

	describe('handleError', () => {
		test('returns InvalidTokenError for OPError with invalid_grant', async () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			await driver['getClient']();

			const opError = new openidErrors.OPError({ error: 'invalid_grant' });
			vi.spyOn(driver.client!, 'refresh').mockRejectedValue(opError);

			const user = { id: 'user-123', auth_data: { refreshToken: 'invalid' } } as any;

			await expect(driver.refresh(user)).rejects.toThrow(InvalidTokenError);
			expect(mockLogger.warn).toHaveBeenCalledWith(opError, '[OpenID] Invalid grant');
		});

		test('returns ServiceUnavailableError for OPError with other errors', async () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			await driver['getClient']();

			const opError = new openidErrors.OPError({
				error: 'server_error',
				error_description: 'Internal server error',
			});

			vi.spyOn(driver.client!, 'refresh').mockRejectedValue(opError);

			const user = { id: 'user-123', auth_data: { refreshToken: 'test' } } as any;

			await expect(driver.refresh(user)).rejects.toThrow(ServiceUnavailableError);
			expect(mockLogger.warn).toHaveBeenCalledWith(opError, '[OpenID] Unknown OP error');
		});

		test('returns InvalidCredentialsError for RPError', async () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			await driver['getClient']();

			const rpError = new openidErrors.RPError('RP Error');
			vi.spyOn(driver.client!, 'refresh').mockRejectedValue(rpError);

			const user = { id: 'user-123', auth_data: { refreshToken: 'test' } } as any;

			await expect(driver.refresh(user)).rejects.toThrow(InvalidCredentialsError);
			expect(mockLogger.warn).toHaveBeenCalledWith(rpError, '[OpenID] Unknown RP error');
		});

		test('returns error as-is for unknown error types', async () => {
			const config = createOpenIDConfig();
			const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

			await driver['getClient']();

			const unknownError = new Error('Unknown error');
			vi.spyOn(driver.client!, 'refresh').mockRejectedValue(unknownError);

			const user = { id: 'user-123', auth_data: { refreshToken: 'test' } } as any;

			await expect(driver.refresh(user)).rejects.toThrow(unknownError);
			expect(mockLogger.warn).toHaveBeenCalledWith(unknownError, '[OpenID] Unknown error');
		});
	});
});
