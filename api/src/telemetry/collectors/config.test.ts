import { afterEach, describe, expect, test, vi } from 'vitest';
import { collectConfig } from './config.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

vi.mock('./config/auth.js', () => ({
	collectAuthProviders: vi.fn().mockReturnValue({ providers: ['local'], issuers: [] }),
}));

vi.mock('./config/cache.js', () => ({
	collectCache: vi.fn().mockReturnValue({ enabled: false, store: null }),
}));

vi.mock('./config/database.js', () => ({
	collectDatabase: vi.fn().mockResolvedValue({ driver: 'postgres', version: '16.0' }),
}));

vi.mock('./config/email.js', () => ({
	collectEmail: vi.fn().mockReturnValue({ transport: null }),
}));

vi.mock('./config/extensions.js', () => ({
	collectExtensionsConfig: vi.fn().mockReturnValue({ must_load: false, auto_reload: false, cache_ttl: null, limit: null, rolldown: false }),
}));

vi.mock('./config/marketplace.js', () => ({
	collectMarketplace: vi.fn().mockReturnValue({ enabled: false }),
}));

vi.mock('./config/pm2.js', () => ({
	collectPm2: vi.fn().mockReturnValue({ instances: 0 }),
}));

vi.mock('./config/prometheus.js', () => ({
	collectPrometheus: vi.fn().mockReturnValue(false),
}));

vi.mock('./config/rate-limit.js', () => ({
	collectRateLimit: vi.fn().mockReturnValue({ enabled: false, pressure: false, email: false, email_flows: false }),
}));

vi.mock('./config/retention.js', () => ({
	collectRetention: vi.fn().mockReturnValue({ enabled: false, activity: null, revisions: null, flow_logs: null }),
}));

vi.mock('./config/storage.js', () => ({
	collectStorage: vi.fn().mockReturnValue({ drivers: ['local'] }),
}));

vi.mock('./config/sync.js', () => ({
	collectSyncStore: vi.fn().mockReturnValue({ store: null }),
}));

vi.mock('./config/websocket.js', () => ({
	collectWebsocket: vi.fn().mockReturnValue({ enabled: false, rest: false, graphql: false, logs: false }),
}));

import type { Knex } from 'knex';

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectConfig', () => {
	const mockDb = {} as Knex;

	test('returns all config sections', async () => {
		const result = await collectConfig(mockDb);

		expect(result).toHaveProperty('auth');
		expect(result).toHaveProperty('ai');
		expect(result).toHaveProperty('mcp');
		expect(result).toHaveProperty('cache');
		expect(result).toHaveProperty('database');
		expect(result).toHaveProperty('email');
		expect(result).toHaveProperty('extensions');
		expect(result).toHaveProperty('marketplace');
		expect(result).toHaveProperty('storage');
		expect(result).toHaveProperty('retention');
		expect(result).toHaveProperty('websockets');
		expect(result).toHaveProperty('prometheus');
		expect(result).toHaveProperty('rate_limiting');
		expect(result).toHaveProperty('synchronization');
		expect(result).toHaveProperty('pm2');
	});

	test('defaults ai and mcp to false', async () => {
		const result = await collectConfig(mockDb);
		expect(result.ai).toBe(false);
		expect(result.mcp).toBe(false);
	});
});
