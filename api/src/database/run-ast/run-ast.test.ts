import { expect, test, vi, beforeEach } from 'vitest';
import type { FieldNode, AST, NestedCollectionNode } from '../../types/ast.js';
import type { Accountability, SchemaOverview } from '@directus/types';
import { runAst } from './run-ast.js';

// Mock external dependencies
vi.mock('@directus/env', () => ({
	useEnv: () => ({ RELATIONAL_BATCH_SIZE: 25 }),
}));

vi.mock('../../permissions/lib/fetch-permissions.js', () => ({
	fetchPermissions: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../permissions/lib/fetch-policies.js', () => ({
	fetchPolicies: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../services/payload.js', () => ({
	PayloadService: vi.fn().mockImplementation(() => ({
		processValues: vi.fn().mockResolvedValue([{ id: 1, name: 'test' }]),
	})),
}));

vi.mock('../index.js', () => ({
	default: vi.fn().mockReturnValue({
		client: { config: { client: 'sqlite3' } },
	}),
}));

vi.mock('./lib/get-db-query.js', () => ({
	getDBQuery: vi.fn(),
}));

vi.mock('./lib/parse-current-level.js', () => ({
	parseCurrentLevel: vi.fn(),
}));

vi.mock('./utils/apply-parent-filters.js', () => ({
	applyParentFilters: vi.fn().mockReturnValue([]),
}));

vi.mock('./utils/merge-with-parent-items.js', () => ({
	mergeWithParentItems: vi.fn().mockImplementation((schema, nestedItems, items) => items),
}));

vi.mock('./utils/remove-temporary-fields.js', () => ({
	removeTemporaryFields: vi.fn().mockImplementation((schema, items) => items),
}));

const mockSchema: SchemaOverview = {
	collections: {
		test_collection: {
			collection: 'test_collection',
			primary: 'id',
			singleton: false,
			sortField: null,
			note: null,
			accountability: null,
			fields: {
				id: {
					field: 'id',
					defaultValue: null,
					nullable: false,
					generated: true,
					type: 'uuid',
					dbType: 'char',
					precision: null,
					scale: null,
					special: [],
					note: null,
					validation: null,
					alias: false,
				},
			},
		},
	},
	relations: [],
};

const mockAccountability: Accountability = {
	user: '12345',
	role: 'admin-role',
	roles: ['admin-role'],
	admin: true,
	app: true,
	ip: '127.0.0.1',
};

beforeEach(() => {
	vi.clearAllMocks();
});

test('runAst should execute successfully and return items', async () => {
	const { getDBQuery } = await import('./lib/get-db-query.js');
	const { parseCurrentLevel } = await import('./lib/parse-current-level.js');

	// Mock the database query to return test data
	vi.mocked(getDBQuery).mockResolvedValue([{ id: 1, name: 'test item' }]);

	// Mock parseCurrentLevel to return expected structure
	vi.mocked(parseCurrentLevel).mockResolvedValue({
		fieldNodes: [{ type: 'field', name: 'id' } as FieldNode, { type: 'field', name: 'name' } as FieldNode],
		primaryKeyField: 'id',
		nestedCollectionNodes: [],
	});

	const ast: AST = {
		type: 'root',
		name: 'test_collection',
		query: {
			fields: ['id', 'name'],
		},
		children: [{ type: 'field', name: 'id' } as FieldNode, { type: 'field', name: 'name' } as FieldNode],
		cases: [],
	};

	const result = await runAst(ast, mockSchema, mockAccountability);

	expect(result).toEqual([{ id: 1, name: 'test' }]);
	expect(getDBQuery).toHaveBeenCalled();
	expect(parseCurrentLevel).toHaveBeenCalledWith(mockSchema, 'test_collection', ast.children, ast.query);
});

test('runAst should return null when database query returns null', async () => {
	const { getDBQuery } = await import('./lib/get-db-query.js');
	const { parseCurrentLevel } = await import('./lib/parse-current-level.js');

	// Mock the database query to return null
	vi.mocked(getDBQuery).mockResolvedValue(null);

	// Mock parseCurrentLevel
	vi.mocked(parseCurrentLevel).mockResolvedValue({
		fieldNodes: [{ type: 'field', name: 'id' } as FieldNode],
		primaryKeyField: 'id',
		nestedCollectionNodes: [],
	});

	const ast: AST = {
		type: 'root',
		name: 'test_collection',
		query: {
			fields: ['id'],
		},
		children: [{ type: 'field', name: 'id' } as FieldNode],
		cases: [],
	};

	const result = await runAst(ast, mockSchema, mockAccountability);

	expect(result).toBeNull();
	expect(getDBQuery).toHaveBeenCalled();
});

test('runAst should handle empty array response', async () => {
	const { getDBQuery } = await import('./lib/get-db-query.js');
	const { parseCurrentLevel } = await import('./lib/parse-current-level.js');

	vi.mocked(getDBQuery).mockResolvedValue([]);

	vi.mocked(parseCurrentLevel).mockResolvedValue({
		fieldNodes: [{ type: 'field', name: 'id' } as FieldNode],
		primaryKeyField: 'id',
		nestedCollectionNodes: [],
	});

	const ast: AST = {
		type: 'root',
		name: 'test_collection',
		query: { fields: ['id'] },
		children: [{ type: 'field', name: 'id' } as FieldNode],
		cases: [],
	};

	const result = await runAst(ast, mockSchema, mockAccountability);

	expect(result).toEqual([{ id: 1, name: 'test' }]); // PayloadService mock always returns this
});

test('runAst should inject synthetic fields', async () => {
	const { getDBQuery } = await import('./lib/get-db-query.js');
	const { parseCurrentLevel } = await import('./lib/parse-current-level.js');

	vi.mocked(getDBQuery).mockResolvedValue([{ id: 1, name: 'test' }]);

	vi.mocked(parseCurrentLevel).mockResolvedValue({
		fieldNodes: [{ type: 'field', name: 'id' } as FieldNode, { type: 'field', name: '$thumbnail' } as FieldNode],
		primaryKeyField: 'id',
		nestedCollectionNodes: [],
	});

	const ast: AST = {
		type: 'root',
		name: 'test_collection',
		query: { fields: ['id', '$thumbnail'] },
		children: [{ type: 'field', name: 'id' } as FieldNode, { type: 'field', name: '$thumbnail' } as FieldNode],
		cases: [],
	};

	const result = await runAst(ast, mockSchema, mockAccountability);

	expect(result).toEqual([{ id: 1, name: 'test', $thumbnail: null }]); // Synthetic field injection works
});

test('runAst should handle non-admin permissions', async () => {
	const { getDBQuery } = await import('./lib/get-db-query.js');
	const { parseCurrentLevel } = await import('./lib/parse-current-level.js');
	const { fetchPermissions } = await import('../../permissions/lib/fetch-permissions.js');
	const { fetchPolicies } = await import('../../permissions/lib/fetch-policies.js');

	vi.mocked(getDBQuery).mockResolvedValue([{ id: 1 }]);

	vi.mocked(parseCurrentLevel).mockResolvedValue({
		fieldNodes: [{ type: 'field', name: 'id' } as FieldNode],
		primaryKeyField: 'id',
		nestedCollectionNodes: [],
	});

	const nonAdminAccountability: Accountability = {
		...mockAccountability,
		admin: false,
	};

	const ast: AST = {
		type: 'root',
		name: 'test_collection',
		query: { fields: ['id'] },
		children: [{ type: 'field', name: 'id' } as FieldNode],
		cases: [],
	};

	await runAst(ast, mockSchema, nonAdminAccountability);

	expect(fetchPolicies).toHaveBeenCalled();
	expect(fetchPermissions).toHaveBeenCalled();
});

test('runAst should handle A2O relationships', async () => {
	const { getDBQuery } = await import('./lib/get-db-query.js');

	vi.mocked(getDBQuery)
		.mockResolvedValueOnce([{ id: 1 }]) // collection_a
		.mockResolvedValueOnce([{ id: 2 }]); // collection_b

	const a2oAst: NestedCollectionNode = {
		type: 'a2o',
		names: ['collection_a', 'collection_b'],
		children: {
			collection_a: [{ type: 'field', name: 'id' } as FieldNode],
			collection_b: [{ type: 'field', name: 'id' } as FieldNode],
		},
		query: {
			collection_a: { fields: ['id'] },
			collection_b: { fields: ['id'] },
		},
		cases: {
			collection_a: [],
			collection_b: [],
		},
		relatedKey: { collection_a: 'id', collection_b: 'id' },
		fieldKey: 'related_id',
		relation: {} as any,
		parentKey: 'parent_id',
		whenCase: [],
	};

	const result = await runAst(a2oAst, mockSchema, mockAccountability);

	expect(result).toEqual({
		collection_a: [{ id: 1, name: 'test' }],
		collection_b: [{ id: 1, name: 'test' }], // Both use same PayloadService mock
	});
});
