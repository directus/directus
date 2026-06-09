import { useEnv } from '@directus/env';
import knex, { type Knex } from 'knex';
import { createTracker, MockClient, type Tracker } from 'knex-mock-client';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ServerService } from './server.js';

const mockEnv = vi.hoisted(() => ({
	EMAIL_TEMPLATES_PATH: './templates',
	MCP_ENABLED: true,
	AI_ENABLED: true,
	MCP_OAUTH_ENABLED: true,
	MCP_OAUTH_DCR_ENABLED: false,
	MCP_OAUTH_CIMD_ENABLED: true,
}));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => mockEnv),
}));

vi.mock('./settings.js', () => ({
	SettingsService: vi.fn().mockImplementation(() => ({
		readSingleton: vi.fn().mockResolvedValue({ project_name: 'Directus' }),
	})),
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

		Object.assign(mockEnv, {
			EMAIL_TEMPLATES_PATH: './templates',
			MCP_ENABLED: true,
			AI_ENABLED: true,
			MCP_OAUTH_ENABLED: true,
			MCP_OAUTH_DCR_ENABLED: false,
			MCP_OAUTH_CIMD_ENABLED: true,
		});

		vi.mocked(useEnv).mockReturnValue(mockEnv as any);
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
});
