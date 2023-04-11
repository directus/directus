import type { Field, Relation } from '@directus/types';
import { expect, test, describe } from 'vitest';
import type { Collection } from '../types/index.js';
import { sanitizeCollection, sanitizeField, sanitizeRelation } from './sanitize-schema.js';

describe('sanitizeCollection', () => {
	test.each([
		// Not supported in SQLite + comment in MSSQL
		{
			collection: 'test',
			meta: {
				accountability: 'all',
				collection: 'test',
				group: null,
				hidden: false,
				icon: null,
				item_duplication_fields: null,
				note: null,
				singleton: false,
				translations: {},
			},
			schema: { comment: null, name: 'test', schema: 'public' },
		},
		// MySQL Only
		{
			collection: 'test',
			meta: {
				accountability: 'all',
				collection: 'test',
				group: null,
				hidden: false,
				icon: null,
				item_duplication_fields: null,
				note: null,
				singleton: false,
				translations: {},
			},
			schema: { collation: 'latin1_swedish_ci', name: 'test', engine: 'InnoDB' },
		},
		// Postgres Only
		{
			collection: 'test',
			meta: {
				accountability: 'all',
				collection: 'test',
				group: null,
				hidden: false,
				icon: null,
				item_duplication_fields: null,
				note: null,
				singleton: false,
				translations: {},
			},
			schema: { name: 'test', owner: 'postgres' },
		},
		// SQLite Only
		{
			collection: 'test',
			meta: {
				accountability: 'all',
				collection: 'test',
				group: null,
				hidden: false,
				icon: null,
				item_duplication_fields: null,
				note: null,
				singleton: false,
				translations: {},
			},
			schema: { name: 'test', sql: 'CREATE TABLE `test` (`id` integer not null primary key autoincrement)' },
		},
		// MSSQL only
		{
			collection: 'test',
			meta: {
				accountability: 'all',
				collection: 'test',
				group: null,
				hidden: false,
				icon: null,
				item_duplication_fields: null,
				note: null,
				singleton: false,
				translations: {},
			},
			schema: { name: 'test', catalog: 'test-db' },
		},
	] satisfies Collection[])('should only contain name property in collection schema', (testCollection) => {
		const result = sanitizeCollection(testCollection);

		expect(result).toEqual({
			collection: 'test',
			meta: {
				accountability: 'all',
				collection: 'test',
				group: null,
				hidden: false,
				icon: null,
				item_duplication_fields: null,
				note: null,
				singleton: false,
				translations: {},
			},
			schema: { name: 'test' },
		});
	});
});

describe('sanitizeField', () => {
	test('should only contain certain properties in field schema when sanitizeAllSchema is false', () => {
		const testField = {
			collection: 'test',
			field: 'id',
			name: 'id',
			meta: {
				id: 1,
				collection: 'test',
				conditions: null,
				display: null,
				display_options: null,
				field: 'id',
				group: null,
				hidden: true,
				interface: 'input',
				note: null,
				options: null,
				readonly: true,
				required: false,
				sort: null,
				special: null,
				translations: null,
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				comment: null,
				data_type: 'integer',
				default_value: "nextval('test_id_seq'::regclass)",
				foreign_key_column: null,
				foreign_key_schema: null,
				foreign_key_table: null,
				generation_expression: null,
				has_auto_increment: true,
				is_generated: false,
				is_nullable: false,
				is_primary_key: true,
				is_unique: true,
				max_length: null,
				name: 'id',
				numeric_precision: 32,
				numeric_scale: 0,
				schema: 'public',
				table: 'test',
			},
			type: 'integer',
		} satisfies Field;

		const result = sanitizeField(testField);

		expect(result).toEqual({
			collection: 'test',
			field: 'id',
			name: 'id',
			meta: {
				id: 1,
				collection: 'test',
				conditions: null,
				display: null,
				display_options: null,
				field: 'id',
				group: null,
				hidden: true,
				interface: 'input',
				note: null,
				options: null,
				readonly: true,
				required: false,
				sort: null,
				special: null,
				translations: null,
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				data_type: 'integer',
				default_value: "nextval('test_id_seq'::regclass)",
				foreign_key_column: null,
				foreign_key_table: null,
				generation_expression: null,
				has_auto_increment: true,
				is_generated: false,
				is_nullable: false,
				is_primary_key: true,
				is_unique: true,
				max_length: null,
				name: 'id',
				numeric_precision: 32,
				numeric_scale: 0,

				table: 'test',
			},
			type: 'integer',
		});
	});

	test('should not contain field schema when sanitizeAllSchema is true', () => {
		const testField = {
			collection: 'test',
			field: 'id',
			name: 'id',
			meta: {
				id: 1,
				collection: 'test',
				conditions: null,
				display: null,
				display_options: null,
				field: 'id',
				group: null,
				hidden: true,
				interface: 'input',
				note: null,
				options: null,
				readonly: true,
				required: false,
				sort: null,
				special: null,
				translations: null,
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				data_type: 'integer',
				default_value: "nextval('test_id_seq'::regclass)",
				foreign_key_column: null,
				foreign_key_table: null,
				generation_expression: null,
				has_auto_increment: true,
				is_generated: false,
				is_nullable: false,
				is_primary_key: true,
				is_unique: true,
				max_length: null,
				name: 'id',
				numeric_precision: 32,
				numeric_scale: 0,
				table: 'test',
			},
			type: 'integer',
		} satisfies Field;

		const result = sanitizeField(testField, true);

		expect(result).toEqual({
			collection: 'test',
			field: 'id',
			name: 'id',
			meta: {
				id: 1,
				collection: 'test',
				conditions: null,
				display: null,
				display_options: null,
				field: 'id',
				group: null,
				hidden: true,
				interface: 'input',
				note: null,
				options: null,
				readonly: true,
				required: false,
				sort: null,
				special: null,
				translations: null,
				validation: null,
				validation_message: null,
				width: 'full',
			},
			type: 'integer',
		});
	});
});

describe('sanitizeRelation', () => {
	test.each([
		// Postgres + MSSSQL
		{
			collection: 'test_example',
			field: 'm2m',
			related_collection: 'test',
			meta: {
				id: 1,
				junction_field: 'example_id',
				many_collection: 'test_example',
				many_field: 'test_id',
				one_allowed_collections: null,
				one_collection: 'test',
				one_collection_field: null,
				one_deselect_action: 'nullify',
				one_field: 'm2m',
				sort_field: null,
			},
			schema: {
				table: 'test_example',
				column: 'test_id',
				foreign_key_table: 'test',
				foreign_key_column: 'id',
				foreign_key_schema: 'public',
				constraint_name: 'test_example_test_id_foreign',
				on_update: 'NO ACTION',
				on_delete: 'SET NULL',
			},
		},
	] satisfies Relation[])('should only contain certain properties in relation schema', (testRelation) => {
		const result = sanitizeRelation(testRelation);

		expect(result).toEqual({
			collection: 'test_example',
			field: 'm2m',
			related_collection: 'test',
			meta: {
				id: 1,
				junction_field: 'example_id',
				many_collection: 'test_example',
				many_field: 'test_id',
				one_allowed_collections: null,
				one_collection: 'test',
				one_collection_field: null,
				one_deselect_action: 'nullify',
				one_field: 'm2m',
				sort_field: null,
			},
			schema: {
				table: 'test_example',
				column: 'test_id',
				foreign_key_table: 'test',
				foreign_key_column: 'id',
				constraint_name: 'test_example_test_id_foreign',
				on_update: 'NO ACTION',
				on_delete: 'SET NULL',
			},
		});
	});
});
