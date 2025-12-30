import { fieldMapFromAst } from './field-map-from-ast.js';
import type { AST } from '../../../../types/ast.js';
import type { DeepPartial, SchemaOverview } from '@directus/types';
import { expect, test } from 'vitest';

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
			{ type: 'field', fieldKey: 'title', name: 'title' },
			{
				type: 'm2o',
				fieldKey: 'author',
				children: [
					{
						type: 'field',
						fieldKey: 'name',
						name: 'name',
					},
				],
				relation: {
					related_collection: 'authors',
					field: 'author',
				},
			},
			{
				type: 'a2o',
				fieldKey: 'item',
				names: ['headings', 'paragraphs'],
				children: {
					headings: [{ type: 'field', fieldKey: 'text', name: 'text' }],
					paragraphs: [{ type: 'field', fieldKey: 'body', name: 'body' }],
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
				relation: {
					field: 'item',
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
				},
			},
		],
	};

	const fieldMap = fieldMapFromAst(ast as AST, schema as SchemaOverview);

	const expectedRead = new Map([
		['', { collection: 'articles', fields: new Set(['status', 'categories', 'publish_date']) }],
		['categories', { collection: 'categories', fields: new Set(['name']) }],
		['item:headings', { collection: 'headings', fields: new Set(['status']) }],
	]);

	const expectedOther = new Map([
		[
			'',
			{
				collection: 'articles',
				fields: new Set(['title', 'author', 'item']),
			},
		],
		['author', { collection: 'authors', fields: new Set(['name']) }],
		['item:headings', { collection: 'headings', fields: new Set(['text']) }],
		['item:paragraphs', { collection: 'paragraphs', fields: new Set(['body']) }],
	]);

	expect(fieldMap.read).toEqual(expectedRead);
	expect(fieldMap.other).toEqual(expectedOther);
});
