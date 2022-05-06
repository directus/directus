import { getColumnPath, ColPathProps } from '../../src/utils/get-column-path';
import { InvalidQueryException } from '../../src/exceptions';
import { DeepPartial } from '@directus/shared/types';

/*
{
  path: [ 'author', 'role', 'name' ],
  collection: 'articles',
  aliasMap: {
    author: { role: { name: 'ljnsv' } },
    ljnsv: { role: { name: 'grenv' } }
  },
  relations: []

grenv.name

{
  path: [ 'author', 'first_name' ],
  collection: 'articles',
  aliasMap: { author: { first_name: 'rnmxt' } },
  relations: []

rnmxt.first_name

{
  path: [ 'item:headings', 'text' ],
  collection: 'pages_sections',
  aliasMap: { 'item:headings': { text: 'yllus' } },
  relations: [
*/

test('Throws an error when the field path is not known in relations', () => {
	const input = {
		path: ['author', 'first_name'],
		collection: 'articles',
		aliasMap: { author: { first_name: 'bjoyu' } },
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
		aliasMap: { 'item:headings': { text: 'abcdef' } },
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
	expect(result).toBe('abcdef.text');
});

test('Returns correct alias for m2o', () => {
	const input: DeepPartial<ColPathProps> = {
		path: ['author', 'role', 'name'],
		collection: 'articles',
		aliasMap: {
			author: { role: { name: 'ljnsv' } },
			ljnsv: { role: { name: 'grenv' } },
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
	expect(result).toBe('grenv.name');
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
	expect(result).toBe('categories.name');
});
