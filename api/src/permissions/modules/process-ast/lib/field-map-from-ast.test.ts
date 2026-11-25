import { SchemaBuilder } from '@directus/schema-builder';
import type { DeepPartial, SchemaOverview } from '@directus/types';
import { describe, expect, it, test } from 'vitest';
import type { AST, FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../../../types/ast.js';
import { fieldMapFromAst } from './field-map-from-ast.js';
import type { FieldMapEntries } from './field-map.js';

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

	const expectedAction = new Map([
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
	expect(fieldMap.action).toEqual(expectedAction);
});

function extract(
	collection: string,
	children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[],
	schema: SchemaOverview,
) {
	return fieldMapFromAst({ type: 'root', name: collection, children, query: {}, cases: [] }, schema);
}

function createFieldMap({ read, action }: { read?: FieldMapEntries; action?: FieldMapEntries } = {}) {
	return { read: new Map(read), action: new Map(action) };
}

describe('Global', () => {
	it('Creates FieldMap entry for passed collection', () => {
		const fieldMap = extract('test-collection', [], {} as SchemaOverview);

		expect(fieldMap).toEqual(
			createFieldMap({ action: new Map([['', { collection: 'test-collection', fields: new Set() }]]) }),
		);
	});
});

describe('a2o', () => {
	it('Extracts children for each related collection with the prefixed path', () => {
		const children: Partial<NestedCollectionNode>[] = [
			{
				type: 'a2o',
				fieldKey: 'test-a2o-a',
				names: ['test-collection-a', 'test-collection-b'],
				children: {
					'test-collection-a': [{ type: 'field', fieldKey: 'test-field-key-a', name: 'test-field-name-a' }],
					'test-collection-b': [{ type: 'field', fieldKey: 'test-field-key-b', name: 'test-field-name-b' }],
				},
				relation: {
					field: 'test-a2o-a',
				},
				query: {
					'test-collection-a': {
						filter: {
							'test-filter-field-a': {
								_eq: 'irrelevant',
							},
						},
					},
				},
			},
		] as unknown as Partial<NestedCollectionNode>[];

		const fieldMap = extract('test-collection', children as NestedCollectionNode[], new SchemaBuilder().build());

		expect(fieldMap).toEqual(
			createFieldMap({
				action: new Map([
					['', { collection: 'test-collection', fields: new Set(['test-a2o-a']) }],
					['test-a2o-a:test-collection-a', { collection: 'test-collection-a', fields: new Set(['test-field-name-a']) }],
					['test-a2o-a:test-collection-b', { collection: 'test-collection-b', fields: new Set(['test-field-name-b']) }],
				]),
				read: new Map([
					[
						'test-a2o-a:test-collection-a',
						{ collection: 'test-collection-a', fields: new Set(['test-filter-field-a']) },
					],
				]),
			}),
		);
	});

	it('Extracts fields used in query', () => {
		const children: Partial<NestedCollectionNode>[] = [
			{
				type: 'a2o',
				fieldKey: 'test-a2o-a',
				names: ['test-collection-a', 'test-collection-b'],
				children: {
					'test-collection-a': [{ type: 'field', fieldKey: 'test-field-key-a', name: 'test-field-name-a' }],
					'test-collection-b': [{ type: 'field', fieldKey: 'test-field-key-b', name: 'test-field-name-b' }],
				},
				relation: {
					field: 'test-a2o-a',
				},
				query: {},
			},
			{
				type: 'a2o',
				fieldKey: 'test-a2o-b',
				names: ['test-collection-a', 'test-collection-c'],
				children: {
					'test-collection-a': [{ type: 'field', fieldKey: 'test-field-key-a2', name: 'test-field-name-a2' }],
					'test-collection-c': [{ type: 'field', fieldKey: 'test-field-key-c', name: 'test-field-name-c' }],
				},
				relation: {
					field: 'test-a2o-b',
				},
				query: {},
			},
		] as unknown as Partial<NestedCollectionNode>[];

		const fieldMap = extract('test-collection', children as NestedCollectionNode[], {} as SchemaOverview);

		expect(fieldMap).toEqual(
			createFieldMap({
				action: new Map([
					['', { collection: 'test-collection', fields: new Set(['test-a2o-a', 'test-a2o-b']) }],
					['test-a2o-a:test-collection-a', { collection: 'test-collection-a', fields: new Set(['test-field-name-a']) }],
					['test-a2o-a:test-collection-b', { collection: 'test-collection-b', fields: new Set(['test-field-name-b']) }],
					[
						'test-a2o-b:test-collection-a',
						{ collection: 'test-collection-a', fields: new Set(['test-field-name-a2']) },
					],
					['test-a2o-b:test-collection-c', { collection: 'test-collection-c', fields: new Set(['test-field-name-c']) }],
				]),
			}),
		);
	});
});

describe('m2o', () => {
	it('Extract children with correct path', () => {
		const children: DeepPartial<NestedCollectionNode>[] = [
			{
				type: 'm2o',
				fieldKey: 'test-m2o-a',
				relation: {
					field: 'test-m2o-a',
					related_collection: 'test-related-collection-a',
				},
				children: [
					{ type: 'field', fieldKey: 'test-field-key-a', name: 'test-field-name-a' },
					{ type: 'field', fieldKey: 'test-field-key-b', name: 'test-field-name-b' },
				],
			},
			{
				type: 'm2o',
				fieldKey: 'test-m2o-b',
				relation: {
					field: 'test-m2o-b',
					related_collection: 'test-related-collection-b',
				},
				children: [
					{ type: 'field', fieldKey: 'test-field-key-a', name: 'test-field-name-a' },
					{ type: 'field', fieldKey: 'test-field-key-b', name: 'test-field-name-b' },
				],
			},
		];

		const fieldMap = extract('test-collection', children as NestedCollectionNode[], {} as SchemaOverview);

		expect(fieldMap).toEqual(
			createFieldMap({
				action: new Map([
					['', { collection: 'test-collection', fields: new Set(['test-m2o-a', 'test-m2o-b']) }],
					[
						'test-m2o-a',
						{ collection: 'test-related-collection-a', fields: new Set(['test-field-name-a', 'test-field-name-b']) },
					],
					[
						'test-m2o-b',
						{ collection: 'test-related-collection-b', fields: new Set(['test-field-name-a', 'test-field-name-b']) },
					],
				]),
			}),
		);
	});

	it('Extracts fields used in query', () => {
		const children: DeepPartial<NestedCollectionNode>[] = [
			{
				type: 'm2o',
				fieldKey: 'test-m2o-a',
				relation: {
					field: 'test-m2o-a',
					related_collection: 'test-related-collection-a',
				},
				children: [{ type: 'field', fieldKey: 'test-field-key-a', name: 'test-field-name-a' }],
				query: {
					filter: {
						'test-filter-field-a': {
							_eq: 'hi',
						},
					},
				},
			},
		];

		const fieldMap = extract('test-collection', children as NestedCollectionNode[], new SchemaBuilder().build());

		expect(fieldMap).toEqual(
			createFieldMap({
				action: new Map([
					['', { collection: 'test-collection', fields: new Set(['test-m2o-a']) }],
					['test-m2o-a', { collection: 'test-related-collection-a', fields: new Set(['test-field-name-a']) }],
				]),
				read: new Map([
					['test-m2o-a', { collection: 'test-related-collection-a', fields: new Set(['test-filter-field-a']) }],
				]),
			}),
		);
	});
});

describe('o2m', () => {
	it('Extract children with correct path', () => {
		const children: DeepPartial<NestedCollectionNode>[] = [
			{
				type: 'o2m',
				fieldKey: 'test-o2m-a',
				relation: {
					collection: 'test-related-collection-a',
					meta: {
						one_field: 'test-o2m-a',
					},
				},
				children: [
					{ type: 'field', fieldKey: 'test-field-key-a', name: 'test-field-name-a' },
					{ type: 'field', fieldKey: 'test-field-key-b', name: 'test-field-name-b' },
				],
			},
			{
				type: 'o2m',
				fieldKey: 'test-o2m-b',
				relation: {
					collection: 'test-related-collection-b',
					meta: {
						one_field: 'test-o2m-b',
					},
				},
				children: [
					{ type: 'field', fieldKey: 'test-field-key-a', name: 'test-field-name-a' },
					{ type: 'field', fieldKey: 'test-field-key-b', name: 'test-field-name-b' },
				],
			},
		];

		const fieldMap = extract('test-collection', children as NestedCollectionNode[], {} as SchemaOverview);

		expect(fieldMap).toEqual(
			createFieldMap({
				action: new Map([
					['', { collection: 'test-collection', fields: new Set(['test-o2m-a', 'test-o2m-b']) }],
					[
						'test-o2m-a',
						{ collection: 'test-related-collection-a', fields: new Set(['test-field-name-a', 'test-field-name-b']) },
					],
					[
						'test-o2m-b',
						{ collection: 'test-related-collection-b', fields: new Set(['test-field-name-a', 'test-field-name-b']) },
					],
				]),
			}),
		);
	});

	it('Extracts fields used in query', () => {
		const children: DeepPartial<NestedCollectionNode>[] = [
			{
				type: 'o2m',
				fieldKey: 'test-o2m-a',
				relation: {
					collection: 'test-related-collection-a',
					meta: {
						one_field: 'test-o2m-a',
					},
				},
				children: [{ type: 'field', fieldKey: 'test-field-key-a', name: 'test-field-name-a' }],
				query: {
					sort: ['-test-sort-field-a'],
				},
			},
		];

		const fieldMap = extract('test-collection', children as NestedCollectionNode[], new SchemaBuilder().build());

		expect(fieldMap).toEqual(
			createFieldMap({
				action: new Map([
					['', { collection: 'test-collection', fields: new Set(['test-o2m-a']) }],
					['test-o2m-a', { collection: 'test-related-collection-a', fields: new Set(['test-field-name-a']) }],
				]),
				read: new Map([
					['test-o2m-a', { collection: 'test-related-collection-a', fields: new Set(['test-sort-field-a']) }],
				]),
			}),
		);
	});
});

describe('functionField', () => {
	it('Adds basic function field to field set', () => {
		const children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[] = [
			{
				type: 'functionField',
				fieldKey: 'year(test-field-key-a)',
				name: 'test-field-name-a',
				query: {},
				relatedCollection: 'test-related-collection',
			},
		] as FunctionFieldNode[];

		const fieldMap = extract('test-collection', children, {} as SchemaOverview);

		expect(fieldMap).toEqual(
			createFieldMap({
				action: new Map([
					['', { collection: 'test-collection', fields: new Set(['test-field-name-a']) }],
					['year(test-field-key-a)', { collection: 'test-related-collection', fields: new Set([]) }],
				]),
			}),
		);
	});

	it('Does not add the parent collection for json functions', () => {
		const children = [
			{
				type: 'functionField',
				fieldKey: 'json(metadata, color)',
				name: 'json(metadata, color)',
				query: {},
				relatedCollection: 'test-collection',
			},
		] as FunctionFieldNode[];

		const fieldMap = extract('test-collection', children, {} as SchemaOverview);

		expect(fieldMap).toEqual(
			createFieldMap({
				action: new Map([['', { collection: 'test-collection', fields: new Set(['metadata']) }]]),
			}),
		);
	});
});

describe('field', () => {
	it('Adds basic fields to field set', () => {
		const children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[] = [
			{ type: 'field', fieldKey: 'test-field-key-a', name: 'test-field-name-a' },
			{ type: 'field', fieldKey: 'test-field-key-b', name: 'test-field-name-b' },
		] as FieldNode[];

		const fieldMap = extract('test-collection', children, {} as SchemaOverview);

		expect(fieldMap).toEqual(
			createFieldMap({
				action: new Map([
					['', { collection: 'test-collection', fields: new Set(['test-field-name-a', 'test-field-name-b']) }],
				]),
			}),
		);
	});

	it('Strips functions from field keys', () => {
		const children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[] = [
			{ type: 'field', fieldKey: 'someFn(test-field-key-a)', name: 'test-field-name-a' },
		] as FieldNode[];

		const fieldMap = extract('test-collection', children, {} as SchemaOverview);

		expect(fieldMap).toEqual(
			createFieldMap({
				action: new Map([['', { collection: 'test-collection', fields: new Set(['test-field-name-a']) }]]),
			}),
		);
	});
});
