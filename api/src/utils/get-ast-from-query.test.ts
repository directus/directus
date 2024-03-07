import { describe, expect, test } from 'vitest';
import type { PermissionsAction, Query, SchemaOverview, FieldOverview } from '@directus/types';

import getASTFromQuery from './get-ast-from-query.js';

const collection = 'root_collection';

const query = {
	alias: {
		firstLevelA: 'first_level_a',
		firstLevelB: 'first_level_b',
	},
	deep: {
		firstLevelA: {
			_alias: {
				secondLevelA: 'second_level_a',
			},
		},
	},
	fields: [
		'id',
		'firstLevelA.id',
		'firstLevelA.secondLevelA.id',
		'firstLevelA.secondLevelA.field_to_alias',
		'firstLevelB.id',
	],
} as Query;

const fieldDefaults: FieldOverview = {
	field: 'id',
	defaultValue: 'AUTO_INCREMENT',
	nullable: true,
	generated: false,
	type: 'integer',
	dbType: 'integer',
	precision: null,
	scale: null,
	special: [],
	note: null,
	alias: false,
	validation: null,
};

const metaDefaults = {
	one_field: null,
	one_collection_field: null,
	one_allowed_collections: null,
	junction_field: null,
	sort_field: null,
	one_deselect_action: 'nullify' as 'delete' | 'nullify',
};

const schema: SchemaOverview = {
	collections: {
		first_level_a: {
			collection: 'first_level_a',
			primary: 'id',
			singleton: false,
			note: null,
			sortField: null,
			accountability: 'all',
			fields: {
				id: {
					...fieldDefaults,
				},
				second_level_a: {
					...fieldDefaults,
					field: 'second_level_a',
					special: ['m2o'],
				},
			},
		},
		first_level_b: {
			collection: 'first_level_b',
			primary: 'id',
			singleton: false,
			note: null,
			sortField: null,
			accountability: 'all',
			fields: {
				id: {
					...fieldDefaults,
				},
			},
		},
		root_collection: {
			collection: 'root_collection',
			primary: 'id',
			singleton: false,
			note: null,
			sortField: null,
			accountability: 'all',
			fields: {
				id: {
					...fieldDefaults,
				},
				first_level_b: {
					...fieldDefaults,
					field: 'first_level_b',
					defaultValue: null,
					special: ['m2o'],
				},
				first_level_a: {
					...fieldDefaults,
					field: 'first_level_a',
					defaultValue: null,
					special: ['m2o'],
				},
			},
		},
		second_level_a: {
			collection: 'second_level_a',
			primary: 'id',
			singleton: false,
			note: null,
			sortField: null,
			accountability: 'all',
			fields: {
				id: {
					...fieldDefaults,
				},
				field_to_alias: {
					...fieldDefaults,
					field: 'field_to_alias',
					defaultValue: null,
					type: 'string',
					dbType: 'character varying',
				},
			},
		},
	},
	relations: [
		{
			collection: 'root_collection',
			field: 'first_level_a',
			related_collection: 'first_level_a',
			schema: {
				constraint_name: 'root_collection_first_level_a_foreign',
				table: 'root_collection',
				column: 'first_level_a',
				foreign_key_schema: 'public',
				foreign_key_table: 'first_level_a',
				foreign_key_column: 'id',
				on_update: 'NO ACTION',
				on_delete: 'SET NULL',
			},
			meta: {
				...metaDefaults,
				id: 7,
				many_collection: 'root_collection',
				many_field: 'first_level_a',
				one_collection: 'first_level_a',
			},
		},
		{
			collection: 'root_collection',
			field: 'first_level_b',
			related_collection: 'first_level_b',
			schema: {
				constraint_name: 'root_collection_first_level_b_foreign',
				table: 'root_collection',
				column: 'first_level_b',
				foreign_key_schema: 'public',
				foreign_key_table: 'first_level_b',
				foreign_key_column: 'id',
				on_update: 'NO ACTION',
				on_delete: 'SET NULL',
			},
			meta: {
				...metaDefaults,
				id: 6,
				many_collection: 'root_collection',
				many_field: 'first_level_b',
				one_collection: 'first_level_b',
			},
		},
		{
			collection: 'first_level_a',
			field: 'second_level_a',
			related_collection: 'second_level_a',
			schema: {
				constraint_name: 'first_level_a_second_level_a_foreign',
				table: 'first_level_a',
				column: 'second_level_a',
				foreign_key_schema: 'public',
				foreign_key_table: 'second_level_a',
				foreign_key_column: 'id',
				on_update: 'NO ACTION',
				on_delete: 'SET NULL',
			},
			meta: {
				...metaDefaults,
				id: 8,
				many_collection: 'first_level_a',
				many_field: 'second_level_a',
				one_collection: 'second_level_a',
			},
		},
	],
};

const options: { action: PermissionsAction } = {
	action: 'read',
};

describe('getASTFromQuery', () => {
	test('should return the complete AST for nested alias fields', async () => {
		const ast = await getASTFromQuery(collection, query, schema, options);

		expect(ast).toEqual(
			expect.objectContaining({
				type: 'root',
				name: 'root_collection',
				query: {
					alias: {
						firstLevelA: 'first_level_a',
						firstLevelB: 'first_level_b',
					},
					sort: ['id'],
				},
				children: expect.arrayContaining([
					expect.objectContaining({
						type: 'field',
						name: 'id',
						fieldKey: 'id',
					}),
					expect.objectContaining({
						type: 'm2o',
						name: 'first_level_a',
						fieldKey: 'firstLevelA',
						query: {
							alias: {
								secondLevelA: 'second_level_a',
							},
						},
					}),
					expect.objectContaining({
						type: 'm2o',
						name: 'first_level_b',
						fieldKey: 'firstLevelB',
					}),
				]),
			}),
		);
	});
});
