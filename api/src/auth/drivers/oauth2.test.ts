import { useEnv } from '@directus/env';
import {
	ErrorCode,
	InvalidCredentialsError,
	InvalidProviderConfigError,
	InvalidProviderError,
	InvalidTokenError,
	ServiceUnavailableError,
} from '@directus/errors';
import { generators, errors as openidErrors } from 'openid-client';
import type { Logger } from 'pino';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getAuthProvider } from '../../auth.js';
import { useLogger } from '../../logger/index.js';
import { createOAuth2AuthRouter, OAuth2AuthDriver } from './oauth2.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => ({
		EMAIL_TEMPLATES_PATH: './templates',
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

vi.mock('../utils/is-login-redirect-allowed.js', () => ({
	isLoginRedirectAllowed: vi.fn(() => true),
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

const mockIssuerConstructor = vi.fn();
const mockClientConstructor = vi.fn();
const mockAuthorizationUrl = vi.fn((params) => `https://test.com/authorize?${JSON.stringify(params)}`);

vi.mock('openid-client', () => {
	class MockOPError extends Error {
		error: string;
		error_description: string | undefined;
		constructor(params: { error: string; error_description?: string }) {
			super(params.error);
			this.error = params.error;
			this.error_description = params.error_description;
		}
	}

	class MockRPError extends Error {}

	return {
		Issuer: class MockIssuer {
			static Client: any;
			constructor(config: any) {
				mockIssuerConstructor(config);
			}

			Client = class {
				constructor(clientConfig: any) {
					mockClientConstructor(clientConfig);
					return {
						authorizationUrl: mockAuthorizationUrl,
						oauthCallback: vi.fn(),
						userinfo: vi.fn(),
						refresh: vi.fn(),
					};
				}
			};
		},
		generators: {
			codeVerifier: () => 'test-code-verifier',
			codeChallenge: (verifier: string) => `challenge-${verifier}`,
		},
		errors: {
			OPError: MockOPError,
			RPError: MockRPError,
		},
	};
});

let mockLogger: Logger;
let codeChallengelengeSpy: any;

beforeEach(() => {
	mockLogger = {
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	} as unknown as Logger;

	vi.mocked(useLogger).mockReturnValue(mockLogger);
	mockIssuerConstructor.mockClear();
	mockClientConstructor.mockClear();
	mockAuthorizationUrl.mockClear();

	codeChallengelengeSpy = vi.spyOn(generators, 'codeChallenge');
});

afterEach(() => {
	vi.clearAllMocks();
});

const provider = 'github';

const createOAuth2Config = (overrides: Record<string, any> = {}) => ({
	provider,
	authorizeUrl: `https://${provider}.com/oauth/authorize`,
	accessUrl: `https://${provider}.com/oauth/token`,
	profileUrl: `https://${provider}.com/user`,
	clientId: 'test-client-id',
	clientSecret: 'test-client-secret',
	...overrides,
});

describe('OAuth2AuthDriver', () => {
	describe('Constructor', () => {
		describe('Validation', () => {
			test.each([
				{
					field: 'authorizeUrl',
					config: { provider, accessUrl: 'url', profileUrl: 'url', clientId: 'id', clientSecret: 'secret' },
				},
				{
					field: 'accessUrl',
					config: { provider, authorizeUrl: 'url', profileUrl: 'url', clientId: 'id', clientSecret: 'secret' },
				},
				{
					field: 'profileUrl',
					config: { provider, authorizeUrl: 'url', accessUrl: 'url', clientId: 'id', clientSecret: 'secret' },
				},
				{
					field: 'clientId',
					config: { provider, authorizeUrl: 'url', accessUrl: 'url', profileUrl: 'url', clientSecret: 'secret' },
				},
				{
					field: 'clientSecret',
					config: { provider, authorizeUrl: 'url', accessUrl: 'url', profileUrl: 'url', clientId: 'id' },
				},
				{
					field: 'provider',
					config: { authorizeUrl: 'url', accessUrl: 'url', profileUrl: 'url', clientId: 'id', clientSecret: 'secret' },
				},
			])('throws InvalidProviderConfigError when $field is missing', ({ config }) => {
				expect(() => new OAuth2AuthDriver({ knex: {} as any }, config as any)).toThrow(InvalidProviderConfigError);
				expect(mockLogger.error).toHaveBeenCalledWith('Invalid provider config');
			});

			test('creates driver successfully with all required config', () => {
				const validConfig = createOAuth2Config();
				const driver = new OAuth2AuthDriver({ knex: {} as any }, validConfig);

				expect(driver).toBeDefined();
				expect(driver.client).toBeDefined();
			});
		});

		describe('Configuration', () => {
			test('creates Issuer with correct configuration from provider config', () => {
				const config = createOAuth2Config();

				new OAuth2AuthDriver({ knex: {} as any }, config);

				expect(mockIssuerConstructor).toHaveBeenCalledWith({
					authorization_endpoint: config.authorizeUrl,
					token_endpoint: config.accessUrl,
					userinfo_endpoint: config.profileUrl,
					issuer: config.provider,
				});
			});

			test('passes correct base parameters to openid-client Client constructor', () => {
				const config = createOAuth2Config();
				new OAuth2AuthDriver({ knex: {} as any }, config);

				expect(mockClientConstructor).toHaveBeenCalledWith(
					expect.objectContaining({
						client_id: config.clientId,
						client_secret: config.clientSecret,
						response_types: ['code'],
					}),
				);
			});

			test('passes clientOptionsOverrides from env to Client constructor', () => {
				vi.mocked(useEnv).mockReturnValue({
					EMAIL_TEMPLATES_PATH: './templates',
					AUTH_GITHUB_CLIENT_TEST: 'test',
				});

				const config = createOAuth2Config();
				new OAuth2AuthDriver({ knex: {} as any }, config);

				expect(mockClientConstructor).toHaveBeenCalledWith(
					expect.objectContaining({
						test: 'test',
					}),
				);
			});

			test('throws InvalidProviderError when roleMapping is an Array instead of Object', () => {
				const config = createOAuth2Config({
					roleMapping: ['role1', 'role2'],
				});

				expect(() => new OAuth2AuthDriver({ knex: {} as any }, config)).toThrow();

				expect(mockLogger.error).toHaveBeenCalledWith(
					expect.stringContaining('[OAuth2] Expected a JSON-Object as role mapping'),
				);
			});
		});
	});

	describe('generateCodeVerifier', () => {
		test('returns a code verifier string', () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const verifier = driver.generateCodeVerifier();

			expect(verifier).toBe('test-code-verifier');
		});
	});

	describe('generateAuthUrl', () => {
		test('generates authorization URL with correct default parameters', () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const codeVerifier = driver.generateCodeVerifier();
			const authUrl = driver.generateAuthUrl(codeVerifier, false);

			expect(authUrl).toBeDefined();
			expect(authUrl).toContain('https://test.com/authorize');

			expect(mockAuthorizationUrl).toHaveBeenCalledWith({
				scope: 'email',
				access_type: 'offline',
				prompt: undefined,
				code_challenge: 'challenge-test-code-verifier',
				code_challenge_method: 'S256',
				state: 'challenge-test-code-verifier',
				redirect_uri: undefined,
			});
		});

		test('includes prompt=consent when prompt=true', () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const codeVerifier = driver.generateCodeVerifier();
			driver.generateAuthUrl(codeVerifier, true);

			expect(mockAuthorizationUrl).toHaveBeenCalledWith(
				expect.objectContaining({
					prompt: 'consent',
				}),
			);
		});

		test('uses custom scope from config', () => {
			const config = createOAuth2Config({ scope: 'test' });
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const codeVerifier = driver.generateCodeVerifier();
			driver.generateAuthUrl(codeVerifier, false);

			expect(mockAuthorizationUrl).toHaveBeenCalledWith(
				expect.objectContaining({
					scope: 'test',
				}),
			);
		});

		test('uses custom redirectUri when provided', () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const codeVerifier = driver.generateCodeVerifier();
			const customRedirectUri = 'http://external.com/auth/callback';
			driver.generateAuthUrl(codeVerifier, false, customRedirectUri);

			expect(mockAuthorizationUrl).toHaveBeenCalledWith(
				expect.objectContaining({
					redirect_uri: customRedirectUri,
				}),
			);
		});

		test('merges params from config with default params', () => {
			const config = createOAuth2Config({
				params: {
					test: 'test',
				},
			});

			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const codeVerifier = driver.generateCodeVerifier();
			driver.generateAuthUrl(codeVerifier);

			expect(mockAuthorizationUrl).toHaveBeenCalledWith(
				expect.objectContaining({
					test: 'test',
				}),
			);
		});

		test('calls generators.codeChallenge in S256 mode', () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			driver.generateAuthUrl('my-verifier');

			expect(codeChallengelengeSpy).toHaveBeenCalledWith('my-verifier');

			expect(mockAuthorizationUrl).toHaveBeenCalledWith(
				expect.objectContaining({
					code_challenge: 'challenge-my-verifier',
					code_challenge_method: 'S256',
				}),
			);
		});

		test('does not call generators.codeChallenge in plain mode', () => {
			const config = createOAuth2Config({ plainCodeChallenge: true });
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			driver.generateAuthUrl('my-verifier');

			expect(codeChallengelengeSpy).not.toHaveBeenCalled();

			expect(mockAuthorizationUrl).toHaveBeenCalledWith(
				expect.objectContaining({
					code_challenge: 'my-verifier',
					code_challenge_method: 'plain',
				}),
			);
		});
	});

	describe('getUserID', () => {
		describe('Validation', () => {
			test.each([
				{ field: 'code', payload: { codeVerifier: 'test-verifier', state: 'test-state' } },
				{ field: 'codeVerifier', payload: { code: 'test-code', state: 'test-state' } },
				{ field: 'state', payload: { code: 'test-code', codeVerifier: 'test-verifier' } },
			])(`throws InvalidCredentialsError when $field is missing`, async ({ payload }) => {
				const config = createOAuth2Config();
				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				await expect(driver.getUserID(payload)).rejects.toThrow(InvalidCredentialsError);
				expect(mockLogger.warn).toHaveBeenCalledWith('[OAuth2] No code, codeVerifier or state in payload');
			});
		});

		describe('PKCE', () => {
			test('calls codeChallenge and passes hashed state to oauthCallback (S256 mode)', async () => {
				const config = createOAuth2Config({
					identifierKey: 'sub',
				});

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				const oauthCallbackSpy = vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({
					access_token: 'test-access-token',
				} as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({ sub: '123', email: 'test@test.com' } as any);
				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue('user-id');

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				expect(codeChallengelengeSpy).toHaveBeenCalledWith('test-verifier');

				const oauthCallArgs = oauthCallbackSpy.mock.calls[0];

				expect(oauthCallArgs?.[2]).toEqual({
					code_verifier: 'test-verifier',
					state: 'challenge-test-verifier',
				});
			});

			test('does not call codeChallenge and passes codeVerifier as state (plain mode)', async () => {
				const config = createOAuth2Config({
					plainCodeChallenge: true,
					identifierKey: 'sub',
				});

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				const oauthCallbackSpy = vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({
					access_token: 'test-access-token',
				} as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({ sub: '123', email: 'test@test.com' } as any);
				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue('user-id');

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				expect(codeChallengelengeSpy).not.toHaveBeenCalled();

				const oauthCallArgs = oauthCallbackSpy.mock.calls[0];

				expect(oauthCallArgs?.[2]).toEqual({
					code_verifier: 'test-verifier',
					state: 'test-verifier',
				});
			});

			test('calls userinfo with access_token from oauthCallback', async () => {
				const config = createOAuth2Config({
					identifierKey: 'sub',
				});

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				const mockTokenSet = { access_token: 'test-access-token-123' };
				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue(mockTokenSet as any);

				const userinfoSpy = vi
					.spyOn(driver.client, 'userinfo')
					.mockResolvedValue({ sub: '123', email: 'test@test.com' } as any);

				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue('user-id');

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
				const config = createOAuth2Config({
					identifierKey: 'sub',
					defaultRoleId: 'default-role-123',
					allowPublicRegistration: true,
				});

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({
					access_token: 'test-access-token',
				} as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({ sub: '123', email: 'test@test.com' } as any);

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
				const config = createOAuth2Config({
					identifierKey: 'sub',
					defaultRoleId: 'default-role',
					allowPublicRegistration: true,
					roleMapping: {
						'github-org-admins': 'admin-role-id',
						'github-org-editors': 'editor-role-id',
					},
				});

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({
					access_token: 'test-access-token',
				} as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({
					sub: '123',
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
				const config = createOAuth2Config({
					identifierKey: 'sub',
					defaultRoleId: 'default-role',
					allowPublicRegistration: true,
					groupClaimName: 'custom_groups',
					roleMapping: {
						'admin-group': 'admin-role-id',
					},
				});

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				const mockTokenSet = { access_token: 'test-access-token' };
				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue(mockTokenSet as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({
					sub: '123',
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
				const config = createOAuth2Config({
					defaultRoleId: 'default-role',
					roleMapping: {
						'admin-group': 'admin-role-id',
					},
				});

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				const mockTokenSet = { access_token: 'test-access-token' };
				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({ mockTokenSet } as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
					// No groups field
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
					'[OAuth2] Configured group claim with name "groups" does not exist or is empty.',
				);
			});
		});

		describe('Identifier extraction', () => {
			test('extracts identifier from custom identifierKey', async () => {
				const config = createOAuth2Config({
					identifierKey: 'user_id',
				});

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({ access_token: 'token' } as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({
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

			test('falls back to email when identifierKey not found', async () => {
				const config = createOAuth2Config();

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({
					access_token: 'token',
				} as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({
					email: 'fallback@test.com',
				} as any);

				const fetchUserIdSpy = vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue('existing-user');

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				expect(fetchUserIdSpy).toHaveBeenCalledWith('fallback@test.com');
			});

			test('throws InvalidCredentialsError when no identifier found', async () => {
				const config = createOAuth2Config();

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({ access_token: 'token' } as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({
					name: 'Test',
				} as any);

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await expect(driver.getUserID(payload)).rejects.toThrow(InvalidCredentialsError);
				expect(mockLogger.warn).toHaveBeenCalledWith('[OAuth2] Failed to find user identifier for provider "github"');
			});

			test('uses custom emailKey for fallback', async () => {
				const config = createOAuth2Config({
					emailKey: 'mail',
				});

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({ access_token: 'token' } as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({
					mail: 'custom-email@test.com',
				} as any);

				const fetchUserIdSpy = vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue('existing-user');

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await driver.getUserID(payload);

				expect(fetchUserIdSpy).toHaveBeenCalledWith('custom-email@test.com');
			});
		});

		describe('UserPayload construction', () => {
			test('extracts first_name and last_name from userInfo', async () => {
				const config = createOAuth2Config({
					allowPublicRegistration: true,
					firstNameKey: 'given_name',
					lastNameKey: 'family_name',
				});

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({ access_token: 'token' } as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
					given_name: 'John',
					family_name: 'Doe',
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
						first_name: 'John',
						last_name: 'Doe',
					}),
				);
			});

			test('includes auth_data with refresh_token when present', async () => {
				const config = createOAuth2Config({
					defaultRoleId: 'role-id',
					allowPublicRegistration: true,
				});

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({
					access_token: 'access-token',
					refresh_token: 'refresh-token-123',
				} as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({
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
						auth_data: JSON.stringify({ refreshToken: 'refresh-token-123' }),
					}),
				);
			});

			test('does not include auth_data when no refresh_token', async () => {
				const config = createOAuth2Config({
					defaultRoleId: 'role-id',
					allowPublicRegistration: true,
				});

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({
					access_token: 'access-token',
				} as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({
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
						auth_data: undefined,
					}),
				);
			});
		});

		describe('Update existing user', () => {
			test('includes role in update payload when roleMapping exists', async () => {
				const config = createOAuth2Config({
					roleMapping: {
						'admin-group': 'admin-role-id',
					},
				});

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({
					access_token: 'token',
					refresh_token: 'refresh-token',
				} as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({
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
				const config = createOAuth2Config({
					syncUserInfo: true,
					firstNameKey: 'first_name',
					lastNameKey: 'last_name',
				});

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({
					access_token: 'token',
					refresh_token: 'refresh-token',
				} as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
					first_name: 'Jane',
					last_name: 'Smith',
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
				const config = createOAuth2Config();

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({
					access_token: 'token',
				} as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({
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
				const config = createOAuth2Config({
					allowPublicRegistration: false,
				});

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({ access_token: 'token' } as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({
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
					`[OAuth2] User doesn't exist, and public registration not allowed for provider "github"`,
				);
			});

			test('throws InvalidProviderError when user creation fails with RecordNotUnique', async () => {
				const config = createOAuth2Config({
					defaultRoleId: 'role-id',
					allowPublicRegistration: true,
				});

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				vi.spyOn(driver.client, 'oauthCallback').mockResolvedValue({ access_token: 'token' } as any);

				vi.spyOn(driver.client, 'userinfo').mockResolvedValue({
					email: 'test@test.com',
				} as any);

				vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue(undefined);

				const recordNotUniqueError: any = new InvalidProviderError();
				recordNotUniqueError.code = ErrorCode.RecordNotUnique;

				vi.spyOn(driver as any, 'getUsersService').mockReturnValue({
					createOne: vi.fn().mockRejectedValue(recordNotUniqueError),
				});

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await expect(driver.getUserID(payload)).rejects.toThrow(InvalidProviderError);

				expect(mockLogger.warn).toHaveBeenCalledWith(
					recordNotUniqueError,
					'[OAuth2] Failed to register user. User not unique',
				);
			});
		});

		describe('Error handling', () => {
			test('throws error from handleError when oauthCallback fails', async () => {
				const config = createOAuth2Config();

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				const oauthError = new Error('OAuth callback failed');
				vi.spyOn(driver.client, 'oauthCallback').mockRejectedValue(oauthError);

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await expect(driver.getUserID(payload)).rejects.toThrow();
			});

			test('throws error from handleError when userinfo fails', async () => {
				const config = createOAuth2Config();

				const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

				const userinfoError = new Error('Userinfo failed');
				vi.spyOn(driver.client, 'userinfo').mockRejectedValue(userinfoError);

				const payload = {
					code: 'test-code',
					codeVerifier: 'test-verifier',
					state: 'test-state',
				};

				await expect(driver.getUserID(payload)).rejects.toThrow();
			});
		});
	});

	describe('login', () => {
		test('calls refresh method', async () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const refreshSpy = vi.spyOn(driver, 'refresh').mockResolvedValue();

			const user = { id: 'user-123' } as any;
			await driver.login(user);

			expect(refreshSpy).toHaveBeenCalledWith(user);
		});
	});

	describe('refresh', () => {
		test('does nothing when user has no auth_data', async () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const refreshClientSpy = vi.spyOn(driver.client, 'refresh');

			const user = { auth_data: undefined } as any;
			await driver.refresh(user);

			expect(refreshClientSpy).not.toHaveBeenCalled();
		});

		test('does nothing when auth_data has no refreshToken', async () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const refreshClientSpy = vi.spyOn(driver.client, 'refresh');

			const user = {
				auth_data: { other: 'data' },
			} as any;

			await driver.refresh(user);

			expect(refreshClientSpy).not.toHaveBeenCalled();
		});

		test('parses auth_data when it is a JSON string', async () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const mockTokenSet = { access_token: 'new-token', refresh_token: 'new-refresh' };
			const refreshClientSpy = vi.spyOn(driver.client, 'refresh').mockResolvedValue(mockTokenSet as any);

			vi.spyOn(driver as any, 'getUsersService').mockReturnValue({
				updateOne: vi.fn(),
			});

			const user = {
				auth_data: JSON.stringify({ refreshToken: 'old-refresh-token' }),
			} as any;

			await driver.refresh(user);

			expect(refreshClientSpy).toHaveBeenCalledWith('old-refresh-token');
		});

		test('logs warning when auth_data string is invalid JSON', async () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const refreshClientSpy = vi.spyOn(driver.client, 'refresh');

			const user = {
				auth_data: 'invalid-json{',
			} as any;

			await driver.refresh(user);

			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.stringContaining(`[OAuth2] Session data isn't valid JSON: ${user.auth_data}`),
			);

			expect(refreshClientSpy).not.toHaveBeenCalled();
		});

		test('calls client.refresh with refreshToken from auth_data object', async () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const mockTokenSet = { access_token: 'new-token', refresh_token: 'new-refresh' };
			const refreshClientSpy = vi.spyOn(driver.client, 'refresh').mockResolvedValue(mockTokenSet as any);

			vi.spyOn(driver as any, 'getUsersService').mockReturnValue({
				updateOne: vi.fn(),
			});

			const user = {
				auth_data: { refreshToken: 'test-refresh-token' },
			} as any;

			await driver.refresh(user);

			expect(refreshClientSpy).toHaveBeenCalledWith(user.auth_data.refreshToken);
		});

		test('updates user with new refresh_token when provided', async () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const mockTokenSet = { access_token: 'new-token', refresh_token: 'new-refresh-token' };
			vi.spyOn(driver.client, 'refresh').mockResolvedValue(mockTokenSet as any);

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
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const mockTokenSet = { access_token: 'new-token' };
			vi.spyOn(driver.client, 'refresh').mockResolvedValue(mockTokenSet as any);

			const updateOneSpy = vi.fn();

			vi.spyOn(driver as any, 'getUsersService').mockReturnValue({
				updateOne: updateOneSpy,
			});

			const user = {
				auth_data: { refreshToken: 'refresh-token' },
			} as any;

			await driver.refresh(user);

			expect(updateOneSpy).not.toHaveBeenCalled();
		});

		test('throws error from handleError when client.refresh fails', async () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const refreshError = new Error('Refresh failed');
			vi.spyOn(driver.client, 'refresh').mockRejectedValue(refreshError);

			const user = {
				id: 'user-123',
				auth_data: { refreshToken: 'refresh-token' },
			} as any;

			await expect(driver.refresh(user)).rejects.toThrow();
		});
	});

	describe('handleError', () => {
		test('returns InvalidTokenError for OPError with invalid_grant', async () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const opError = new openidErrors.OPError({ error: 'invalid_grant' });
			vi.spyOn(driver.client, 'refresh').mockRejectedValue(opError);

			const user = { id: 'user-123', auth_data: { refreshToken: 'invalid' } } as any;

			await expect(driver.refresh(user)).rejects.toThrow(InvalidTokenError);
			expect(mockLogger.warn).toHaveBeenCalledWith(opError, '[OAuth2] Invalid grant');
		});

		test('returns ServiceUnavailableError for OPError with other errors', async () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const opError = new openidErrors.OPError({
				error: 'server_error',
				error_description: 'Internal server error',
			});

			vi.spyOn(driver.client, 'refresh').mockRejectedValue(opError);

			const user = { id: 'user-123', auth_data: { refreshToken: 'test' } } as any;

			await expect(driver.refresh(user)).rejects.toThrow(ServiceUnavailableError);
			expect(mockLogger.warn).toHaveBeenCalledWith(opError, '[OAuth2] Unknown OP error');
		});

		test('returns InvalidCredentialsError for RPError', async () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const rpError = new openidErrors.RPError('RP Error');
			vi.spyOn(driver.client, 'refresh').mockRejectedValue(rpError);

			const user = { id: 'user-123', auth_data: { refreshToken: 'test' } } as any;

			await expect(driver.refresh(user)).rejects.toThrow(InvalidCredentialsError);
			expect(mockLogger.warn).toHaveBeenCalledWith(rpError, '[OAuth2] Unknown RP error');
		});

		test('returns error as-is for unknown error types', async () => {
			const config = createOAuth2Config();
			const driver = new OAuth2AuthDriver({ knex: {} as any }, config);

			const unknownError = new Error('Unknown error');
			vi.spyOn(driver.client, 'refresh').mockRejectedValue(unknownError);

			const user = { id: 'user-123', auth_data: { refreshToken: 'test' } } as any;

			await expect(driver.refresh(user)).rejects.toThrow(unknownError);
			expect(mockLogger.warn).toHaveBeenCalledWith(unknownError, '[OAuth2] Unknown error');
		});
	});
});

describe('createOAuth2AuthRouter', () => {
	function getRouteHandler(router: any, method: string, path: string) {
		for (const layer of router.stack) {
			if (layer.route?.path === path && layer.route?.methods?.[method]) {
				return layer.route.stack[0].handle;
			}
		}

		return undefined;
	}

	function createMockReqRes() {
		const req: any = {
			query: {},
			protocol: 'http',
			get: vi.fn((header: string) => {
				if (header === 'host') return 'localhost:8055';
				return undefined;
			}),
		};

		const res: any = {
			cookie: vi.fn(),
			redirect: vi.fn(),
		};

		return { req, res };
	}

	test('sets secure cookie option to true when AUTH_COOKIE_SECURE is true', () => {
		vi.mocked(useEnv).mockReturnValue({
			EMAIL_TEMPLATES_PATH: './templates',
			AUTH_COOKIE_SECURE: true,
		});

		const mockDriver = {
			generateCodeVerifier: vi.fn(() => 'test-verifier'),
			generateAuthUrl: vi.fn(() => 'https://provider.com/auth'),
		};

		vi.mocked(getAuthProvider).mockReturnValue(mockDriver as any);

		const router = createOAuth2AuthRouter('test');
		const handler = getRouteHandler(router, 'get', '/');

		const { req, res } = createMockReqRes();

		handler(req, res);

		expect(res.cookie).toHaveBeenCalledWith(
			'oauth2.test',
			expect.any(String),
			expect.objectContaining({ secure: true }),
		);
	});

	test('sets secure cookie option to false when AUTH_COOKIE_SECURE is false', () => {
		vi.mocked(useEnv).mockReturnValue({
			EMAIL_TEMPLATES_PATH: './templates',
			AUTH_COOKIE_SECURE: false,
		});

		const mockDriver = {
			generateCodeVerifier: vi.fn(() => 'test-verifier'),
			generateAuthUrl: vi.fn(() => 'https://provider.com/auth'),
		};

		vi.mocked(getAuthProvider).mockReturnValue(mockDriver as any);

		const router = createOAuth2AuthRouter('test');
		const handler = getRouteHandler(router, 'get', '/');

		const { req, res } = createMockReqRes();

		handler(req, res);

		expect(res.cookie).toHaveBeenCalledWith(
			'oauth2.test',
			expect.any(String),
			expect.objectContaining({ secure: false }),
		);
	});
});
