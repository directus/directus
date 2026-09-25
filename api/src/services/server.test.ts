import { useEnv } from '@directus/env';
import knex, { type Knex } from 'knex';
import { createTracker, MockClient, type Tracker } from 'knex-mock-client';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import getMailer from '../mailer.js';
import { mockEnv } from '../test-utils/env.js';
import { ServerService } from './server.js';

// Shared object rather than a fixed return value, so individual tests can amend it in place. The
// factory seeds it with the test defaults, which several modules read as they're imported.
const testEnv = vi.hoisted(() => ({}) as Record<string, unknown>);

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../test-utils/env.js');
	Object.assign(testEnv, mockEnv());
	return { useEnv: vi.fn(() => testEnv) };
});

vi.mock('./settings.js', () => ({
	SettingsService: vi.fn().mockImplementation(function () {
		return {
			readSingleton: vi.fn().mockResolvedValue({ project_name: 'Directus' }),
		};
	}),
}));

vi.mock('../cache.js', () => ({
	getCache: vi.fn(),
}));

vi.mock('../database/index.js', () => ({
	default: vi.fn(),
	hasDatabaseConnection: vi.fn(),
}));

vi.mock('../logger/index.js', () => ({
	useLogger: vi.fn(() => ({
		debug: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
	})),
}));

vi.mock('../mailer.js', () => ({
	default: vi.fn(),
}));

vi.mock('../middleware/rate-limiter-global.js', () => ({
	rateLimiterGlobal: vi.fn(),
}));

vi.mock('../middleware/rate-limiter-ip.js', () => ({
	rateLimiter: vi.fn(),
}));

vi.mock('../storage/index.js', () => ({
	getStorage: vi.fn(),
}));

describe('ServerService', () => {
	let db: Knex;
	let tracker: Tracker;

	beforeEach(() => {
		db = knex({ client: MockClient });
		tracker = createTracker(db);

		Object.assign(
			testEnv,
			mockEnv({
				PROJECT_OWNER_ENABLED: true,
				MCP_ENABLED: true,
				AI_ENABLED: true,
				MCP_OAUTH_ENABLED: true,
				MCP_OAUTH_DCR_ENABLED: false,
				MCP_OAUTH_CIMD_ENABLED: true,
			}),
		);

		vi.mocked(useEnv).mockReturnValue(testEnv as any);
	});

	test('health reports an email error when the transport cannot be built', async () => {
		Object.assign(testEnv, { HEALTHCHECK_SERVICES: ['email'], EMAIL_VERIFY_SETUP: true });

		vi.mocked(getMailer).mockImplementation(() => {
			throw new Error('The EMAIL_MAILTRAP_TOKEN env var is required for the mailtrap transport');
		});

		const service = new ServerService({
			knex: db,
			schema: {} as any,
			accountability: { user: 'user-id', admin: true } as any,
		});

		const health = (await service.health()) as any;

		expect(health.status).toBe('error');
		expect(health.checks['email:connection'][0].status).toBe('error');
	});

	test('serverInfo includes MCP OAuth env capability flags for authenticated users', async () => {
		tracker.on.select('directus_users').response([{ id: 'user-id' }]);

		const service = new ServerService({
			knex: db,
			schema: {} as any,
			accountability: { user: 'user-id', admin: false } as any,
		});

		const info = await service.serverInfo();

		expect(info['mcp_oauth_enabled']).toBe(true);
		expect(info['mcp_oauth_dcr_enabled']).toBe(false);
		expect(info['mcp_oauth_cimd_enabled']).toBe(true);
	});

	test('serverInfo defaults project_owner_enabled to true for authenticated users', async () => {
		tracker.on.select('directus_users').response([{ id: 'user-id' }]);

		const service = new ServerService({
			knex: db,
			schema: {} as any,
			accountability: { user: 'user-id', admin: false } as any,
		});

		const info = await service.serverInfo();

		expect(info['project_owner_enabled']).toBe(true);
	});

	test('serverInfo respects PROJECT_OWNER_ENABLED=false for authenticated users', async () => {
		Object.assign(testEnv, { PROJECT_OWNER_ENABLED: false });

		tracker.on.select('directus_users').response([{ id: 'user-id' }]);

		const service = new ServerService({
			knex: db,
			schema: {} as any,
			accountability: { user: 'user-id', admin: false } as any,
		});

		const info = await service.serverInfo();

		expect(info['project_owner_enabled']).toBe(false);
	});
});
