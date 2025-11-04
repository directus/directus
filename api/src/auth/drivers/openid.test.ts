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

let mockLogger: ReturnType<typeof createMockLogger>;

beforeEach(() => {
  mockLogger = createMockLogger();
  vi.mocked(useLogger).mockReturnValue(mockLogger);
  vi.mocked(useEnv).mockReturnValue(createMockEnv());
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('OpenIDAuthDriver', () => {
  describe('Constructor - Multi-domain OAuth callbacks', () => {
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

      const options = createMockAuthDriverOptions();
      const config = createOpenIDConfig('okta');

      const driver = new OpenIDAuthDriver(options, config);

      // Verify generateRedirectUrls was called with correct params
      expect(generateRedirectUrls).toHaveBeenCalledWith('okta', 'OpenID');

      // Verify redirectUris property is set
      expect(driver.redirectUris).toEqual(mockRedirectUris);
      expect(driver.redirectUris).toHaveLength(2);
    });

    test('sets empty redirectUris when no REDIRECT_ALLOW_LIST', () => {
      vi.mocked(generateRedirectUrls).mockReturnValue([]);
      vi.mocked(useEnv).mockReturnValue(createMockEnv());

      const options = createMockAuthDriverOptions();
      const config = createOpenIDConfig('okta');

      const driver = new OpenIDAuthDriver(options, config);

      expect(driver.redirectUris).toEqual([]);
    });

    test('throws InvalidProviderConfigError when required config missing', () => {
      const options = createMockAuthDriverOptions();

      const invalidConfig = {
        provider: 'okta',
        // Missing issuerUrl, clientId, clientSecret
      };

      expect(() => new OpenIDAuthDriver(options, invalidConfig as any)).toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith('Invalid provider config');
    });

    test('logs and throws when roleMapping is an Array instead of Object', () => {
      vi.mocked(generateRedirectUrls).mockReturnValue([]);

      const options = createMockAuthDriverOptions();

      const config = createOpenIDConfig('okta', {
        roleMapping: ['role1', 'role2'], // Invalid: should be object
      });

      expect(() => new OpenIDAuthDriver(options, config)).toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('[OpenID] Expected a JSON-Object as role mapping'),
      );
    });

    test('initializes with client=null and preloads client asynchronously', () => {
      vi.mocked(generateRedirectUrls).mockReturnValue([]);

      const options = createMockAuthDriverOptions();
      const config = createOpenIDConfig('okta');

      const driver = new OpenIDAuthDriver(options, config);

      // OpenID initializes client as null and preloads it
      expect(driver.client).toBeNull();
    });
  });

  describe('generateCodeVerifier', () => {
    test('returns a code verifier string', () => {
      vi.mocked(generateRedirectUrls).mockReturnValue([]);

      const options = createMockAuthDriverOptions();
      const config = createOpenIDConfig('okta');
      const driver = new OpenIDAuthDriver(options, config);

      const verifier = driver.generateCodeVerifier();

      expect(verifier).toBe('test-code-verifier'); // From our mock
      expect(typeof verifier).toBe('string');
    });
  });

  describe('generateAuthUrl', () => {
    test('generates authorization URL without redirectUri parameter', async () => {
      vi.mocked(generateRedirectUrls).mockReturnValue([
        new URL('http://localhost:8080/auth/login/okta/callback'),
      ]);

      const options = createMockAuthDriverOptions();
      const config = createOpenIDConfig('okta');
      const driver = new OpenIDAuthDriver(options, config);

      // Wait for client to be ready
      await driver['getClient']();

      const codeVerifier = driver.generateCodeVerifier();
      const authUrl = await driver.generateAuthUrl(codeVerifier, false);

      expect(authUrl).toBeDefined();
      expect(typeof authUrl).toBe('string');
      expect(authUrl).toContain('https://test.com/authorize');
    });

    test('generates authorization URL with custom redirectUri parameter', async () => {
      vi.mocked(generateRedirectUrls).mockReturnValue([
        new URL('http://localhost:8080/auth/login/okta/callback'),
        new URL('http://external.com/auth/login/okta/callback'),
      ]);

      const options = createMockAuthDriverOptions();
      const config = createOpenIDConfig('okta');
      const driver = new OpenIDAuthDriver(options, config);

      await driver['getClient']();

      const codeVerifier = driver.generateCodeVerifier();
      const customRedirectUri = 'http://external.com/auth/login/okta/callback';
      const authUrl = await driver.generateAuthUrl(codeVerifier, false, customRedirectUri);

      expect(authUrl).toBeDefined();
      expect(authUrl).toContain('https://test.com/authorize');
      // The mock captures the redirectUri in the params
      expect(authUrl).toContain(customRedirectUri);
    });

    test('includes prompt parameter when prompt=true', async () => {
      vi.mocked(generateRedirectUrls).mockReturnValue([]);

      const options = createMockAuthDriverOptions();
      const config = createOpenIDConfig('okta');
      const driver = new OpenIDAuthDriver(options, config);

      await driver['getClient']();

      const codeVerifier = driver.generateCodeVerifier();
      const authUrl = await driver.generateAuthUrl(codeVerifier, true);

      expect(authUrl).toBeDefined();
      // The mock serializes params as JSON, so we can check for prompt
      expect(authUrl).toContain('prompt');
    });
  });

  describe('getUserID - Multi-domain OAuth callbacks', () => {
    test('uses getCallbackFromOriginUrl to find correct callback for originUrl', async () => {
      const mockRedirectUris = [
        new URL('http://localhost:8080/auth/login/okta/callback'),
        new URL('http://external.com/auth/login/okta/callback'),
      ];

      vi.mocked(generateRedirectUrls).mockReturnValue(mockRedirectUris);

      // Mock getCallbackFromOriginUrl to return the external callback
      const externalCallback = mockRedirectUris[1]!;
      vi.mocked(getCallbackFromOriginUrl).mockReturnValue(externalCallback);

      const options = createMockAuthDriverOptions();

      const config = createOpenIDConfig('okta', {
        defaultRoleId: 'test-role-id',
        emailKey: 'email',
        identifierKey: 'sub',
      });

      const driver = new OpenIDAuthDriver(options, config);

      // Wait for client initialization
      await driver['getClient']();

      // Mock the client methods
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

      // Mock fetchUserId to return undefined (user doesn't exist yet)
      vi.spyOn(driver as any, 'fetchUserId').mockResolvedValue(undefined);

      // Mock getUsersService to allow user creation
      vi.spyOn(driver as any, 'getUsersService').mockReturnValue({
        createOne: vi.fn().mockResolvedValue('new-user-id'),
      });

      const payload = {
        code: 'test-code',
        codeVerifier: 'test-verifier',
        state: 'test-state',
        originUrl: 'http://external.com', // User came from external domain
      };

      try {
        await driver.getUserID(payload);
      } catch (e) {
        // getUserID might throw if user creation fails, but we're testing the callback logic
      }

      // Verify getCallbackFromOriginUrl was called with correct params
      expect(getCallbackFromOriginUrl).toHaveBeenCalledWith(mockRedirectUris, 'http://external.com');

      // Verify callback was called with the correct callback URL
      expect(driver.client!.callback).toHaveBeenCalledWith(
        externalCallback.toString(),
        expect.any(Object),
        expect.any(Object),
      );
    });

    test('handles legacy case when originUrl is undefined', async () => {
      const mockRedirectUris = [new URL('http://localhost:8080/auth/login/okta/callback')];

      vi.mocked(generateRedirectUrls).mockReturnValue(mockRedirectUris);

      // Mock getCallbackFromOriginUrl to return first callback for undefined originUrl
      vi.mocked(getCallbackFromOriginUrl).mockReturnValue(mockRedirectUris[0]!);

      const options = createMockAuthDriverOptions();

      const config = createOpenIDConfig('okta', {
        defaultRoleId: 'test-role-id',
        emailKey: 'email',
        identifierKey: 'sub',
      });

      const driver = new OpenIDAuthDriver(options, config);
      await driver['getClient']();

      // Mock the client methods
      const mockTokenSet = {
        access_token: 'test-access-token',
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
        // No originUrl - legacy flow
      };

      try {
        await driver.getUserID(payload);
      } catch (e) {
        // Ignore errors, we're just testing the callback logic
      }

      // Verify getCallbackFromOriginUrl was called with undefined
      expect(getCallbackFromOriginUrl).toHaveBeenCalledWith(mockRedirectUris, undefined);

      // Verify callback was called with PUBLIC_URL callback
      expect(driver.client!.callback).toHaveBeenCalledWith(
        mockRedirectUris[0]!.toString(),
        expect.any(Object),
        expect.any(Object),
      );
    });
  });
});

