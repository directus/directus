import { describe, it, expect } from 'vitest';
import type { Field } from '@directus/types';
import { mergeMissingMainItemKeysIntoRevision } from './comparison-utils';

describe('mergeMissingMainItemKeysIntoRevision', () => {
	const fields: Field[] = [
		{
			collection: 'test_collection',
			field: 'title',
			name: 'Title',
			type: 'string',
			meta: null,
			schema: {
				name: 'title',
				table: 'test_collection',
				schema: 'public',
				is_nullable: true,
				default_value: 'test1',
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
				data_type: 'string',
				is_indexed: false,
				is_generated: false,
			},
		},
		{
			collection: 'test_collection',
			field: 'description',
			name: 'Description',
			type: 'string',
			meta: null,
			schema: {
				name: 'description',
				table: 'test_collection',
				schema: 'public',
				is_nullable: true,
				default_value: null,
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
				data_type: 'string',
				is_indexed: false,
				is_generated: false,
			},
		},
		{
			collection: 'test_collection',
			field: 'count',
			name: 'Count',
			type: 'string',
			meta: null,
			schema: {
				name: 'count',
				table: 'test_collection',
				schema: 'public',
				is_nullable: true,
				default_value: null,
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
				data_type: 'string',
				is_indexed: false,
				is_generated: false,
			},
		},
	];

	it('should merge missing keys with default values into incoming', () => {
		const base = {
			title: 'Base Title',
			description: null,
			count: null,
		};

		const revisionData = {
			title: 'Incoming Title',
		};

		const result = mergeMissingMainItemKeysIntoRevision(revisionData, base, fields);

		expect(result).toMatchInlineSnapshot(`
			{
			  "count": null,
			  "description": null,
			  "title": "Incoming Title",
			}
		`);
	});

	it('should not merge keys into incoming that have a non-default value', () => {
		const base = {
			title: 'Base Title',
			description: 'Base Description',
			count: 5,
		};

		const revisionData = {
			description: 'Incoming Description',
		};

		const result = mergeMissingMainItemKeysIntoRevision(revisionData, base, fields);

		expect(result).toMatchInlineSnapshot(`
			{
			  "description": "Incoming Description",
			}
		`);
	});

	it('should merge missing keys when value equals default value', () => {
		const base = {
			title: 'test1',
			description: 'Base Description',
			count: 5,
		};

		const revisionData = {
			description: 'Incoming Description',
			count: null,
		};

		const result = mergeMissingMainItemKeysIntoRevision(revisionData, base, fields);

		expect(result).toMatchInlineSnapshot(`
			{
			  "count": null,
			  "description": "Incoming Description",
			  "title": "test1",
			}
		`);
	});
});
