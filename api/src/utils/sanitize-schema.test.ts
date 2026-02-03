import type { Column } from '@directus/schema';
import type { Field, Relation, SnapshotSystemField } from '@directus/types';
import { describe, expect, test } from 'vitest';
import type { Collection } from '../types/index.js';
import {
	sanitizeCollection,
	sanitizeColumn,
	sanitizeField,
	sanitizeRelation,
	sanitizeSystemField,
} from './sanitize-schema.js';

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
				translations: null,
				system: false,
				versioning: false,
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
				translations: null,
				system: false,
				versioning: false,
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
				translations: null,
				system: false,
				versioning: false,
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
				translations: null,
				system: false,
				versioning: false,
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
				translations: null,
				system: false,
				versioning: false,
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
				translations: null,
				system: false,
				versioning: false,
			},
			schema: { name: 'test' },
		});

		describe('sanitizeColumn', () => {
			test('should only contain certain properties from column', () => {
				const testColumn: Column = {
					name: 'id',
					table: 'test',
					data_type: 'integer',
					default_value: "nextval('test_id_seq'::regclass)",
					max_length: null,
					numeric_precision: 32,
					numeric_scale: 0,
					is_nullable: false,
					is_unique: true,
					is_indexed: false,
					is_primary_key: true,
					is_generated: false,
					generation_expression: null,
					has_auto_increment: true,
					foreign_key_table: null,
					foreign_key_column: null,
					// unknown properties that should be removed
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				} as Column;

				const result = sanitizeColumn(testColumn);

				expect(result).toEqual({
					name: 'id',
					table: 'test',
					data_type: 'integer',
					default_value: "nextval('test_id_seq'::regclass)",
					max_length: null,
					numeric_precision: 32,
					numeric_scale: 0,
					is_nullable: false,
					is_unique: true,
					is_indexed: false,
					is_primary_key: true,
					is_generated: false,
					generation_expression: null,
					has_auto_increment: true,
					foreign_key_table: null,
					foreign_key_column: null,
				});
			});
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
				is_indexed: false,
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
				is_indexed: false,
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
				is_indexed: false,
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

describe('sanitizeColumn', () => {
	test('should only contain certain properties from column', () => {
		const testColumn: Column = {
			name: 'id',
			table: 'test',
			data_type: 'integer',
			default_value: "nextval('test_id_seq'::regclass)",
			max_length: null,
			numeric_precision: 32,
			numeric_scale: 0,
			is_nullable: false,
			is_unique: true,
			is_indexed: false,
			is_primary_key: true,
			is_generated: false,
			generation_expression: null,
			has_auto_increment: true,
			foreign_key_table: null,
			foreign_key_column: null,
			// unknown properties that should be removed
			comment: null,
			schema: 'public',
			foreign_key_schema: null,
		} as Column;

		const result = sanitizeColumn(testColumn);

		expect(result).toEqual({
			name: 'id',
			table: 'test',
			data_type: 'integer',
			default_value: "nextval('test_id_seq'::regclass)",
			max_length: null,
			numeric_precision: 32,
			numeric_scale: 0,
			is_nullable: false,
			is_unique: true,
			is_indexed: false,
			is_primary_key: true,
			is_generated: false,
			generation_expression: null,
			has_auto_increment: true,
			foreign_key_table: null,
			foreign_key_column: null,
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

describe('sanitizeSystemField', () => {
	test('should only contain collection, field, and is_indexed properties', () => {
		const testSystemField: Field = {
			collection: 'directus_users',
			field: 'email',
			name: 'email',
			type: 'string',
			meta: {
				id: 1,
				collection: 'directus_users',
				conditions: null,
				display: null,
				display_options: null,
				field: 'email',
				group: null,
				hidden: false,
				interface: 'input',
				note: null,
				options: null,
				readonly: false,
				required: true,
				sort: null,
				special: null,
				translations: null,
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				name: 'email',
				table: 'directus_users',
				data_type: 'varchar',
				default_value: null,
				max_length: 128,
				numeric_precision: null,
				numeric_scale: null,
				is_nullable: false,
				is_unique: true,
				is_indexed: true,
				is_primary_key: false,
				is_generated: false,
				generation_expression: null,
				has_auto_increment: false,
				foreign_key_table: null,
				foreign_key_column: null,
				comment: null,
			},
		};

		const result = sanitizeSystemField(testSystemField);

		expect(result).toEqual({
			collection: 'directus_users',
			field: 'email',
			schema: {
				is_indexed: true,
			},
		});
	});

	test('should handle system fields with index', () => {
		const testSystemField = {
			collection: 'directus_activity',
			field: 'timestamp',
			schema: {
				is_indexed: true,
			},
		} as SnapshotSystemField;

		const result = sanitizeSystemField(testSystemField);

		expect(result).toEqual(testSystemField);
	});
});
