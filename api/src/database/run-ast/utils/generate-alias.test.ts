import {
	generateAlias,
	generateJoinAlias,
	generateQueryAlias,
	generateRelationalQueryAlias,
} from './generate-alias.js';
import type { FnHelperOptions } from '../../helpers/fn/types.js';
import type { Query } from '@directus/types';
import { expect, test } from 'vitest';

test('generateAlias without context returns random alias', () => {
	const alias1 = generateAlias();
	const alias2 = generateAlias();

	expect(alias1).not.toBe(alias2);
});

test('generateAlias with context returns deterministic alias', () => {
	const context = 'test-context';
	const alias1 = generateAlias(context);
	const alias2 = generateAlias(context);

	// Should be deterministic - same context produces same alias
	expect(alias1).toBe(alias2);
	expect(alias1).toMatch(/^[a-z]{5}$/);
});

test('generateAlias with different contexts produces different aliases', () => {
	const alias1 = generateAlias('context1');
	const alias2 = generateAlias('context2');

	expect(alias1).not.toBe(alias2);
	expect(alias1).toMatch(/^[a-z]{5}$/);
	expect(alias2).toMatch(/^[a-z]{5}$/);
});

test('generateQueryAlias creates deterministic alias from query parameters', () => {
	const table = 'articles';

	const query: Query = {
		sort: ['title'],
		group: ['category'],
		aggregate: { count: ['id'] },
	};

	const path = 'author';

	const alias1 = generateQueryAlias(table, query, path);
	const alias2 = generateQueryAlias(table, query, path);

	// Should be deterministic
	expect(alias1).toBe(alias2);
	expect(alias1).toMatch(/^[a-z]{5}$/);
});

test('generateQueryAlias with different queries produces different aliases', () => {
	const table = 'articles';
	const query1: Query = { sort: ['title'] };
	const query2: Query = { sort: ['created_at'] };

	const alias1 = generateQueryAlias(table, query1);
	const alias2 = generateQueryAlias(table, query2);

	expect(alias1).not.toBe(alias2);
});

test('generateQueryAlias ignores execution parameters', () => {
	const table = 'articles';

	const query1: Query = {
		sort: ['title'],
		limit: 10,
		offset: 0,
		page: 1,
		search: 'test',
		filter: { title: { _eq: 'test' } },
	};

	const query2: Query = {
		sort: ['title'],
		limit: 20,
		offset: 10,
		page: 2,
		search: 'different',
		filter: { title: { _eq: 'different' } },
	};

	const alias1 = generateQueryAlias(table, query1);
	const alias2 = generateQueryAlias(table, query2);

	// Should be the same because execution parameters are ignored
	expect(alias1).toBe(alias2);
});

test('generateRelationalQueryAlias creates deterministic alias', () => {
	const table = 'articles';
	const column = 'author';
	const collectionName = 'authors';

	const options: FnHelperOptions = {
		relationalCountOptions: {
			query: {
				filter: { status: { _eq: 'published' } },
			},
			cases: [],
			permissions: [],
		},
		type: undefined,
		originalCollectionName: undefined,
	};

	const alias1 = generateRelationalQueryAlias(table, column, collectionName, options);
	const alias2 = generateRelationalQueryAlias(table, column, collectionName, options);

	expect(alias1).toBe(alias2);
	expect(alias1).toMatch(/^[a-z]{5}$/);
});

test('generateRelationalQueryAlias with different options produces different aliases', () => {
	const table = 'articles';
	const column = 'author';
	const collectionName = 'authors';

	const options1: FnHelperOptions = {
		relationalCountOptions: {
			query: { filter: { status: { _eq: 'published' } } },
			cases: [],
			permissions: [],
		},
		type: undefined,
		originalCollectionName: undefined,
	};

	const options2: FnHelperOptions = {
		relationalCountOptions: {
			query: { filter: { status: { _eq: 'draft' } } },
			cases: [],
			permissions: [],
		},
		type: undefined,
		originalCollectionName: undefined,
	};

	const alias1 = generateRelationalQueryAlias(table, column, collectionName, options1);
	const alias2 = generateRelationalQueryAlias(table, column, collectionName, options2);

	expect(alias1).not.toBe(alias2);
});

test('generateRelationalQueryAlias without options', () => {
	const table = 'articles';
	const column = 'author';
	const collectionName = 'authors';

	const alias1 = generateRelationalQueryAlias(table, column, collectionName);
	const alias2 = generateRelationalQueryAlias(table, column, collectionName);

	expect(alias1).toBe(alias2);
	expect(alias1).toMatch(/^[a-z]{5}$/);
});

test('generateJoinAlias creates deterministic alias from join parameters', () => {
	const collection = 'articles';
	const path = ['author', 'profile'];
	const relationType = 'o2m';
	const parentFields = 'id,title';

	const alias1 = generateJoinAlias(collection, path, relationType, parentFields);
	const alias2 = generateJoinAlias(collection, path, relationType, parentFields);

	expect(alias1).toBe(alias2);
	expect(alias1).toMatch(/^[a-z]{5}$/);
});

test('generateJoinAlias with different parameters produces different aliases', () => {
	const collection = 'articles';

	const alias1 = generateJoinAlias(collection, ['author'], 'o2m', 'id');
	const alias2 = generateJoinAlias(collection, ['author', 'profile'], 'o2m', 'id');
	const alias3 = generateJoinAlias(collection, ['author'], 'm2o', 'id');
	const alias4 = generateJoinAlias(collection, ['author'], 'o2m', 'id,title');

	expect(alias1).not.toBe(alias2);
	expect(alias1).not.toBe(alias3);
	expect(alias1).not.toBe(alias4);
	expect(alias2).not.toBe(alias3);
	expect(alias2).not.toBe(alias4);
	expect(alias3).not.toBe(alias4);
});

test('generateJoinAlias with null relationType', () => {
	const collection = 'articles';
	const path = ['author'];
	const relationType = null;

	const alias1 = generateJoinAlias(collection, path, relationType);
	const alias2 = generateJoinAlias(collection, path, relationType);

	expect(alias1).toBe(alias2);
	expect(alias1).toMatch(/^[a-z]{5}$/);
});

test('generateJoinAlias with empty path', () => {
	const collection = 'articles';
	const path: string[] = [];

	const alias1 = generateJoinAlias(collection, path, null);
	const alias2 = generateJoinAlias(collection, path, null);

	expect(alias1).toMatch(/^[a-z]{5}$/);
	expect(alias1).toBe(alias2);
});

test('all generated aliases are 5 lowercase letters', () => {
	const aliases = [
		generateAlias('test1'),
		generateQueryAlias('table', { sort: ['field'] }),
		generateRelationalQueryAlias('table', 'column', 'collection'),
		generateJoinAlias('collection', ['path'], 'o2m'),
	];

	aliases.forEach((alias) => {
		expect(alias).toMatch(/^[a-z]{5}$/);
	});
});

test('deterministic aliases are consistent across multiple calls', () => {
	const context = 'consistent-test';
	const table = 'articles';
	const query: Query = { sort: ['title'] };
	const collection = 'authors';
	const path = ['profile'];

	// Generate multiple aliases with same parameters
	const aliasResults = Array.from({ length: 10 }, () => ({
		context: generateAlias(context),
		query: generateQueryAlias(table, query),
		relational: generateRelationalQueryAlias(table, 'author', collection),
		join: generateJoinAlias(collection, path, 'o2m'),
	}));

	const firstResult = aliasResults[0]!;

	if (!firstResult) {
		throw new Error('No first result');
	}

	// All should be identical
	aliasResults.forEach((result) => {
		expect(result.context).toBe(firstResult.context);
		expect(result.query).toBe(firstResult.query);
		expect(result.relational).toBe(firstResult.relational);
		expect(result.join).toBe(firstResult.join);
	});
});

test('edge cases for generateAlias', () => {
	const alias1 = generateAlias('');
	expect(alias1).toMatch(/^[a-z]{5}$/);

	// Very long context
	const longContext = 'a'.repeat(1000);
	const alias3 = generateAlias(longContext);
	expect(alias3).toMatch(/^[a-z]{5}$/);

	// Special characters
	const specialContext = '!@#$%^&*()_+-=[]{}|;:,.<>?';
	const alias4 = generateAlias(specialContext);
	expect(alias4).toMatch(/^[a-z]{5}$/);
});

test('edge cases for generateQueryAlias', () => {
	// Empty query
	const alias1 = generateQueryAlias('table', {});
	const alias2 = generateQueryAlias('table', {});
	expect(alias1).toBe(alias2);

	// Query with undefined values
	const query: Query = {
		sort: null,
		group: null,
		aggregate: null,
	};

	const alias3 = generateQueryAlias('table', query);
	expect(alias3).toMatch(/^[a-z]{5}$/);
});

test('edge cases for generateJoinAlias', () => {
	// Empty collection name
	const alias1 = generateJoinAlias('', ['path'], null);
	expect(alias1).toMatch(/^[a-z]{5}$/);

	// Deep path
	const deepPath = Array.from({ length: 10 }, (_, i) => `level${i}`);
	const alias2 = generateJoinAlias('collection', deepPath, 'o2m');
	expect(alias2).toMatch(/^[a-z]{5}$/);
});
