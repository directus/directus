import type { Knex } from 'knex';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { TelemetryConfig } from '../types/report.js';
import { collectConfig } from './config.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

vi.mock('./config/ai.js', () => ({
	collectAi: vi.fn((): TelemetryConfig['ai'] => ({
		enabled: false,
		devtools: false,
		telemetry: { enabled: false, provider: null },
	})),
}));

vi.mock('./config/assets.js', () => ({
	collectAssets: vi.fn((): TelemetryConfig['assets'] => ({
		transform_max_concurrent: 25,
		image_max_dimension: 6000,
		image_max_output_dimension: 6000,
	})),
}));

vi.mock('./config/auth.js', () => ({
	collectAuthProviders: vi.fn((): TelemetryConfig['auth'] => ({ providers: ['local'], issuers: [] })),
}));

vi.mock('./config/cache.js', () => ({
	collectCache: vi.fn((): TelemetryConfig['cache'] => ({ enabled: false, store: 'memory', schema_freeze: false })),
}));

vi.mock('./config/cors.js', () => ({
	collectCors: vi.fn((): TelemetryConfig['cors'] => ({ enabled: false })),
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
		storage_max_concurrency: 20,
	})),
}));

vi.mock('./config/files.js', () => ({
	collectFilesConfig: vi.fn((): TelemetryConfig['files'] => ({
		max_upload_size: null,
		import_max_file_size: '50mb',
	})),
}));

vi.mock('./config/flows.js', () => ({
	collectFlowsConfig: vi.fn((): TelemetryConfig['flows'] => ({
		run_script_timeout: 10000,
		run_script_max_memory: null,
	})),
}));

vi.mock('./config/graphql.js', () => ({
	collectGraphql: vi.fn((): TelemetryConfig['graphql'] => ({ introspection: true, single_use_mutations: 12 })),
}));

vi.mock('./config/healthcheck.js', () => ({
	collectHealthcheck: vi.fn((): TelemetryConfig['healthcheck'] => ({ enabled: true })),
}));

vi.mock('./config/license.js', () => ({
	collectLicenseConfig: vi.fn((): TelemetryConfig['license'] => ({ key_management: true })),
}));

vi.mock('./config/marketplace.js', () => ({
	collectMarketplace: vi.fn((): TelemetryConfig['marketplace'] => ({ trust: 'sandbox', registry: 'default' })),
}));

vi.mock('./config/mcp.js', () => ({
	collectMcp: vi.fn((): TelemetryConfig['mcp'] => ({
		enabled: false,
		oauth: { enabled: false, dcr: false, cimd: false },
	})),
}));

vi.mock('./config/openapi.js', () => ({
	collectOpenapi: vi.fn((): TelemetryConfig['openapi'] => ({ enabled: true })),
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

vi.mock('./config/redis.js', () => ({
	collectRedis: vi.fn((): TelemetryConfig['redis'] => ({ enabled: false })),
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

vi.mock('./config/telemetry.js', () => ({
	collectTelemetryConfig: vi.fn((): TelemetryConfig['telemetry'] => ({ enabled: true, project_owner: true })),
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

	test('returns every config section', async () => {
		const result = await collectConfig(mockDb);

		expect(Object.keys(result).sort()).toStrictEqual([
			'ai',
			'assets',
			'auth',
			'cache',
			'cors',
			'database',
			'email',
			'extensions',
			'files',
			'flows',
			'graphql',
			'healthcheck',
			'license',
			'marketplace',
			'mcp',
			'openapi',
			'pm2',
			'prometheus',
			'rate_limiting',
			'redis',
			'retention',
			'storage',
			'synchronization',
			'telemetry',
			'websockets',
		]);
	});

	test('passes each collector through unchanged', async () => {
		const result = await collectConfig(mockDb);

		expect(result.ai).toStrictEqual({ enabled: false, devtools: false, telemetry: { enabled: false, provider: null } });
		expect(result.mcp).toStrictEqual({ enabled: false, oauth: { enabled: false, dcr: false, cimd: false } });
		expect(result.cache).toStrictEqual({ enabled: false, store: 'memory', schema_freeze: false });
		expect(result.telemetry).toStrictEqual({ enabled: true, project_owner: true });
		expect(result.license).toStrictEqual({ key_management: true });
		expect(result.graphql).toStrictEqual({ introspection: true, single_use_mutations: 12 });
	});
});
