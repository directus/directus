import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getSchema } from './get-schema.js';

const mockOverview = vi.fn();
const mockReadAll = vi.fn();

vi.mock('@directus/env', () => ({
	useEnv: () => ({
		CACHE_SCHEMA: false,
	}),
}));

vi.mock('@directus/schema', () => ({
	createInspector: () => ({
		overview: mockOverview,
	}),
}));

vi.mock('@directus/system-data', () => ({
	systemCollectionRows: [],
}));

vi.mock('../services/relations.js', () => ({
	RelationsService: vi.fn().mockImplementation(() => ({
		readAll: mockReadAll,
	})),
}));

vi.mock('./get-field-system-rows.js', () => ({
	getSystemFieldRowsWithAuthProviders: () => [],
}));

vi.mock('../bus/index.js', () => ({
	useBus: () => ({
		subscribe: vi.fn(),
		unsubscribe: vi.fn(),
		publish: vi.fn(),
	}),
}));

vi.mock('../logger/index.js', () => ({
	useLogger: () => ({
		trace: vi.fn(),
		warn: vi.fn(),
	}),
}));

describe('getSchema', () => {
	beforeEach(() => {
		mockOverview.mockReset();
		mockReadAll.mockReset();
		mockReadAll.mockResolvedValue([]);
	});

	test('marks regular tables as not readonly', async () => {
		mockOverview.mockResolvedValue({
			products: {
				primary: 'id',
				type: 'table',
				columns: {
					id: {
						column_name: 'id',
						data_type: 'int',
						is_nullable: false,
						is_generated: false,
						numeric_precision: 10,
						numeric_scale: 0,
					},
				},
			},
		});

		const database = {
			select: () => ({
				from: (table: string) => {
					if (table === 'directus_collections') return Promise.resolve([]);
					if (table === 'directus_fields') return Promise.resolve([]);
					return Promise.resolve([]);
				},
			}),
		} as any;

		const schema = await getSchema({ database, bypassCache: true });

		expect(schema.collections.products).toMatchObject({
			collection: 'products',
			primary: 'id',
			readonly: false,
		});
	});

	test('marks view-backed collections as readonly', async () => {
		mockOverview.mockResolvedValue({
			order_view: {
				primary: 'id',
				type: 'view',
				columns: {
					id: {
						column_name: 'id',
						data_type: 'int',
						is_nullable: false,
						is_generated: false,
						numeric_precision: 10,
						numeric_scale: 0,
					},
					matchcode: {
						column_name: 'matchcode',
						data_type: 'varchar',
						is_nullable: true,
						is_generated: false,
						numeric_precision: null,
						numeric_scale: null,
					},
				},
			},
		});

		const database = {
			select: () => ({
				from: (table: string) => {
					if (table === 'directus_collections') return Promise.resolve([]);
					if (table === 'directus_fields') return Promise.resolve([]);
					return Promise.resolve([]);
				},
			}),
		} as any;

		const schema = await getSchema({ database, bypassCache: true });

		expect(schema.collections.order_view).toMatchObject({
			collection: 'order_view',
			primary: 'id',
			readonly: true,
		});
	});
});
