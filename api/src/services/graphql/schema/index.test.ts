import { beforeEach, describe, expect, test, vi } from 'vitest';
import { cache } from '../schema-cache.js';
import { generateSchema } from './index.js';

const { mockFetchAllowedFieldMap, mockFetchInconsistentFieldMap, mockReduceSchema, mockInjectSystemResolvers } =
	vi.hoisted(() => ({
		mockFetchAllowedFieldMap: vi.fn(),
		mockFetchInconsistentFieldMap: vi.fn(),
		mockReduceSchema: vi.fn(),
		mockInjectSystemResolvers: vi.fn(),
	}));

vi.mock('@directus/env', () => ({
	useEnv: () => ({
		GRAPHQL_SCHEMA_GENERATION_MAX_CONCURRENT: 1,
	}),
}));

vi.mock('../../../permissions/modules/fetch-allowed-field-map/fetch-allowed-field-map.js', () => ({
	fetchAllowedFieldMap: mockFetchAllowedFieldMap,
}));

vi.mock('../../../permissions/modules/fetch-inconsistent-field-map/fetch-inconsistent-field-map.js', () => ({
	fetchInconsistentFieldMap: mockFetchInconsistentFieldMap,
}));

vi.mock('../../../utils/reduce-schema.js', () => ({
	reduceSchema: mockReduceSchema,
}));

vi.mock('../resolvers/system.js', () => ({
	injectSystemResolvers: mockInjectSystemResolvers,
}));

vi.mock('../index.js', () => ({
	GraphQLService: class GraphQLService {},
}));

vi.mock('../utils/sanitize-gql-schema.js', () => ({
	sanitizeGraphqlSchema: (schema: unknown) => schema,
}));

vi.mock('./read.js', () => ({
	getReadableTypes: vi.fn(async (_gql, schemaComposer) => {
		const createReadableType = (collection: string) => {
			const type = schemaComposer.createObjectTC({
				name: `${collection}_read`,
				fields: {
					id: 'ID',
				},
			});

			const aggregatedType = schemaComposer.createObjectTC({
				name: `${collection}_aggregated`,
				fields: {
					count: 'Int',
				},
			});

			type.addResolver({
				name: collection,
				type: [type],
				args: {},
				resolve: () => [],
			});

			type.addResolver({
				name: `${collection}_by_id`,
				type,
				args: { id: 'ID' },
				resolve: () => ({ id: '1' }),
			});

			type.addResolver({
				name: `${collection}_aggregated`,
				type: aggregatedType,
				args: {},
				resolve: () => ({ count: 1 }),
			});

			return type;
		};

		const versionType = schemaComposer.createObjectTC({
			name: 'version_read',
			fields: {
				id: 'ID',
			},
		});

		versionType.addResolver({
			name: 'writable_by_version',
			type: versionType,
			args: {},
			resolve: () => ({ id: '1' }),
		});

		versionType.addResolver({
			name: 'readonly_view_by_version',
			type: versionType,
			args: {},
			resolve: () => ({ id: '1' }),
		});

		return {
			ReadCollectionTypes: {
				writable: createReadableType('writable'),
				readonly_view: createReadableType('readonly_view'),
			},
			VersionCollectionTypes: {
				writable: versionType,
				readonly_view: versionType,
			},
		};
	}),
}));

vi.mock('./write.js', () => ({
	getWritableTypes: vi.fn((_gql, schemaComposer) => {
		const createWritableType = (collection: string) => {
			const type = schemaComposer.createObjectTC({
				name: `${collection}_write`,
				fields: {
					id: 'ID',
				},
			});

			type.addResolver({
				name: `create_${collection}_items`,
				type: [type],
				args: {},
				resolve: () => [],
			});

			type.addResolver({
				name: `create_${collection}_item`,
				type,
				args: {},
				resolve: () => ({ id: '1' }),
			});

			type.addResolver({
				name: `update_${collection}_items`,
				type: [type],
				args: {},
				resolve: () => [],
			});

			type.addResolver({
				name: `update_${collection}_batch`,
				type: [type],
				args: {},
				resolve: () => [],
			});

			type.addResolver({
				name: `update_${collection}_item`,
				type,
				args: {},
				resolve: () => ({ id: '1' }),
			});

			return type;
		};

		const deleteMany = schemaComposer.createObjectTC({
			name: 'delete_many_test',
			fields: {
				ids: ['ID!'],
			},
		});

		deleteMany.addResolver({
			name: 'delete_writable_items',
			type: deleteMany,
			args: {},
			resolve: () => ({ ids: ['1'] }),
		});

		deleteMany.addResolver({
			name: 'delete_readonly_view_items',
			type: deleteMany,
			args: {},
			resolve: () => ({ ids: ['1'] }),
		});

		const deleteOne = schemaComposer.createObjectTC({
			name: 'delete_one_test',
			fields: {
				id: 'ID',
			},
		});

		deleteOne.addResolver({
			name: 'delete_writable_item',
			type: deleteOne,
			args: {},
			resolve: () => ({ id: '1' }),
		});

		deleteOne.addResolver({
			name: 'delete_readonly_view_item',
			type: deleteOne,
			args: {},
			resolve: () => ({ id: '1' }),
		});

		return {
			CreateCollectionTypes: {
				writable: createWritableType('writable'),
				readonly_view: createWritableType('readonly_view'),
			},
			UpdateCollectionTypes: {
				writable: createWritableType('writable'),
				readonly_view: createWritableType('readonly_view'),
			},
			DeleteCollectionTypes: {
				many: deleteMany,
				one: deleteOne,
			},
		};
	}),
}));

describe('generateSchema', () => {
	beforeEach(() => {
		cache.clear();
		mockFetchAllowedFieldMap.mockResolvedValue({});
		mockFetchInconsistentFieldMap.mockResolvedValue({});
		mockReduceSchema.mockImplementation((schema) => schema);
		mockInjectSystemResolvers.mockReset();
	});

	test('excludes readonly collections from write mutations', async () => {
		const gql = {
			scope: 'items',
			accountability: {
				admin: true,
				role: 'admin',
				user: '1',
			},
			schema: {
				collections: {
					writable: {
						collection: 'writable',
						primary: 'id',
						readonly: false,
						singleton: false,
						sortField: null,
						note: null,
						accountability: 'all',
						fields: {
							id: {
								field: 'id',
							},
						},
					},
					readonly_view: {
						collection: 'readonly_view',
						primary: 'id',
						readonly: true,
						singleton: false,
						sortField: null,
						note: null,
						accountability: 'all',
						fields: {
							id: {
								field: 'id',
							},
						},
					},
				},
				relations: [],
			},
			knex: {},
		} as any;

		const sdl = (await generateSchema(gql, 'sdl')) as string;

		expect(sdl).toContain('create_writable_item');
		expect(sdl).toContain('update_writable_item');
		expect(sdl).toContain('delete_writable_item');

		expect(sdl).not.toContain('create_readonly_view_item');
		expect(sdl).not.toContain('update_readonly_view_item');
		expect(sdl).not.toContain('delete_readonly_view_item');
	});
});
