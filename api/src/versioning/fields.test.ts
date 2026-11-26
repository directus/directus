import { SchemaBuilder } from '@directus/schema-builder';
import type { SchemaOverview } from '@directus/types';
import { describe, expect, test } from 'vitest';
import {
	getRelatedCollection,
	getSystemColumn,
	isSystemField,
	mapAggregate,
	rewriteSort,
	toSystemColumn,
} from './fields.js';

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('author').m2o('authors');
		c.field('tags').o2m('tags', 'article');
	})
	.collection('authors', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('tags', (c) => {
		c.field('id').id();
		c.field('label').string();
	})
	.build() as SchemaOverview;

describe('isSystemField', () => {
	test.each([
		['directus_version', true],
		['directus_version.type', true],
		['directus_version_key', false],
		['title', false],
		['author.directus_version.type', false],
	])('%s → %s', (field, expected) => {
		expect(isSystemField(field)).toBe(expected);
	});
});

describe('getSystemColumn', () => {
	test('returns the shadow table column of a system field', () => {
		expect(getSystemColumn('type')).toBe('version_type');
		expect(getSystemColumn('date_created')).toBe('version_date_created');
	});

	test('throws on unknown keys', () => {
		expect(() => getSystemColumn('unknown')).toThrow('"directus_version.unknown" doesn\'t exist');
	});
});

describe('toSystemColumn', () => {
	test('maps version system fields to their column', () => {
		expect(toSystemColumn('directus_version.user_created')).toBe('version_user_created');
	});

	test('keeps other fields', () => {
		expect(toSystemColumn('title')).toBe('title');
	});
});

describe('rewriteSort', () => {
	test.each([
		['directus_version.type', 'version_type'],
		['-directus_version.type', '-version_type'],
		['title', 'title'],
		['-title', '-title'],
	])('%s → %s', (sort, expected) => {
		expect(rewriteSort(sort)).toBe(expected);
	});
});

describe('mapAggregate', () => {
	test('maps the fields of every aggregate function', () => {
		expect(
			mapAggregate({ count: ['*'], sum: ['a', 'b'] }, (fields) => fields.map((field) => field.toUpperCase())),
		).toEqual({ count: ['*'], sum: ['A', 'B'] });
	});
});

describe('getRelatedCollection', () => {
	test('follows m2o and o2m relations', () => {
		expect(getRelatedCollection(schema, 'articles', ['author'])).toBe('authors');
		expect(getRelatedCollection(schema, 'articles', ['tags'])).toBe('tags');
		expect(getRelatedCollection(schema, 'tags', ['article', 'author'])).toBe('authors');
	});

	test('returns the collection itself for an empty path', () => {
		expect(getRelatedCollection(schema, 'articles', [])).toBe('articles');
	});

	test('returns null for fields that are no relation', () => {
		expect(getRelatedCollection(schema, 'articles', ['title'])).toBeNull();
		expect(getRelatedCollection(schema, 'articles', ['author', 'name'])).toBeNull();
	});
});
