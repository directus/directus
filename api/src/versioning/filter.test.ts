import { SchemaBuilder } from '@directus/schema-builder';
import type { Filter, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { describe, expect, test } from 'vitest';
import type { SchemaHelper } from '../database/helpers/schema/types.js';
import { VersioningHelper } from '../database/helpers/versioning/types.js';
import {
	type FilterLevel,
	isFieldCondition,
	matchesOperator,
	matchesPublishedSystemFields,
	nestFilter,
	nestOrExists,
	rewriteFilter,
	stripSystemFilter,
} from './filter.js';

// `articles` stands in for the virtual collection, which has the system columns and references to versions
const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('author').m2o('authors');
		c.field('category').m2o('categories');
		c.field('tags').o2m('tags', 'article');
		c.field('version_ref_author').m2o('directus_shadow_authors');
	})
	.collection('authors', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('categories', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('tags', (c) => {
		c.field('id').id();
		c.field('label').string();
	})
	.collection('directus_shadow_authors', (c) => {
		c.field('version_id').id();
		c.field('version_type').string();
		c.field('id').integer();
		c.field('name').string();
	})
	.build() as SchemaOverview;

const versioning = new VersioningHelper(
	{} as Knex,
	{ getMaxIdentifierLength: () => Infinity } as unknown as SchemaHelper,
);

function rewrite(filter: Filter, level: Partial<FilterLevel> = {}) {
	const shadows = new Set<string>();

	const result = rewriteFilter(filter, {
		schema,
		versioning,
		collection: 'articles',
		hasSystemFields: true,
		references: true,
		shadows,
		...level,
	});

	return { result, shadows: [...shadows] };
}

describe('stripSystemFilter', () => {
	test('returns null for empty filters', () => {
		expect(stripSystemFilter(null)).toBeNull();
		expect(stripSystemFilter(undefined)).toBeNull();
	});

	test('removes version system fields at any depth', () => {
		expect(
			stripSystemFilter({
				title: { _eq: 'a' },
				directus_version: { type: { _eq: 'draft' } },
				author: { name: { _eq: 'Jane' }, directus_version: { type: { _eq: 'draft' } } },
			} as Filter),
		).toEqual({ title: { _eq: 'a' }, author: { name: { _eq: 'Jane' } } });
	});

	test('removes objects and logical operators left empty', () => {
		expect(
			stripSystemFilter({
				_and: [{ directus_version: { type: { _eq: 'draft' } } }, { title: { _eq: 'a' } }],
				_or: [{ directus_version: { id: { _eq: 1 } } }],
				author: { directus_version: { type: { _eq: 'draft' } } },
			} as Filter),
		).toEqual({ _and: [{ title: { _eq: 'a' } }] });
	});

	test('keeps array arguments of operators', () => {
		expect(stripSystemFilter({ id: { _in: [1, 2] } })).toEqual({ id: { _in: [1, 2] } });
	});
});

describe('rewriteFilter', () => {
	test('maps version system fields to the system columns', () => {
		expect(rewrite({ title: { _eq: 'a' }, directus_version: { type: { _eq: 'draft' } } } as Filter).result).toEqual({
			title: { _eq: 'a' },
			version_type: { _eq: 'draft' },
		});
	});

	test('rewrites nested logical, _some and _none operators', () => {
		expect(
			rewrite({
				_or: [{ directus_version: { id: { _eq: 1 } } }, { _and: [{ directus_version: { name: { _null: true } } }] }],
			} as Filter).result,
		).toEqual({ _or: [{ version_id: { _eq: 1 } }, { _and: [{ version_name: { _null: true } }] }] });

		expect(rewrite({ tags: { _some: { label: { _eq: 'a' } } } } as Filter).result).toEqual({
			tags: { _some: { label: { _eq: 'a' } } },
		});
	});

	test('never matches version system fields that live items without system columns lack', () => {
		expect(
			rewrite({ directus_version: { type: { _eq: 'draft' } } } as Filter, { hasSystemFields: false }).result,
		).toEqual({
			_and: [{ id: { _in: [] } }],
		});
	});

	test('drops version system fields that live items without system columns match', () => {
		expect(
			rewrite({ title: { _eq: 'a' }, directus_version: { type: { _eq: 'published' } } } as Filter, {
				hasSystemFields: false,
			}).result,
		).toEqual({ title: { _eq: 'a' } });
	});

	test('keeps operators directly on relational fields', () => {
		expect(rewrite({ author: { _null: true } }).result).toEqual({ author: { _null: true } });
	});

	test('matches m2o filters against the live related item or the referenced version', () => {
		const { result, shadows } = rewrite({ author: { name: { _eq: 'Jane' } } } as Filter);

		expect(result).toEqual({
			_and: [
				{
					_or: [
						{ author: { name: { _eq: 'Jane' } } },
						{ _and: [{ author: { _null: true } }, { version_ref_author: { name: { _eq: 'Jane' } } }] },
					],
				},
			],
		});

		expect(shadows).toEqual(['directus_shadow_authors']);
	});

	test('applies version system fields on related items to the live item and the referenced version', () => {
		expect(rewrite({ author: { directus_version: { type: { _eq: 'draft' } } } } as Filter).result).toEqual({
			_and: [
				{
					_or: [
						{ _and: [{ author: { id: { _in: [] } } }] },
						{ _and: [{ author: { _null: true } }, { version_ref_author: { version_type: { _eq: 'draft' } } }] },
					],
				},
			],
		});
	});

	test('nests m2o filters on related collections without versions', () => {
		expect(rewrite({ category: { name: { _eq: 'News' } } } as Filter).result).toEqual({
			category: { name: { _eq: 'News' } },
		});
	});

	test('requires the related item to exist if no conditions are left', () => {
		expect(rewrite({ category: { directus_version: { type: { _eq: 'published' } } } } as Filter).result).toEqual({
			category: { _nnull: true },
		});
	});

	test("doesn't follow references to versions if they're disabled", () => {
		const { result, shadows } = rewrite({ author: { name: { _eq: 'Jane' } } } as Filter, { references: false });

		expect(result).toEqual({ author: { name: { _eq: 'Jane' } } });
		expect(shadows).toEqual([]);
	});

	test('filters o2m relations on the live related items', () => {
		expect(rewrite({ tags: { directus_version: { type: { _eq: 'draft' } } } } as Filter).result).toEqual({
			tags: { _and: [{ id: { _in: [] } }] },
		});
	});

	test('keeps fields that are no relation', () => {
		expect(rewrite({ title: { _eq: 'a' }, unknown: { nested: true } } as Filter).result).toEqual({
			title: { _eq: 'a' },
			unknown: { nested: true },
		});
	});
});

describe('nestOrExists', () => {
	test('nests the filter under the field', () => {
		expect(nestOrExists('author', { name: { _eq: 'Jane' } } as Filter)).toEqual({ author: { name: { _eq: 'Jane' } } });
	});

	test('requires the related item to exist for empty filters', () => {
		expect(nestOrExists('author', {})).toEqual({ author: { _nnull: true } });
	});
});

describe('nestFilter', () => {
	test('nests a single condition', () => {
		expect(nestFilter('author', { name: { _eq: 'Jane' } } as Filter)).toEqual({ author: { name: { _eq: 'Jane' } } });
	});

	test('splits multiple conditions into an _and', () => {
		expect(nestFilter('author', { name: { _eq: 'Jane' }, id: { _gt: 1 } } as Filter)).toEqual({
			_and: [{ author: { name: { _eq: 'Jane' } } }, { author: { id: { _gt: 1 } } }],
		});
	});

	test('moves logical operators above the field', () => {
		expect(nestFilter('author', { _or: [{ name: { _eq: 'a' } }, { name: { _eq: 'b' } }] } as Filter)).toEqual({
			_or: [{ author: { name: { _eq: 'a' } } }, { author: { name: { _eq: 'b' } } }],
		});
	});
});

describe('isFieldCondition', () => {
	test.each([
		[{ _null: true }, true],
		[{ _eq: 1, _neq: 2 }, true],
		[{ name: { _eq: 'a' } }, false],
		[{ _and: [] }, false],
		[{ _some: {} }, false],
	])('%o → %s', (value, expected) => {
		expect(isFieldCondition(value)).toBe(expected);
	});
});

describe('matchesPublishedSystemFields', () => {
	test('matches conditions met by published system fields', () => {
		expect(matchesPublishedSystemFields({ type: { _eq: 'published' }, id: { _null: true } })).toBe(true);
		expect(matchesPublishedSystemFields({})).toBe(true);
	});

	test("doesn't match conditions published system fields don't meet", () => {
		expect(matchesPublishedSystemFields({ type: { _eq: 'published' }, id: { _nnull: true } })).toBe(false);
	});

	test('throws on unknown keys', () => {
		expect(() => matchesPublishedSystemFields({ unknown: { _eq: 1 } })).toThrow();
	});
});

describe('matchesOperator', () => {
	test.each([
		['published', '_eq', 'published', true],
		['published', '_eq', 'draft', false],
		['published', '_neq', 'draft', true],
		['published', '_in', ['draft', 'published'], true],
		['published', '_in', 'published', true],
		['published', '_nin', ['draft'], true],
		[null, '_null', true, true],
		[null, '_null', 'false', false],
		[null, '_empty', '1', true],
		[null, '_nnull', true, false],
		['published', '_nempty', true, true],
		['published', '_contains', 'PUB', true],
		['published', '_icontains', 'xyz', false],
		['published', '_starts_with', 'pub', true],
		['published', '_iends_with', 'SHED', true],
		[null, '_contains', 'a', false],
		[null, '_gt', 1, false],
	])('%s %s %o → %s', (value, operator, argument, expected) => {
		expect(matchesOperator(value, operator, argument)).toBe(expected);
	});

	test('throws on unsupported operators for non null values', () => {
		expect(() => matchesOperator('published', '_gt', 'a')).toThrow(
			'Operator "_gt" isn\'t supported on "directus_version" of live items',
		);
	});
});
