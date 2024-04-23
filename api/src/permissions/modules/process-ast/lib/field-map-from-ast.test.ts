import type { DeepPartial, SchemaOverview } from '@directus/types';
import { expect, test } from 'vitest';
import type { AST } from '../../../../types/ast.js';
import { fieldMapFromAst } from './field-map-from-ast.js';

test('Extracts fields from children and query', () => {
	const ast: DeepPartial<AST> = {
		type: 'root',
		name: 'articles',
		query: {
			sort: ['-publish_date'],
			filter: {
				_and: [
					{
						categories: {
							_some: {
								name: {
									_eq: 'Recipes',
								},
							},
						},
					},
					{
						status: {
							_eq: 'published',
						},
					},
				],
			},
		},
		children: [
			{ type: 'field', fieldKey: 'title' },
			{
				type: 'm2o',
				fieldKey: 'author',
				children: [
					{
						type: 'field',
						fieldKey: 'name',
					},
				],
				relation: {
					collection: 'authors',
				},
			},
			{
				type: 'a2o',
				fieldKey: 'item',
				names: ['headings', 'paragraphs'],
				children: {
					headings: [{ type: 'field', fieldKey: 'text' }],
					paragraphs: [{ type: 'field', fieldKey: 'body' }],
				},
				query: {
					headings: {
						filter: {
							status: {
								_eq: 'published',
							},
						},
					},
				},
			},
		],
	};

	const schema: DeepPartial<SchemaOverview> = {
		relations: [
			{
				collection: 'categories',
				field: 'article',
				related_collection: 'articles',
				meta: {
					one_field: 'categories',
				}
			}
		],
	};

	const fieldMap = fieldMapFromAst(ast as AST, schema as SchemaOverview);

	const expected = new Map([
		[
			'',
			{
				collection: 'articles',
				fields: new Set([
					'title',
					'author',
					'item',
					'status',
					'categories',
					'publish_date',
				]),
			},
		],
		['author', { collection: 'authors', fields: new Set(['name']) }],
		['categories', { collection: 'categories', fields: new Set(['name']) }],
		['item:headings', { collection: 'headings', fields: new Set(['text', 'status']) }],
		['item:paragraphs', { collection: 'paragraphs', fields: new Set(['body']) }],
	]);

	expect(fieldMap).toEqual(expected);
});
