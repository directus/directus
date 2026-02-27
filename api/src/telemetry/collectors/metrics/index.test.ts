import { afterEach, describe, expect, test, vi } from 'vitest';
import { collectMetrics } from './index.js';

vi.mock('./api-requests.js', () => ({
	collectApiRequestMetrics: vi.fn().mockResolvedValue({
		count: 0,
		cached: { count: 0 },
		method: { get: { count: 0 }, post: { count: 0 }, put: { count: 0 }, patch: { count: 0 }, delete: { count: 0 } },
	}),
}));

vi.mock('./collections.js', () => ({
	collectCollectionMetrics: vi.fn().mockResolvedValue({
		count: 0,
		shares: { min: 0, max: 0, median: 0, mean: 0 },
		fields: { min: 0, max: 0, median: 0, mean: 0 },
		items: { min: 0, max: 0, median: 0, mean: 0 },
		versioned: { count: 0, items: { min: 0, max: 0, median: 0, mean: 0 } },
		archive_app_filter: { count: 0, items: { min: 0, max: 0, median: 0, mean: 0 } },
		activity: {
			all: { count: 0, items: { min: 0, max: 0, median: 0, mean: 0 } },
			activity: { count: 0, items: { min: 0, max: 0, median: 0, mean: 0 } },
			none: { count: 0, items: { min: 0, max: 0, median: 0, mean: 0 } },
		},
		_totalItems: 0,
		_totalFields: 0,
	}),
}));

vi.mock('./files.js', () => ({
	collectFileMetrics: vi.fn().mockResolvedValue({ count: 0, size: { sum: 0, min: 0, max: 0, median: 0, mean: 0 }, types: {} }),
}));

vi.mock('./flows.js', () => ({
	collectFlowMetrics: vi.fn().mockResolvedValue({ active: { count: 0 }, inactive: { count: 0 } }),
}));

vi.mock('./roles.js', () => ({
	collectRoleMetrics: vi.fn().mockResolvedValue({
		count: 0,
		users: { min: 0, max: 0, median: 0, mean: 0 },
		policies: { min: 0, max: 0, median: 0, mean: 0 },
		roles: { min: 0, max: 0, median: 0, mean: 0 },
	}),
}));

vi.mock('./translations.js', () => ({
	collectTranslationMetrics: vi.fn().mockResolvedValue({
		count: 0,
		language: { count: 0, translations: { min: 0, max: 0, median: 0, mean: 0 } },
	}),
}));

vi.mock('./users.js', () => ({
	collectUserMetrics: vi.fn().mockResolvedValue({
		admin: { count: 0 },
		app: { count: 0 },
		api: { count: 0 },
	}),
}));

vi.mock('./dashboards.js', () => ({
	collectDashboardMetrics: vi.fn().mockResolvedValue({
		count: 0,
		panels: { min: 0, max: 0, median: 0, mean: 0 },
	}),
}));

vi.mock('./extensions.js', () => ({
	collectExtensionMetrics: vi.fn().mockResolvedValue({
		active: { count: 0 },
		inactive: { count: 0 },
	}),
}));

vi.mock('../../utils/service-count.js', () => ({
	serviceCount: vi.fn().mockResolvedValue(0),
}));

import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectMetrics', () => {
	const mockDb = {} as Knex;
	const mockSchema = {} as SchemaOverview;

	test('returns all metric sections', async () => {
		const result = await collectMetrics(mockDb, mockSchema);

		expect(result).toHaveProperty('api_requests');
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
	});

	test('strips internal properties from collections', async () => {
		const result = await collectMetrics(mockDb, mockSchema);
		expect(result.collections).not.toHaveProperty('_totalItems');
		expect(result.collections).not.toHaveProperty('_totalFields');
	});

	test('maps _totalItems to items.count', async () => {
		const result = await collectMetrics(mockDb, mockSchema);
		expect(result.items.count).toBe(0);
	});
});
