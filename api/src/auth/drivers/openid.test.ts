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

vi.mock('../../utils/oauth-callbacks.js', () => ({
  generateRedirectUrls: vi.fn(),
  getCallbackFromOriginUrl: vi.fn(),
  getCallbackFromRequest: vi.fn(),
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

      constructor() { }
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
      RPError: class RPError extends Error { },
    },
  };
});

import { useEnv } from '@directus/env';
import { useLogger } from '../../logger/index.js';
import { generateRedirectUrls, getCallbackFromOriginUrl } from '../../utils/oauth-callbacks.js';
import { OpenIDAuthDriver } from './openid.js';
import type { Logger } from 'pino';
import { InvalidProviderConfigError, InvalidProviderError, InvalidCredentialsError, InvalidTokenError, ServiceUnavailableError } from '@directus/errors';
import { errors as openidErrors } from 'openid-client';

const createMockEnv = (overrides: Record<string, any> = {}) => ({
  ...overrides,
});

let mockLogger: Logger;

beforeEach(() => {
  mockLogger = {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  } as unknown as Logger;

  vi.mocked(useLogger).mockReturnValue(mockLogger);
  vi.mocked(useEnv).mockReturnValue(createMockEnv());
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
        const mockRedirectUris = [
          new URL('http://external.com/auth/login/${provider}/callback'),
          new URL('http://internal.com/auth/login/${provider}/callback'),
        ];

        vi.mocked(generateRedirectUrls).mockReturnValue(mockRedirectUris);

        vi.mocked(useEnv).mockReturnValue(
          createMockEnv({
            [`AUTH_${provider.toUpperCase()}_REDIRECT_ALLOW_LIST`]: 'http://external.com,http://internal.com',
          }),
        );

        const config = createOpenIDConfig();
        const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

        expect(generateRedirectUrls).toHaveBeenCalledWith(provider, 'OpenID');
        expect(driver.redirectUris).toEqual(mockRedirectUris);
      });

      test('sets empty redirectUris when no REDIRECT_ALLOW_LIST', () => {
        vi.mocked(generateRedirectUrls).mockReturnValue([]);

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
        const getClientSpy = vi.spyOn(OpenIDAuthDriver.prototype as any, 'getClient')
          .mockRejectedValue(new Error('Discovery failed'));

        const config = createOpenIDConfig({
          issuerDiscoveryMustSucceed: false,
        });

        new OpenIDAuthDriver({ knex: {} as any }, config);

        // Flush microtasks for .catch()
        await Promise.resolve();

        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.any(Error),
          '[OpenID] Failed to fetch provider config',
        );

        getClientSpy.mockRestore();
      });

      test('does not call process.exit when issuerDiscoveryMustSucceed is false', async () => {
        const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

        const getClientSpy = vi.spyOn(OpenIDAuthDriver.prototype as any, 'getClient')
          .mockRejectedValue(new Error('Discovery failed'));

        const config = createOpenIDConfig({
          issuerDiscoveryMustSucceed: false,
        });

        new OpenIDAuthDriver({ knex: {} as any }, config);

        // Flush microtasks for .catch()
        await Promise.resolve();

        expect(processExitSpy).not.toHaveBeenCalled();

        processExitSpy.mockRestore();
        getClientSpy.mockRestore();
      });

      test('calls process.exit(1) when issuerDiscoveryMustSucceed is not false and discovery fails', async () => {
        const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

        const getClientSpy = vi.spyOn(OpenIDAuthDriver.prototype as any, 'getClient')
          .mockRejectedValue(new Error('Discovery failed'));

        const config = createOpenIDConfig({
          issuerDiscoveryMustSucceed: true,
        });

        new OpenIDAuthDriver({ knex: {} as any }, config);

        // Flush microtasks .catch()
        await Promise.resolve();

        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining(`AUTH_${provider.toUpperCase()}_ISSUER_DISCOVERY_MUST_SUCCEED is enabled and discovery failed, exiting`),
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
          access_token: 'test-access-token',
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
          claims: () => { }
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
          claims: () => ({ sub: '123', email: 'test@test.com' }),
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

    describe('Multi-domain callbacks', () => {
      test('uses getCallbackFromOriginUrl to find correct callback for originUrl', async () => {
        const mockRedirectUris = [
          new URL(`http://localhost:8080/auth/login/${provider}/callback`),
          new URL(`http://external.com/auth/login/${provider}/callback`),
        ];

        vi.mocked(generateRedirectUrls).mockReturnValue(mockRedirectUris);

        const externalCallback = mockRedirectUris[1]!;
        vi.mocked(getCallbackFromOriginUrl).mockReturnValue(externalCallback);

        const config = createOpenIDConfig({
          allowPublicRegistration: true
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
        vi.spyOn(driver.client!, 'callback').mockResolvedValue(mockTokenSet as any);
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

        expect(getCallbackFromOriginUrl).toHaveBeenCalledWith(mockRedirectUris, 'http://external.com');

        expect(driver.client!.callback).toHaveBeenCalledWith(
          externalCallback.toString(),
          expect.any(Object),
          expect.any(Object),
        );
      });
    });
  });

  describe('login', () => {
    test('does nothing (empty implementation)', async () => {
      const config = createOpenIDConfig();
      const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

      const user = { id: 'user-123' } as any;

      await expect(driver.login(user)).resolves.toBeUndefined();
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

