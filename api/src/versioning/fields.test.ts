import { SchemaBuilder } from '@directus/schema-builder';
import type { SchemaOverview } from '@directus/types';
import { describe, expect, test } from 'vitest';
import {
	deletePath,
	formatAggregate,
	getEngineFields,
	getMetaColumn,
	getRelatedCollection,
	getRequestedRoots,
	getSubfields,
	injectPublishedMeta,
	isMetaField,
	mapAggregate,
	PUBLISHED_META,
	requestedMetaKeys,
	rewriteSort,
	toMetaColumn,
	trimVersionMeta,
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

describe('isMetaField', () => {
	test.each([
		['directus_version', true],
		['directus_version.type', true],
		['directus_version_key', false],
		['title', false],
		['author.directus_version.type', false],
	])('%s → %s', (field, expected) => {
		expect(isMetaField(field)).toBe(expected);
	});
});

describe('getMetaColumn', () => {
	test('returns the shadow table column of a meta key', () => {
		expect(getMetaColumn('type')).toBe('version_type');
		expect(getMetaColumn('date_created')).toBe('version_date_created');
	});

	test('throws on unknown keys', () => {
		expect(() => getMetaColumn('unknown')).toThrow('"directus_version.unknown" doesn\'t exist');
	});
});

describe('toMetaColumn', () => {
	test('maps version meta fields to their column', () => {
		expect(toMetaColumn('directus_version.user_created')).toBe('version_user_created');
	});

	test('keeps other fields', () => {
		expect(toMetaColumn('title')).toBe('title');
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

describe('formatAggregate', () => {
	test('moves grouped meta columns into directus_version', () => {
		expect(formatAggregate({ version_type: 'draft', count: 2 }, { aggregate: { count: ['*'] } })).toEqual({
			directus_version: { type: 'draft' },
			count: 2,
		});
	});

	test('renames aggregated meta columns to their field', () => {
		expect(
			formatAggregate(
				{ countDistinct: { version_user_created: 2, title: 3 } },
				{ aggregate: { countDistinct: ['directus_version.user_created', 'title'] } },
			),
		).toEqual({ countDistinct: { 'directus_version.user_created': 2, title: 3 } });
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

describe('getEngineFields', () => {
	test('keeps fields without version meta', () => {
		expect(getEngineFields(schema, 'articles', ['title', 'author.name'])).toEqual({
			fields: ['title', 'author.name'],
			added: [],
		});
	});

	test('drops version meta of the collection itself', () => {
		expect(getEngineFields(schema, 'articles', ['title', 'directus_version.type'])).toEqual({
			fields: ['title'],
			added: [],
		});
	});

	test('selects the primary key of related items that only have version meta requested', () => {
		expect(getEngineFields(schema, 'articles', ['author.directus_version.type', 'tags.directus_version.id'])).toEqual({
			fields: ['author.id', 'tags.id'],
			added: ['author.id', 'tags.id'],
		});
	});

	test("doesn't mark requested primary keys as added", () => {
		expect(getEngineFields(schema, 'articles', ['author.id', 'author.directus_version.type'])).toEqual({
			fields: ['author.id'],
			added: [],
		});
	});

	test('falls back to the primary key if nothing else is left', () => {
		expect(getEngineFields(schema, 'articles', ['directus_version'])).toEqual({ fields: ['id'], added: [] });
	});
});

describe('requestedMetaKeys', () => {
	test('returns the requested keys', () => {
		expect(requestedMetaKeys(['title', 'directus_version.type', 'directus_version.id'])).toEqual(['type', 'id']);
	});

	test.each([['directus_version'], ['directus_version.*']])('%s requests all keys', (field) => {
		expect(requestedMetaKeys([field])).toEqual(Object.keys(PUBLISHED_META));
	});

	test('ignores version meta of related items', () => {
		expect(requestedMetaKeys(['author.directus_version.type'])).toEqual([]);
	});

	test('throws on unknown keys', () => {
		expect(() => requestedMetaKeys(['directus_version.unknown'])).toThrow();
	});
});

describe('trimVersionMeta', () => {
	test('keeps only the requested keys', () => {
		const item = { directus_version: { id: 1, type: 'draft', name: null } };

		trimVersionMeta(item, ['directus_version.type']);

		expect(item).toEqual({ directus_version: { type: 'draft' } });
	});

	test('removes the meta if none is requested', () => {
		const item = { id: 1, directus_version: { id: 1 } };

		trimVersionMeta(item, ['id']);

		expect(item).toEqual({ id: 1 });
	});
});

describe('injectPublishedMeta', () => {
	test('adds published meta to items without meta', () => {
		expect(injectPublishedMeta({ id: 1 }, ['id', 'directus_version.type', 'directus_version.id'])).toEqual({
			id: 1,
			directus_version: { type: 'published', id: null },
		});
	});

	test('keeps existing meta, trimmed to the requested keys', () => {
		expect(
			injectPublishedMeta({ directus_version: { id: 3, type: 'draft', name: 'Draft' } }, ['directus_version.type']),
		).toEqual({ directus_version: { type: 'draft' } });
	});

	test('adds published meta to m2o and o2m related items', () => {
		const item = { author: { id: 1 }, tags: [{ id: 2 }, { id: 3, directus_version: { type: 'draft' } }] };

		injectPublishedMeta(item, ['author.directus_version.type', 'tags.directus_version.type']);

		expect(item).toEqual({
			author: { id: 1, directus_version: { type: 'published' } },
			tags: [
				{ id: 2, directus_version: { type: 'published' } },
				{ id: 3, directus_version: { type: 'draft' } },
			],
		});
	});

	test("doesn't add meta if none is requested", () => {
		expect(injectPublishedMeta({ id: 1, author: { id: 2 } }, ['id', 'author.id'])).toEqual({
			id: 1,
			author: { id: 2 },
		});
	});

	test('ignores values that are no objects', () => {
		const item = { author: 2, tags: [3] };

		injectPublishedMeta(item, ['author.directus_version.type', 'tags.directus_version.type']);

		expect(item).toEqual({ author: 2, tags: [3] });
	});
});

describe('getRequestedRoots', () => {
	test('returns the unique top level fields', () => {
		expect(getRequestedRoots(schema, 'articles', ['title', 'author.name', 'author.id'])).toEqual(['title', 'author']);
	});

	test('expands * to all fields of the collection', () => {
		expect(getRequestedRoots(schema, 'articles', ['*'])).toEqual(['id', 'title', 'author', 'tags']);
	});

	test('leaves out version meta', () => {
		expect(getRequestedRoots(schema, 'articles', ['directus_version.type', 'title'])).toEqual(['title']);
	});
});

describe('getSubfields', () => {
	test('returns the fields below the root', () => {
		expect(getSubfields(['title', 'author.name', 'author.directus_version.type'], 'author')).toEqual([
			'name',
			'directus_version.type',
		]);
	});

	test('applies *.<field> to every root', () => {
		expect(getSubfields(['*.name'], 'author')).toEqual(['name']);
	});

	test('returns nothing for roots without subfields', () => {
		expect(getSubfields(['author', 'authors.name'], 'author')).toEqual([]);
	});
});

describe('deletePath', () => {
	test('deletes a top level field', () => {
		const item = { id: 1, title: 'a' };

		deletePath(item, 'id');

		expect(item).toEqual({ title: 'a' });
	});

	test('deletes a field of a nested object', () => {
		const item = { author: { id: 1, name: 'Jane' } };

		deletePath(item, 'author.id');

		expect(item).toEqual({ author: { name: 'Jane' } });
	});

	test('deletes the field from every element of arrays along the path', () => {
		const item = {
			tags: [
				{ id: 1, author: { id: 2 } },
				{ id: 3, author: { id: 4 } },
			],
		};

		deletePath(item, 'tags.author.id');

		expect(item).toEqual({
			tags: [
				{ id: 1, author: {} },
				{ id: 3, author: {} },
			],
		});
	});

	test('ignores missing and non object values along the path', () => {
		const item = { author: null, tags: [1, 2] };

		deletePath(item, 'author.id');
		deletePath(item, 'tags.id');
		deletePath(item, 'missing.id');

		expect(item).toEqual({ author: null, tags: [1, 2] });
	});
});
