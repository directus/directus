import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock openid-client first with inline mock
vi.mock('openid-client', () => ({
	Issuer: {
		discover: vi.fn().mockResolvedValue({
			Client: vi.fn().mockReturnValue({
				authorizationUrl: vi.fn().mockReturnValue('https://auth.example.com/auth'),
				callback: vi.fn().mockResolvedValue({
					access_token: 'token',
					id_token: 'id_token',
					refresh_token: 'refresh_token',
					claims: vi.fn().mockReturnValue({
						sub: 'user123',
						email: 'test@example.com',
						name: 'Test User',
					}),
				}),
				userinfo: vi.fn().mockResolvedValue({
					sub: 'user123',
					email: 'test@example.com',
					name: 'Test User',
				}),
				refresh: vi.fn().mockResolvedValue({
					access_token: 'new_token',
					refresh_token: 'new_refresh_token',
				}),
				issuer: {
					metadata: {
						userinfo_endpoint: 'https://auth.example.com/userinfo',
					},
				},
			}),
			metadata: {
				issuer: 'https://auth.example.com',
				response_types_supported: ['code'],
			},
		}),
	},
	generators: {
		codeVerifier: vi.fn().mockReturnValue('mock-verifier'),
		codeChallenge: vi.fn().mockReturnValue('mock-challenge'),
		state: vi.fn().mockReturnValue('mock-state'),
	},
	custom: {
		setHttpOptionsDefaults: vi.fn(),
	},
	errors: {
		OPError: class extends Error {
			error = 'op_error';
		},
		RPError: class extends Error {},
	},
}));

// Mock all other dependencies
vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => ({
		SECRET: 'test-secret',
		PUBLIC_URL: 'http://localhost:8055',
	})),
}));

vi.mock('../../database/index.js', () => ({ default: vi.fn(() => ({})) }));

vi.mock('../../emitter.js', () => ({
	default: {
		emit: vi.fn(),
		emitFilter: vi.fn().mockResolvedValue({}),
	},
}));

vi.mock('../../logger/index.js', () => ({
	useLogger: vi.fn(() => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() })),
}));

vi.mock('../../auth.js', () => ({ getAuthProvider: vi.fn(() => 'openid') }));
vi.mock('../../services/authentication.js', () => ({ AuthenticationService: vi.fn(() => ({})) }));

vi.mock('../../services/users.js', () => ({
	UsersService: vi.fn(() => ({ getUserByEmail: vi.fn(), createOne: vi.fn(), updateOne: vi.fn() })),
}));

vi.mock('../../utils/get-secret.js', () => ({ getSecret: vi.fn(() => 'mock-secret') }));
vi.mock('../../utils/jwt.js', () => ({ verifyJWT: vi.fn() }));

vi.mock('../../permissions/utils/create-default-accountability.js', () => ({
	createDefaultAccountability: vi.fn(() => ({})),
}));

vi.mock('../../utils/get-config-from-env.js', () => ({ getConfigFromEnv: vi.fn(() => 'mock-value') }));
vi.mock('../../utils/get-ip-from-req.js', () => ({ getIPFromReq: vi.fn(() => '127.0.0.1') }));
vi.mock('../../utils/is-login-redirect-allowed.js', () => ({ isLoginRedirectAllowed: vi.fn(() => true) }));

vi.mock('../../utils/url.js', () => ({
	Url: class {
		constructor() {}
		toString() {
			return 'http://localhost:8055/auth/login/provider/callback';
		}

		addPath() {
			return this;
		}
	},
}));

vi.mock('./local.js', () => ({
	LocalAuthDriver: class {
		constructor() {}
	},
}));

vi.mock('../../middleware/respond.js', () => ({ respond: vi.fn() }));
vi.mock('../../utils/async-handler.js', () => ({ default: vi.fn((fn) => fn) }));
vi.mock('../../constants.js', () => ({ REFRESH_COOKIE_OPTIONS: {}, SESSION_COOKIE_OPTIONS: {} }));

vi.mock('express', () => ({
	default: { Router: vi.fn(() => ({ get: vi.fn(), post: vi.fn() })) },
	Router: vi.fn(() => ({ get: vi.fn(), post: vi.fn() })),
}));

vi.mock('flat', () => ({ flatten: vi.fn((obj) => obj) }));
vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn(), sign: vi.fn() } }));

vi.mock('@directus/utils', () => ({
	parseJSON: vi.fn((str) => JSON.parse(str)),
	toArray: vi.fn((val) => (Array.isArray(val) ? val : [val])),
}));

vi.mock('@directus/errors', () => ({
	InvalidCredentialsError: class extends Error {},
	InvalidPayloadError: class extends Error {},
	InvalidProviderConfigError: class extends Error {},
	InvalidProviderError: class extends Error {},
	InvalidTokenError: class extends Error {},
	ServiceUnavailableError: class extends Error {},
	isDirectusError: vi.fn(() => false),
}));

// Import the actual driver after mocking
import { OpenIDAuthDriver } from './openid.js';

describe('OpenID Driver Coverage Tests', () => {
	let driver: OpenIDAuthDriver;
	interface MockConfig {
		clientId: string;
		clientSecret: string;
		issuerUrl: string;
		provider: string;
	}

	let mockConfig: MockConfig;
	let mockOptions: any;

	beforeEach(() => {
		vi.clearAllMocks();

		mockOptions = {
			knex: {
				client: { config: { client: 'better-sqlite3' } },
				raw: vi.fn().mockResolvedValue({ rows: [] }),
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				where: vi.fn().mockReturnThis(),
				whereRaw: vi.fn().mockReturnThis(),
				first: vi.fn().mockResolvedValue(null),
			},
			accountability: { admin: false, role: null, user: null },
		};

		mockConfig = {
			clientId: 'test-client-id',
			clientSecret: 'test-client-secret',
			issuerUrl: 'https://auth.example.com',
			provider: 'test-provider',
		};

		driver = new OpenIDAuthDriver(mockOptions, mockConfig);
		// Override the knex instance with our mock
		driver.knex = mockOptions.knex;
	});

	it('should initialize with valid configuration', () => {
		expect(driver).toBeInstanceOf(OpenIDAuthDriver);
		expect(driver.config).toEqual(mockConfig);
	});

	it('should throw error for missing clientId', () => {
		const invalidConfig = { ...mockConfig };
		delete invalidConfig.clientId;

		expect(() => new OpenIDAuthDriver(mockOptions, invalidConfig)).toThrow(Error);
	});

	it('should generate code verifier', () => {
		const verifier = driver.generateCodeVerifier();
		expect(verifier).toBe('mock-verifier');
	});

	it('should generate auth URL', async () => {
		const url = await driver.generateAuthUrl('verifier', false);
		expect(url).toBe('https://auth.example.com/auth');
	});

	it('should get user ID', async () => {
		// Mock the database query to return an existing user
		mockOptions.knex.select.mockReturnValue({
			from: vi.fn().mockReturnValue({
				whereRaw: vi.fn().mockReturnValue({
					first: vi.fn().mockResolvedValue({ id: 'existing-user-123' }),
				}),
			}),
		});

		const userInfo = {
			sub: 'user123',
			code: 'auth-code',
			codeVerifier: 'verifier',
			state: 'state',
		};

		const userID = await driver.getUserID(userInfo);
		expect(userID).toBe('existing-user-123');
	});

	it('should handle login', async () => {
		const mockUser = {
			id: 'user-id',
			email: 'test@example.com',
		};

		await driver.login(mockUser as any);
		// Just test that it doesn't throw
		expect(true).toBe(true);
	});

	it('should handle refresh', async () => {
		const mockUser = {
			id: 'user-id',
			email: 'test@example.com',
		};

		await driver.refresh(mockUser as any);
		// Just test that it doesn't throw
		expect(true).toBe(true);
	});
});
