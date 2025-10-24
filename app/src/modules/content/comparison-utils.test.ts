import { describe, it, expect } from 'vitest';
import type { Field } from '@directus/types';
import { mergeMainItemKeysIntoRevision, getFieldsWithDifferences } from './comparison-utils';

describe('mergeMainItemKeysIntoRevision', () => {
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

		const result = mergeMainItemKeysIntoRevision(revisionData, base, fields);

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

		const result = mergeMainItemKeysIntoRevision(revisionData, base, fields);

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

		const result = mergeMainItemKeysIntoRevision(revisionData, base, fields);

		expect(result).toMatchInlineSnapshot(`
			{
			  "count": null,
			  "description": "Incoming Description",
			  "title": "test1",
			}
		`);
	});
});

describe('getFieldsWithDifferences', () => {
	it('excludes related item fields when comparing revisions', () => {
		const comparedData = {
			outdated: false,
			mainHash: '',
			incoming: {
				title: 'New Title',
				description: 'New Description',
				related_items: [{ id: 1, name: 'Item 1' }],
				categories: [{ id: 2, name: 'Category 1' }],
				status: 'published',
			},
			base: {
				title: 'Old Title',
				description: 'Old Description',
				related_items: [{ id: 2, name: 'Item 2' }],
				categories: [{ id: 3, name: 'Category 2' }],
				status: 'draft',
			},
		};

		const fieldMetadata = {
			title: { meta: { special: [] } },
			description: { meta: { special: [] } },
			related_items: { meta: { special: ['m2m'] } },
			categories: { meta: { special: ['o2m'] } },
			status: { meta: { special: [] } },
		};

		// Test version comparison - should include all fields with differences
		const versionFields = getFieldsWithDifferences(comparedData, fieldMetadata, 'version');
		expect(versionFields).toContain('title');
		expect(versionFields).toContain('description');
		expect(versionFields).toContain('related_items');
		expect(versionFields).toContain('categories');
		expect(versionFields).toContain('status');

		// Test revision comparison - should exclude related item fields
		const revisionFields = getFieldsWithDifferences(comparedData, fieldMetadata, 'revision');
		expect(revisionFields).toContain('title');
		expect(revisionFields).toContain('description');
		expect(revisionFields).toContain('status');
		expect(revisionFields).not.toContain('related_items');
		expect(revisionFields).not.toContain('categories');
	});

	it('includes related item fields when comparing versions', () => {
		const comparedData = {
			outdated: false,
			mainHash: '',
			incoming: {
				title: 'New Title',
				related_items: [{ id: 1, name: 'Item 1' }],
			},
			base: {
				title: 'Old Title',
				related_items: [{ id: 2, name: 'Item 2' }],
			},
		};

		const fieldMetadata = {
			title: { meta: { special: [] } },
			related_items: { meta: { special: ['m2m'] } },
		};

		// Version comparison should include related item fields
		const versionFields = getFieldsWithDifferences(comparedData, fieldMetadata, 'version');
		expect(versionFields).toContain('title');
		expect(versionFields).toContain('related_items');
	});
});
