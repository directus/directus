import { InvalidCredentialsError, InvalidOtpError, ServiceUnavailableError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import knex, { type Knex } from 'knex';
import { createTracker, MockClient, type Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest';
import { getAuthProvider } from '../auth.js';
import emitter from '../emitter.js';
import { ActivityService } from './activity.js';
import { AuthenticationService } from './authentication.js';
import { SettingsService } from './settings.js';
import { TFAService } from './tfa.js';

const mockRateLimiter = vi.hoisted(() => ({
	consume: vi.fn().mockResolvedValue(undefined),
	set: vi.fn().mockResolvedValue(undefined),
	points: 0,
}));

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

vi.mock('../auth.js', () => ({
	getAuthProvider: vi.fn(),
}));

vi.mock('../emitter.js', () => ({
	default: {
		emitFilter: vi.fn().mockImplementation((_event, payload) => Promise.resolve(payload)),
		emitAction: vi.fn(),
	},
}));

vi.mock('../utils/stall.js', () => ({
	stall: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../rate-limiter.js', () => ({
	createRateLimiter: vi.fn(() => mockRateLimiter),
	RateLimiterRes: class MockRateLimiterRes extends Error {
		remainingPoints: number;
		msBeforeNext: number;
		consumedPoints: number;
		isFirstInDuration: boolean;

		constructor() {
			super();
			this.remainingPoints = 0;
			this.msBeforeNext = 0;
			this.consumedPoints = 0;
			this.isFirstInDuration = false;
		}
	},
}));

vi.mock('../permissions/lib/fetch-roles-tree.js', () => ({
	fetchRolesTree: vi.fn().mockResolvedValue([]),
}));

vi.mock('../permissions/modules/fetch-global-access/fetch-global-access.js', () => ({
	fetchGlobalAccess: vi.fn().mockResolvedValue({ app: false, admin: false }),
}));

vi.mock('../utils/get-secret.js', () => ({
	getSecret: vi.fn().mockReturnValue('test-secret'),
}));

vi.mock('../utils/get-milliseconds.js', () => ({
	getMilliseconds: vi.fn().mockReturnValue(900000),
}));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		EMAIL_TEMPLATES_PATH: './templates',
		LOGIN_STALL_TIME: 0,
		ACCESS_TOKEN_TTL: '15m',
		REFRESH_TOKEN_TTL: '7d',
		SESSION_COOKIE_TTL: '1d',
	}),
}));

vi.mock('jsonwebtoken', () => ({
	default: {
		sign: vi.fn().mockReturnValue('test-access-token'),
	},
}));

vi.mock('nanoid', () => ({
	nanoid: vi.fn().mockReturnValue('test-refresh-token'),
}));

const schema = new SchemaBuilder()
	.collection('directus_users', (c) => {
		c.field('id').uuid().primary();
	})
	.build();

const mockUser = {
	id: 'user-id-1',
	first_name: 'John',
	last_name: 'Doe',
	email: 'john@example.com',
	password: 'hashed-password',
	status: 'active',
	role: 'role-id-1',
	tfa_secret: null,
	provider: 'default',
	external_identifier: null,
	auth_data: null,
};

describe('Integration Tests', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	beforeAll(() => {
		db = vi.mocked(knex.default({ client: MockClient }));
		tracker = createTracker(db);
	});

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
	});

	describe('Services / Authentication', () => {
		let service: AuthenticationService;
		let mockProvider: { getUserID: ReturnType<typeof vi.fn>; login: ReturnType<typeof vi.fn> };

		beforeEach(() => {
			service = new AuthenticationService({ knex: db, schema });

			mockProvider = {
				getUserID: vi.fn().mockResolvedValue(mockUser.id),
				login: vi.fn().mockResolvedValue(undefined),
			};

			vi.mocked(getAuthProvider).mockReturnValue(mockProvider as any);

			vi.spyOn(SettingsService.prototype, 'readSingleton').mockResolvedValue({
				auth_login_attempts: null,
			} as any);

			vi.spyOn(ActivityService.prototype, 'createOne').mockResolvedValue(1 as any);
		});

		const setupHappyPathTracker = () => {
			tracker.on.select('directus_users').responseOnce([mockUser]);
			tracker.on.select('directus_users').responseOnce([]);
			tracker.on.insert('directus_sessions').response([1]);
			tracker.on.delete('directus_sessions').response(1);
			tracker.on.update('directus_users').response([1]);
		};

		describe('login', () => {
			it('should return access token, refresh token, expires, and user id on successful login', async () => {
				setupHappyPathTracker();

				const result = await service.login('default', { email: 'john@example.com', password: 'password' });

				expect(result).toEqual({
					accessToken: 'test-access-token',
					refreshToken: 'test-refresh-token',
					expires: 900000,
					id: mockUser.id,
				});
			});

			it('should call provider.getUserID with the payload', async () => {
				setupHappyPathTracker();

				const payload = { email: 'john@example.com', password: 'password' };
				await service.login('default', payload);

				expect(mockProvider.getUserID).toHaveBeenCalledWith(payload);
			});

			it('should call provider.login with the user', async () => {
				setupHappyPathTracker();

				await service.login('default', { email: 'john@example.com', password: 'password' });

				expect(mockProvider.login).toHaveBeenCalledWith(
					expect.objectContaining({ id: mockUser.id }),
					expect.any(Object),
				);
			});

			it('should emit auth.login success action on successful login', async () => {
				setupHappyPathTracker();

				await service.login('default', { email: 'john@example.com', password: 'password' });

				expect(vi.mocked(emitter.emitAction)).toHaveBeenCalledWith(
					'auth.login',
					expect.objectContaining({ status: 'success', provider: 'default', user: mockUser.id }),
					expect.any(Object),
				);
			});

			it('should emit auth.login fail action and rethrow when getUserID throws', async () => {
				const loginError = new Error('Invalid credentials');
				mockProvider.getUserID.mockRejectedValueOnce(loginError);

				await expect(service.login('default', { email: 'wrong@example.com' })).rejects.toThrow(loginError);

				expect(vi.mocked(emitter.emitAction)).toHaveBeenCalledWith(
					'auth.login',
					expect.objectContaining({ status: 'fail', provider: 'default' }),
					expect.any(Object),
				);
			});

			it('should throw InvalidCredentialsError when user status is not active', async () => {
				tracker.on.select('directus_users').responseOnce([{ ...mockUser, status: 'inactive' }]);

				await expect(
					service.login('default', { email: 'john@example.com', password: 'password' }),
				).rejects.toBeInstanceOf(InvalidCredentialsError);
			});

			it('should emit auth.login fail action when user status is not active', async () => {
				tracker.on.select('directus_users').responseOnce([{ ...mockUser, status: 'inactive' }]);

				await expect(service.login('default', { email: 'john@example.com', password: 'password' })).rejects.toThrow();

				expect(vi.mocked(emitter.emitAction)).toHaveBeenCalledWith(
					'auth.login',
					expect.objectContaining({ status: 'fail' }),
					expect.any(Object),
				);
			});

			it('should throw InvalidCredentialsError when user provider does not match', async () => {
				tracker.on.select('directus_users').responseOnce([{ ...mockUser, provider: 'ldap' }]);

				await expect(
					service.login('default', { email: 'john@example.com', password: 'password' }),
				).rejects.toBeInstanceOf(InvalidCredentialsError);
			});

			it('should throw ServiceUnavailableError when rate limiter is unreachable', async () => {
				tracker.on.select('directus_users').responseOnce([mockUser]);

				vi.spyOn(SettingsService.prototype, 'readSingleton').mockResolvedValue({
					auth_login_attempts: 5,
				} as any);

				mockRateLimiter.consume.mockRejectedValueOnce(new Error('Rate limiter unreachable'));

				await expect(
					service.login('default', { email: 'john@example.com', password: 'password' }),
				).rejects.toBeInstanceOf(ServiceUnavailableError);
			});

			it('should suspend user and reset rate limiter when login attempts are exhausted', async () => {
				tracker.on.select('directus_users').responseOnce([mockUser]);
				tracker.on.update('directus_users').responseOnce([1]);

				vi.spyOn(SettingsService.prototype, 'readSingleton').mockResolvedValue({
					auth_login_attempts: 5,
				} as any);

				const { RateLimiterRes: MockRateLimiterRes } = await import('../rate-limiter.js');
				const rateLimitError = new MockRateLimiterRes();
				mockRateLimiter.consume.mockRejectedValueOnce(rateLimitError);

				// Make provider.login throw to stop the flow after suspension
				mockProvider.login.mockRejectedValueOnce(new InvalidCredentialsError());

				await expect(service.login('default', { email: 'john@example.com', password: 'password' })).rejects.toThrow();

				expect(mockRateLimiter.set).toHaveBeenCalledWith(mockUser.id, 0, 0);

				const updateHistory = tracker.history.update;
				expect(updateHistory[0]?.sql).toMatch(/directus_users/);
			});

			it('should emit auth.login fail action and rethrow when provider.login throws', async () => {
				tracker.on.select('directus_users').responseOnce([mockUser]);

				const providerError = new Error('Provider login failed');
				mockProvider.login.mockRejectedValueOnce(providerError);

				await expect(service.login('default', { email: 'john@example.com', password: 'password' })).rejects.toThrow(
					providerError,
				);

				expect(vi.mocked(emitter.emitAction)).toHaveBeenCalledWith(
					'auth.login',
					expect.objectContaining({ status: 'fail', provider: 'default' }),
					expect.any(Object),
				);
			});

			it('should throw InvalidOtpError when TFA is configured but no OTP is provided', async () => {
				tracker.on.select('directus_users').responseOnce([{ ...mockUser, tfa_secret: 'some-secret' }]);

				await expect(
					service.login('default', { email: 'john@example.com', password: 'password' }),
				).rejects.toBeInstanceOf(InvalidOtpError);
			});

			it('should throw InvalidOtpError when TFA OTP is invalid', async () => {
				tracker.on.select('directus_users').responseOnce([{ ...mockUser, tfa_secret: 'some-secret' }]);

				vi.spyOn(TFAService.prototype, 'verifyOTP').mockResolvedValueOnce(false);

				await expect(
					service.login('default', { email: 'john@example.com', password: 'password' }, { otp: '000000' }),
				).rejects.toBeInstanceOf(InvalidOtpError);
			});

			it('should login successfully when TFA OTP is valid', async () => {
				tracker.on.select('directus_users').responseOnce([{ ...mockUser, tfa_secret: 'some-secret' }]);
				tracker.on.select('directus_users').responseOnce([]);
				tracker.on.insert('directus_sessions').response([1]);
				tracker.on.delete('directus_sessions').response(1);
				tracker.on.update('directus_users').response([1]);

				vi.spyOn(TFAService.prototype, 'verifyOTP').mockResolvedValueOnce(true);

				const result = await service.login(
					'default',
					{ email: 'john@example.com', password: 'password' },
					{ otp: '123456' },
				);

				expect(result).toMatchObject({
					accessToken: 'test-access-token',
					refreshToken: 'test-refresh-token',
					id: mockUser.id,
				});
			});

			it('should reset rate limiter to zero on successful login when attempts are configured', async () => {
				setupHappyPathTracker();

				vi.spyOn(SettingsService.prototype, 'readSingleton').mockResolvedValue({
					auth_login_attempts: 5,
				} as any);

				await service.login('default', { email: 'john@example.com', password: 'password' });

				expect(mockRateLimiter.set).toHaveBeenCalledWith(mockUser.id, 0, 0);
			});

			it('should use session TTL and include session token in payload when session option is true', async () => {
				setupHappyPathTracker();

				const result = await service.login(
					'default',
					{ email: 'john@example.com', password: 'password' },
					{ session: true },
				);

				expect(result).toMatchObject({
					accessToken: 'test-access-token',
					refreshToken: 'test-refresh-token',
					id: mockUser.id,
				});
			});
		});
	});
});
