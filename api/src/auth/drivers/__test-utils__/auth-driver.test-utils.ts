/**
 * Base environment variables
 */
export const BASE_MOCK_ENV = {
  PUBLIC_URL: 'http://localhost:8080',
  REFRESH_TOKEN_COOKIE_DOMAIN: '',
  REFRESH_TOKEN_TTL: '7d',
  REFRESH_TOKEN_COOKIE_SECURE: false,
  REFRESH_TOKEN_COOKIE_SAME_SITE: 'lax',
  SESSION_COOKIE_DOMAIN: '',
  SESSION_COOKIE_TTL: '1d',
  SESSION_COOKIE_SECURE: false,
  SESSION_COOKIE_SAME_SITE: 'lax',
  SESSION_COOKIE_NAME: 'directus_session_token',
  REFRESH_TOKEN_COOKIE_NAME: 'directus_refresh_token',
  IP_TRUST_PROXY: false,
  EMAIL_TEMPLATES_PATH: './templates',
  EXTENSIONS_PATH: './extensions',
};

export const createMockEnv = (overrides: Record<string, any> = {}) => ({
  ...BASE_MOCK_ENV,
  ...overrides,
});

/**
 * Base OAuth2 config for testing
 */
export const createOAuth2Config = (provider: string, overrides: Record<string, any> = {}) => ({
  provider,
  authorizeUrl: `https://${provider}.com/oauth/authorize`,
  accessUrl: `https://${provider}.com/oauth/token`,
  profileUrl: `https://${provider}.com/user`,
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  ...overrides,
});

/**
 * Base OpenID config for testing
 */
export const createOpenIDConfig = (provider: string, overrides: Record<string, any> = {}) => ({
  provider,
  issuerUrl: `https://${provider}.example.com`,
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  issuerDiscoveryMustSucceed: false, // Don't exit process on discovery failure in tests
  ...overrides,
});

