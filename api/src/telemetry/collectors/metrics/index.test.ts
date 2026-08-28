import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type {
	CollectionMetrics,
	DashboardMetrics,
	DatabaseMetrics,
	ExtensionBreakdown,
	ExtensionMetrics,
	FileMetrics,
	FlowMetrics,
	RoleMetrics,
	TranslationMetrics,
	UserMetrics,
} from '../../types/report.js';
import { collectMetrics } from './index.js';

const distribution = { min: 0, max: 0, median: 0, mean: 0 };

const extensionsBySource = { count: 0, source: { registry: { count: 0 }, local: { count: 0 }, module: { count: 0 } } };

const extensionBreakdown = (): ExtensionBreakdown => ({
	bundles: { ...extensionsBySource },
	individual: { ...extensionsBySource },
	type: {
		display: { ...extensionsBySource },
		interface: { ...extensionsBySource },
		module: { ...extensionsBySource },
		layout: { ...extensionsBySource },
		panel: { ...extensionsBySource },
		theme: { ...extensionsBySource },
		endpoint: { ...extensionsBySource },
		hook: { ...extensionsBySource },
		operation: { ...extensionsBySource },
		bundle: { ...extensionsBySource },
	},
});

vi.mock('./collections.js', () => ({
	collectCollectionMetrics: vi.fn(
		async (): Promise<CollectionMetrics & { _totalItems: number; _totalFields: number }> => ({
			count: 0,
			shares: { ...distribution },
			fields: { ...distribution },
			items: { ...distribution },
			versioned: { count: 0, items: { ...distribution } },
			archive_app_filter: { count: 0, items: { ...distribution } },
			activity: {
				all: { count: 0, items: { ...distribution } },
				activity: { count: 0, items: { ...distribution } },
				none: { count: 0, items: { ...distribution } },
			},
			_totalItems: 42,
			_totalFields: 7,
		}),
	),
}));

vi.mock('./files.js', () => ({
	collectFileMetrics: vi.fn(
		async (): Promise<FileMetrics> => ({
			count: 0,
			size: { sum: 0, ...distribution },
			types: {},
		}),
	),
}));

vi.mock('./flows.js', () => ({
	collectFlowMetrics: vi.fn(
		async (): Promise<FlowMetrics> => ({
			active: { count: 0 },
			inactive: { count: 0 },
		}),
	),
}));

vi.mock('./roles.js', () => ({
	collectRoleMetrics: vi.fn(
		async (): Promise<RoleMetrics> => ({
			count: 0,
			users: { ...distribution },
			policies: { ...distribution },
			children: { ...distribution },
			depth: { ...distribution },
		}),
	),
}));

vi.mock('./translations.js', () => ({
	collectTranslationMetrics: vi.fn(
		async (): Promise<TranslationMetrics> => ({
			count: 0,
			language: { count: 0, translations: { ...distribution } },
		}),
	),
}));

vi.mock('./users.js', () => ({
	collectUserMetrics: vi.fn(
		async (): Promise<UserMetrics> => ({
			admin: { count: 0 },
			app: { count: 0 },
			api: { count: 0 },
		}),
	),
}));

vi.mock('./dashboards.js', () => ({
	collectDashboardMetrics: vi.fn(
		async (): Promise<DashboardMetrics> => ({
			count: 0,
			panels: { ...distribution },
		}),
	),
}));

vi.mock('./extensions.js', () => ({
	collectExtensionMetrics: vi.fn(
		async (): Promise<ExtensionMetrics> => ({
			active: extensionBreakdown(),
			inactive: extensionBreakdown(),
		}),
	),
}));

vi.mock('./database.js', () => ({
	collectDatabaseMetrics: vi.fn(
		async (): Promise<DatabaseMetrics> => ({
			size: null,
		}),
	),
}));

vi.mock('../../utils/service-count.js', () => ({
	serviceCount: vi.fn(async (): Promise<number> => 0),
}));

describe('collectMetrics', () => {
	const mockDb = {} as Knex;
	const mockSchema = {} as SchemaOverview;

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('returns all metric sections', async () => {
		const result = await collectMetrics(mockDb, mockSchema);

		expect(result).toHaveProperty('collections');
		expect(result).toHaveProperty('shares');
		expect(result).toHaveProperty('items');
		expect(result).toHaveProperty('files');
		expect(result).toHaveProperty('users');
		expect(result).toHaveProperty('roles');
		expect(result).toHaveProperty('policies');
		expect(result).toHaveProperty('fields');
		expect(result).toHaveProperty('flows');
		expect(result).toHaveProperty('translations');
		expect(result).toHaveProperty('dashboards');
		expect(result).toHaveProperty('panels');
		expect(result).toHaveProperty('extensions');
		expect(result).toHaveProperty('database');
	});

	test('leaves api_requests to the report, since reading it resets the counters', async () => {
		const result = await collectMetrics(mockDb, mockSchema);
		expect(result).not.toHaveProperty('api_requests');
	});

	test('strips internal properties from collections', async () => {
		const result = await collectMetrics(mockDb, mockSchema);
		expect(result.collections).not.toHaveProperty('_totalItems');
		expect(result.collections).not.toHaveProperty('_totalFields');
	});

	test('maps _totalItems to items.count', async () => {
		const result = await collectMetrics(mockDb, mockSchema);
		expect(result.items).toStrictEqual({ count: 42 });
	});
});
