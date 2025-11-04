import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { BASE_MOCK_ENV } from './__test-utils__/auth-driver.test-utils.js';

// CRITICAL: Setup mocks BEFORE importing anything else
// Mock @directus/env BEFORE any imports that use it (like constants.ts)
vi.mock('@directus/env', () => ({
  useEnv: vi.fn(() => BASE_MOCK_ENV),
}));

// Mock core dependencies
vi.mock('../../logger');
vi.mock('../../database');
vi.mock('../../emitter');

// Mock app and middleware to prevent full server initialization
vi.mock('../../app', () => ({
  default: {},
}));

vi.mock('../../middleware/respond', () => ({
  respond: vi.fn(),
}));

vi.mock('../../middleware/use-collection', () => ({
  useCollection: vi.fn(() => vi.fn()),
}));

// Mock utility functions
vi.mock('../../utils/get-secret', () => ({
  getSecret: () => 'test-secret',
}));

vi.mock('../../utils/get-schema', () => ({
  getSchema: vi.fn(),
}));

vi.mock('../../utils/async-handler', () => ({
  default: (fn: any) => fn,
}));

// Mock our OAuth callback utilities
vi.mock('../../utils/oauth-callbacks.js', () => ({
  generateRedirectUrls: vi.fn(),
  getCallbackFromOriginUrl: vi.fn(),
  getCallbackFromRequest: vi.fn(),
}));

// Mock openid-client for OpenID
vi.mock('openid-client', () => {
  const mockClient = {
    authorizationUrl: vi.fn((params) => `https://test.com/authorize?${JSON.stringify(params)}`),
    callbackParams: vi.fn(),
    callback: vi.fn(),
    userinfo: vi.fn(),
    refresh: vi.fn(),
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

// Now import test utilities and the module under test
import {
  createMockEnv,
  createOpenIDConfig,
} from './__test-utils__/auth-driver.test-utils.js';
import { useEnv } from '@directus/env';
import { useLogger } from '../../logger/index.js';
import { generateRedirectUrls, getCallbackFromOriginUrl } from '../../utils/oauth-callbacks.js';
import { OpenIDAuthDriver } from './openid.js';
import type { Logger } from 'pino';
import { InvalidProviderConfigError, InvalidProviderError } from '@directus/errors';

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

describe('OpenIDAuthDriver', () => {
  describe('Constructor', () => {
    describe('Validation', () => {
      test.each([
        { field: 'issuerUrl', config: { provider: 'okta', clientId: 'id', clientSecret: 'secret' } },
        { field: 'clientId', config: { provider: 'okta', issuerUrl: 'url', clientSecret: 'secret' } },
        { field: 'clientSecret', config: { provider: 'okta', issuerUrl: 'url', clientId: 'id' } },
        { field: 'provider', config: { issuerUrl: 'url', clientId: 'id', clientSecret: 'secret' } },
      ])('throws InvalidProviderConfigError when $field is missing', ({ config }) => {
        expect(() => new OpenIDAuthDriver({ knex: {} as any }, config as any)).toThrow(InvalidProviderConfigError);
        expect(mockLogger.error).toHaveBeenCalledWith('Invalid provider config');
      });

      test('throws InvalidProviderError when roleMapping is an Array instead of Object', () => {
        const config = createOpenIDConfig('okta', {
          roleMapping: ['role1', 'role2'],
        });

        expect(() => new OpenIDAuthDriver({ knex: {} as any }, config)).toThrow(InvalidProviderError);

        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('[OpenID] Expected a JSON-Object as role mapping'),
        );
      });

      test('creates driver successfully with all required config', () => {
        const config = createOpenIDConfig('okta');
        const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

        expect(driver).toBeDefined();
        expect(driver.client).toBeNull();
      });
    });

    describe('Configuration', () => {
      test('generates redirectUris using generateRedirectUrls utility', () => {
        const mockRedirectUris = [
          new URL('http://external.com/auth/login/okta/callback'),
          new URL('http://internal.com/auth/login/okta/callback'),
        ];

        vi.mocked(generateRedirectUrls).mockReturnValue(mockRedirectUris);

        vi.mocked(useEnv).mockReturnValue(
          createMockEnv({
            AUTH_OKTA_REDIRECT_ALLOW_LIST: 'http://external.com,http://internal.com',
          }),
        );

        const config = createOpenIDConfig('okta');
        const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

        expect(generateRedirectUrls).toHaveBeenCalledWith('okta', 'OpenID');
        expect(driver.redirectUris).toEqual(mockRedirectUris);
      });

      test('sets empty redirectUris when no REDIRECT_ALLOW_LIST', () => {
        vi.mocked(generateRedirectUrls).mockReturnValue([]);

        const config = createOpenIDConfig('okta');
        const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

        expect(driver.redirectUris).toEqual([]);
      });
    });
  });

  describe('generateCodeVerifier', () => {
    test('returns a code verifier string', () => {
      const config = createOpenIDConfig('okta');
      const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

      const verifier = driver.generateCodeVerifier();

      expect(verifier).toBe('test-code-verifier');
    });
  });

  describe('generateAuthUrl', () => {
    test('generates authorization URL with default parameters', async () => {
      const config = createOpenIDConfig('okta');
      const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

      await driver['getClient']();

      const codeVerifier = driver.generateCodeVerifier();
      const authUrl = await driver.generateAuthUrl(codeVerifier, false);

      expect(authUrl).toBeDefined();
      expect(authUrl).toContain('https://test.com/authorize');
    });

    test('includes prompt parameter when prompt=true', async () => {
      const config = createOpenIDConfig('okta');
      const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

      await driver['getClient']();

      const codeVerifier = driver.generateCodeVerifier();
      const authUrl = await driver.generateAuthUrl(codeVerifier, true);

      expect(authUrl).toBeDefined();
      expect(authUrl).toContain('prompt');
    });

    test('uses custom redirectUri when provided', async () => {
      const config = createOpenIDConfig('okta');
      const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

      await driver['getClient']();

      const codeVerifier = driver.generateCodeVerifier();
      const customRedirectUri = 'http://external.com/auth/login/okta/callback';
      const authUrl = await driver.generateAuthUrl(codeVerifier, false, customRedirectUri);

      expect(authUrl).toBeDefined();
      expect(authUrl).toContain(customRedirectUri);
    });
  });

  describe('getUserID', () => {
    describe('Multi-domain callbacks', () => {
      test('uses getCallbackFromOriginUrl to find correct callback for originUrl', async () => {
        const mockRedirectUris = [
          new URL('http://localhost:8080/auth/login/okta/callback'),
          new URL('http://external.com/auth/login/okta/callback'),
        ];

        vi.mocked(generateRedirectUrls).mockReturnValue(mockRedirectUris);

        const externalCallback = mockRedirectUris[1]!;
        vi.mocked(getCallbackFromOriginUrl).mockReturnValue(externalCallback);

        const config = createOpenIDConfig('okta', {
          defaultRoleId: 'test-role-id',
          identifierKey: 'sub',
        });

        const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

        await driver['getClient']();

        const mockTokenSet = {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
        };

        const mockUserInfo = {
          sub: '12345',
          email: 'test@example.com',
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

        try {
          await driver.getUserID(payload);
        } catch {
          // Ignore errors
        }

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
      const config = createOpenIDConfig('okta');
      const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

      const user = { id: 'user-123' } as any;

      await expect(driver.login(user)).resolves.toBeUndefined();
    });
  });

  describe('refresh', () => {
    test('does nothing when user has no auth_data', async () => {
      const config = createOpenIDConfig('okta');
      const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

      await driver['getClient']();

      const refreshClientSpy = vi.spyOn(driver.client!, 'refresh');

      const user = { id: 'user-123', auth_data: undefined } as any;

      await driver.refresh(user);

      expect(refreshClientSpy).not.toHaveBeenCalled();
    });

    test('does nothing when auth_data has no refreshToken', async () => {
      const config = createOpenIDConfig('okta');
      const driver = new OpenIDAuthDriver({ knex: {} as any }, config);

      await driver['getClient']();

      const refreshClientSpy = vi.spyOn(driver.client!, 'refresh');

      const user = { id: 'user-123', auth_data: { other: 'data' } } as any;

      await driver.refresh(user);

      expect(refreshClientSpy).not.toHaveBeenCalled();
    });

    test('parses auth_data when it is a JSON string', async () => {
      const config = createOpenIDConfig('okta');
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
      const config = createOpenIDConfig('okta');
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
      const config = createOpenIDConfig('okta');
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
      const config = createOpenIDConfig('okta');
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
      const config = createOpenIDConfig('okta');
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
      const config = createOpenIDConfig('okta');
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
});

