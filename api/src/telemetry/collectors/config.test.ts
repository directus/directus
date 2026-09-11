import type { Knex } from 'knex';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { TelemetryConfig } from '../types/report.js';
import { collectConfig } from './config.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

vi.mock('./config/auth.js', () => ({
	collectAuthProviders: vi.fn((): TelemetryConfig['auth'] => ({ providers: ['local'], issuers: [] })),
}));

vi.mock('./config/cache.js', () => ({
	collectCache: vi.fn((): TelemetryConfig['cache'] => ({ enabled: false, store: 'memory' })),
}));

vi.mock('./config/database.js', () => ({
	collectDatabase: vi.fn(async (): Promise<TelemetryConfig['database']> => ({ driver: 'postgres', version: '16.0' })),
}));

vi.mock('./config/email.js', () => ({
	collectEmail: vi.fn((): TelemetryConfig['email'] => ({ transport: 'sendmail' })),
}));

vi.mock('./config/extensions.js', () => ({
	collectExtensionsConfig: vi.fn((): TelemetryConfig['extensions'] => ({
		must_load: false,
		auto_reload: false,
		cache_ttl: null,
		limit: null,
		rolldown: false,
	})),
}));

vi.mock('./config/marketplace.js', () => ({
	collectMarketplace: vi.fn((): TelemetryConfig['marketplace'] => ({ trust: 'sandbox', registry: 'default' })),
}));

vi.mock('./config/pm2.js', () => ({
	collectPm2: vi.fn((): TelemetryConfig['pm2'] => ({ instances: 0 })),
}));

vi.mock('./config/prometheus.js', () => ({
	collectPrometheus: vi.fn((): TelemetryConfig['prometheus'] => ({ enabled: false })),
}));

vi.mock('./config/rate-limit.js', () => ({
	collectRateLimit: vi.fn((): TelemetryConfig['rate_limiting'] => ({
		enabled: false,
		pressure: false,
		email: false,
		email_flows: false,
	})),
}));

vi.mock('./config/retention.js', () => ({
	collectRetention: vi.fn((): TelemetryConfig['retention'] => ({
		enabled: false,
		activity: '90d',
		revisions: '90d',
		flow_logs: '90d',
	})),
}));

vi.mock('./config/storage.js', () => ({
	collectStorage: vi.fn((): TelemetryConfig['storage'] => ({ drivers: ['local'] })),
}));

vi.mock('./config/sync.js', () => ({
	collectSyncStore: vi.fn((): TelemetryConfig['synchronization'] => ({ store: 'memory' })),
}));

vi.mock('./config/websocket.js', () => ({
	collectWebsocket: vi.fn((): TelemetryConfig['websockets'] => ({
		enabled: false,
		rest: false,
		graphql: false,
		logs: false,
	})),
}));

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectConfig', () => {
	const mockDb = {} as Knex;

	test('returns all config sections', async () => {
		const result = await collectConfig(mockDb);

		expect(result).toStrictEqual({
			auth: { providers: ['local'], issuers: [] },
			ai: { enabled: false },
			mcp: { enabled: false },
			cache: { enabled: false, store: 'memory' },
			database: { driver: 'postgres', version: '16.0' },
			email: { transport: 'sendmail' },
			extensions: { must_load: false, auto_reload: false, cache_ttl: null, limit: null, rolldown: false },
			marketplace: { trust: 'sandbox', registry: 'default' },
			storage: { drivers: ['local'] },
			retention: { enabled: false, activity: '90d', revisions: '90d', flow_logs: '90d' },
			websockets: { enabled: false, rest: false, graphql: false, logs: false },
			prometheus: { enabled: false },
			rate_limiting: { enabled: false, pressure: false, email: false, email_flows: false },
			synchronization: { store: 'memory' },
			pm2: { instances: 0 },
		});
	});

	test('defaults ai and mcp to false', async () => {
		const result = await collectConfig(mockDb);

		expect(result.ai).toStrictEqual({
			enabled: false,
		});

		expect(result.mcp).toStrictEqual({
			enabled: false,
		});
	});
});
