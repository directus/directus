import { getColumnPath, ColPathProps } from '../../src/utils/get-column-path';
import { InvalidQueryException } from '../../src/exceptions';
import { DeepPartial } from '@directus/shared/types';
import { test, expect } from 'vitest';

/*
{
  path: [ 'author', 'role', 'name' ],
  collection: 'articles',
  aliasMap: {
    author: { alias: 'grenv', collection: 'directus_users' },
	'author.role': { alias: 'ljnsv', collection: 'directus_roles' },
  },
  relations: []

ljnsv.name

{
  path: [ 'author', 'first_name' ],
  collection: 'articles',
  aliasMap: { author: { alias: 'rnmxt', collection: 'authors' } },
  relations: []

rnmxt.first_name

{
  path: [ 'item:headings', 'text' ],
  collection: 'pages_sections',
  aliasMap: { 'item:headings': { alias: 'yllus', collection: 'headings' } },
  relations: []

yllus.text
*/

test('Throws an error when the field path is not known in relations', () => {
	const input = {
		path: ['author', 'first_name'],
		collection: 'articles',
		aliasMap: {},
		relations: [],
	};

	expect(() => getColumnPath(input)).toThrowError(InvalidQueryException);
});

test('Throws an error when an a2o is used without a collection scope', () => {
	const input = {
		path: ['item', 'type'],
		collection: 'pages',
		aliasMap: {},
		relations: [
			{
				collection: 'pages',
				field: 'item',
				related_collection: null,
				meta: {
					one_collection_field: 'collection',
					one_allowed_collections: ['paragraphs', 'headings'],
				},
			},
		],
	} as ColPathProps;

	expect(() => getColumnPath(input)).toThrowError(InvalidQueryException);
});

test('Extracts path scope and returns correct alias for a2o', () => {
	const input: DeepPartial<ColPathProps> = {
		path: ['item:headings', 'text'],
		collection: 'pages',
		aliasMap: { 'item:headings': { alias: 'abcdef', collection: 'headings' } },
		relations: [
			{
				collection: 'pages',
				field: 'item',
				related_collection: null,
				meta: {
					one_collection_field: 'collection',
					one_allowed_collections: ['paragraphs', 'headings'],
				},
			},
		],
	};

	const result = getColumnPath(input as ColPathProps);
	expect(result.columnPath).toBe('abcdef.text');
	expect(result.targetCollection).toBe('headings');
});

test('Returns correct alias for m2o', () => {
	const input: DeepPartial<ColPathProps> = {
		path: ['author', 'role', 'name'],
		collection: 'articles',
		aliasMap: {
			author: { alias: 'ljnsv', collection: 'directus_users' },
			'author.role': { alias: 'grenv', collection: 'directus_roles' },
		},
		relations: [
			{
				collection: 'articles',
				field: 'author',
				related_collection: 'directus_users',
				meta: null,
				schema: null,
			},
			{
				collection: 'directus_users',
				field: 'role',
				related_collection: 'directus_roles',
				meta: null,
				schema: null,
			},
		],
	};

	const result = getColumnPath(input as ColPathProps);
	expect(result.columnPath).toBe('grenv.name');
	expect(result.targetCollection).toBe('directus_roles');
});

test('Returns correct alias for o2m', () => {
	const input: DeepPartial<ColPathProps> = {
		path: ['categories', 'category_id', 'name'],
		collection: 'articles',
		aliasMap: {
			categories: { alias: 'aaaa', collection: 'categories_articles' },
			'categories.category_id': { alias: 'bbbb', collection: 'categories' },
		},
		relations: [
			{
				collection: 'categories_articles',
				field: 'category_id',
				related_collection: 'categories',
				meta: null,
				schema: null,
			},
			{
				collection: 'categories_articles',
				field: 'article_id',
				related_collection: 'articles',
				meta: {
					one_field: 'categories',
				},
				schema: null,
			},
		],
	};

	const result = getColumnPath(input as ColPathProps);
	expect(result.columnPath).toBe('bbbb.name');
	expect(result.targetCollection).toBe('categories');
});

test('Returns correct alias for nested o2m', () => {
	const input: DeepPartial<ColPathProps> = {
		path: ['articles', 'article_id', 'articles', 'article_id', 'name'],
		collection: 'article',
		aliasMap: {
			articles: { alias: 'aaaa', collection: 'article' },
			'articles.article_id': { alias: 'bbbb', collection: 'article' },
			'articles.article_id.articles': { alias: 'cccc', collection: 'article' },
			'articles.article_id.articles.article_id': { alias: 'dddd', collection: 'article' },
		},
		relations: [
			{
				collection: 'articles_o2m',
				field: 'article_id',
				related_collection: 'article',
				meta: {
					many_collection: 'articles_o2m',
					many_field: 'article_id',
					one_collection: 'article',
					one_field: 'articles',
				},
				schema: null,
			},
		],
	};

	const result = getColumnPath(input as ColPathProps);
	expect(result.columnPath).toBe('dddd.name');
	expect(result.targetCollection).toBe('article');
});

test('Returns correct alias for o2m (& uses the table name if no alias exists)', () => {
	const input: DeepPartial<ColPathProps> = {
		path: ['categories', 'category_id', 'name'],
		collection: 'articles',
		aliasMap: {},
		relations: [
			{
				collection: 'categories_articles',
				field: 'category_id',
				related_collection: 'categories',
				meta: null,
				schema: null,
			},
			{
				collection: 'categories_articles',
				field: 'article_id',
				related_collection: 'articles',
				meta: {
					one_field: 'categories',
				},
				schema: null,
			},
		],
	};

	const result = getColumnPath(input as ColPathProps);
	expect(result.columnPath).toBe('categories.name');
	expect(result.targetCollection).toBe('categories');
});

test('Returns correct alias when there are multiple joins to the same table', () => {
	const input: DeepPartial<ColPathProps> = {
		path: ['author', 'secondary_role', 'name'],
		collection: 'articles',
		aliasMap: {
			author: { alias: 'ljnsv', collection: 'directus_users' },
			'author.role': { alias: 'grenv', collection: 'directus_roles' },
			'author.secondary_role': { alias: 'psgwn', collection: 'directus_roles' },
		},
		relations: [
			{
				collection: 'articles',
				field: 'author',
				related_collection: 'directus_users',
				meta: null,
				schema: null,
			},
			{
				collection: 'directus_users',
				field: 'role',
				related_collection: 'directus_roles',
				meta: null,
				schema: null,
			},
			{
				collection: 'directus_users',
				field: 'secondary_role',
				related_collection: 'directus_roles',
				meta: null,
				schema: null,
			},
		],
	};

	const result = getColumnPath(input as ColPathProps);
	expect(result.columnPath).toBe('psgwn.name');
	expect(result.targetCollection).toBe('directus_roles');
});
