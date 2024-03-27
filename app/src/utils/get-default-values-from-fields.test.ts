import { test, expect } from 'vitest';
import { getDefaultValuesFromFields } from './get-default-values-from-fields';

test('Ignores PK default value', () => {
	const values = getDefaultValuesFromFields([
		{
			collection: 'test_collection',
			field: 'id',
			type: 'integer',
			schema: {
				name: 'id',
				table: 'test_collection',
				schema: 'public',
				data_type: 'integer',
				is_nullable: false,
				generation_expression: null,
				default_value: "nextval('test_collection_id_seq'::regclass)",
				is_generated: false,
				max_length: null,
				comment: null,
				numeric_precision: 32,
				numeric_scale: 0,
				is_unique: true,
				is_primary_key: true,
				has_auto_increment: true,
				foreign_key_schema: null,
				foreign_key_table: null,
				foreign_key_column: null,
			},
			meta: null,
			name: 'ID',
		},
	]);

	expect(values.value).toStrictEqual({});
});

test('Ignores schemaless fields', () => {
	const values = getDefaultValuesFromFields([
		{
			collection: 'test_collection',
			field: 'test',
			type: 'integer',
			schema: null,
			meta: null,
			name: 'Test',
		},
	]);

	expect(values.value).toStrictEqual({});
});

test('Parses default values', () => {
	const values = getDefaultValuesFromFields([
		{
			collection: 'test_collection',
			field: 'condition',
			type: 'string',
			schema: {
				name: 'condition',
				table: 'test_collection',
				schema: 'public',
				data_type: 'character varying',
				is_nullable: true,
				generation_expression: null,
				default_value: 'test1',
				is_generated: false,
				max_length: 255,
				comment: null,
				numeric_precision: null,
				numeric_scale: null,
				is_unique: false,
				is_primary_key: false,
				has_auto_increment: false,
				foreign_key_schema: null,
				foreign_key_table: null,
				foreign_key_column: null,
			},
			meta: null,
			name: 'Condition',
		},
		{
			collection: 'test_collection',
			field: 'test1',
			type: 'string',
			schema: {
				name: 'test1',
				table: 'test_collection',
				schema: 'public',
				data_type: 'character varying',
				is_nullable: true,
				generation_expression: null,
				default_value: '---',
				is_generated: false,
				max_length: 255,
				comment: null,
				numeric_precision: null,
				numeric_scale: null,
				is_unique: false,
				is_primary_key: false,
				has_auto_increment: false,
				foreign_key_schema: null,
				foreign_key_table: null,
				foreign_key_column: null,
			},
			meta: null,
			name: 'Test 1',
		},
		{
			collection: 'test_collection',
			field: 'test2',
			type: 'string',
			schema: {
				name: 'test2',
				table: 'test_collection',
				schema: 'public',
				data_type: 'character varying',
				is_nullable: true,
				generation_expression: null,
				default_value: null,
				is_generated: false,
				max_length: 255,
				comment: null,
				numeric_precision: null,
				numeric_scale: null,
				is_unique: false,
				is_primary_key: false,
				has_auto_increment: false,
				foreign_key_schema: null,
				foreign_key_table: null,
				foreign_key_column: null,
			},
			meta: null,
			name: 'Test2',
		},
	]);

	expect(values.value).toStrictEqual({
		condition: 'test1',
		test1: '---',
		test2: null,
	});
});
