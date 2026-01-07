import { SchemaBuilder } from '@directus/schema-builder';
import type { DeepPartial, SchemaOverview } from '@directus/types';
import { describe, expect, it } from 'vitest';
import type { FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../../../types/ast.js';
import type { FieldMap } from '../types.js';
import { extractFieldsFromChildren } from './extract-fields-from-children.js';

function createFieldMap({ read, other }: Partial<FieldMap> = {}): FieldMap {
	return { read: new Map(read), other: new Map(other) };
}

describe('Global', () => {
	it('Creates FieldMap entry for passed collection', () => {
		const fieldMap = createFieldMap();

		extractFieldsFromChildren('test-collection', [], fieldMap, {} as SchemaOverview, []);

		expect(fieldMap).toEqual(
			createFieldMap({ other: new Map([['', { collection: 'test-collection', fields: new Set() }]]) }),
		);
	});

	it('Uses passed path as map key', () => {
		const fieldMap = createFieldMap();

		extractFieldsFromChildren('test-collection', [], fieldMap, {} as SchemaOverview, ['path', 'to', 'fields']);

		expect(fieldMap).toEqual(
			createFieldMap({ other: new Map([['path.to.fields', { collection: 'test-collection', fields: new Set() }]]) }),
		);
	});
});

describe('a2o', () => {
	it('Extracts children for each related collection with the prefixed path', () => {
		const fieldMap = createFieldMap();

		const children: Partial<NestedCollectionNode>[] = [
			{
				type: 'a2o',
				fieldKey: 'test-a2o-a',
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

		extractFieldsFromChildren(
			'test-collection',
			children as NestedCollectionNode[],
			fieldMap,
			new SchemaBuilder().build(),
			[],
		);

		expect(fieldMap).toEqual(
			createFieldMap({
				other: new Map([
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
		const fieldMap = createFieldMap();

		const children: Partial<NestedCollectionNode>[] = [
			{
				type: 'a2o',
				fieldKey: 'test-a2o-a',
				children: {
					'test-collection-a': [{ type: 'field', fieldKey: 'test-field-key-a', name: 'test-field-name-a' }],
					'test-collection-b': [{ type: 'field', fieldKey: 'test-field-key-b', name: 'test-field-name-b' }],
				},
				relation: {
					field: 'test-a2o-a',
				},
			},
			{
				type: 'a2o',
				fieldKey: 'test-a2o-b',
				children: {
					'test-collection-a': [{ type: 'field', fieldKey: 'test-field-key-a2', name: 'test-field-name-a2' }],
					'test-collection-c': [{ type: 'field', fieldKey: 'test-field-key-c', name: 'test-field-name-c' }],
				},
				relation: {
					field: 'test-a2o-b',
				},
			},
		] as unknown as Partial<NestedCollectionNode>[];

		extractFieldsFromChildren(
			'test-collection',
			children as NestedCollectionNode[],
			fieldMap,
			{} as SchemaOverview,
			[],
		);

		expect(fieldMap).toEqual(
			createFieldMap({
				other: new Map([
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
		const fieldMap = createFieldMap();

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

		extractFieldsFromChildren(
			'test-collection',
			children as NestedCollectionNode[],
			fieldMap,
			{} as SchemaOverview,
			[],
		);

		expect(fieldMap).toEqual(
			createFieldMap({
				other: new Map([
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
		const fieldMap = createFieldMap();

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

		extractFieldsFromChildren(
			'test-collection',
			children as NestedCollectionNode[],
			fieldMap,
			new SchemaBuilder().build(),
			[],
		);

		expect(fieldMap).toEqual(
			createFieldMap({
				other: new Map([
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
		const fieldMap = createFieldMap();

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

		extractFieldsFromChildren(
			'test-collection',
			children as NestedCollectionNode[],
			fieldMap,
			{} as SchemaOverview,
			[],
		);

		expect(fieldMap).toEqual(
			createFieldMap({
				other: new Map([
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
		const fieldMap = createFieldMap();

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

		extractFieldsFromChildren(
			'test-collection',
			children as NestedCollectionNode[],
			fieldMap,
			new SchemaBuilder().build(),
			[],
		);

		expect(fieldMap).toEqual(
			createFieldMap({
				other: new Map([
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
		const fieldMap = createFieldMap();

		const children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[] = [
			{
				type: 'functionField',
				fieldKey: 'year(test-field-key-a)',
				name: 'test-field-name-a',
				query: {},
				relatedCollection: 'test-related-collection',
			},
		] as FunctionFieldNode[];

		extractFieldsFromChildren('test-collection', children, fieldMap, {} as SchemaOverview, []);

		expect(fieldMap).toEqual(
			createFieldMap({
				other: new Map([
					['', { collection: 'test-collection', fields: new Set(['test-field-name-a']) }],
					['year(test-field-key-a)', { collection: 'test-related-collection', fields: new Set([]) }],
				]),
			}),
		);
	});

	it('Processes query', () => {
		const fieldMap = createFieldMap();

		const children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[] = [
			{
				type: 'functionField',
				fieldKey: 'year(test-field-key-a)',
				name: 'test-field-name-a',
				query: {
					sort: ['rating'],
				},
				relatedCollection: 'test-related-collection',
			},
		] as FunctionFieldNode[];

		extractFieldsFromChildren('test-collection', children, fieldMap, new SchemaBuilder().build(), []);

		expect(fieldMap).toEqual(
			createFieldMap({
				other: new Map([
					['', { collection: 'test-collection', fields: new Set(['test-field-name-a']) }],
					['year(test-field-key-a)', { collection: 'test-related-collection', fields: new Set() }],
				]),
				read: new Map([
					['year(test-field-key-a)', { collection: 'test-related-collection', fields: new Set(['rating']) }],
				]),
			}),
		);
	});
});

describe('field', () => {
	it('Adds basic fields to field set', () => {
		const fieldMap = createFieldMap();

		const children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[] = [
			{ type: 'field', fieldKey: 'test-field-key-a', name: 'test-field-name-a' },
			{ type: 'field', fieldKey: 'test-field-key-b', name: 'test-field-name-b' },
		] as FieldNode[];

		extractFieldsFromChildren('test-collection', children, fieldMap, {} as SchemaOverview, []);

		expect(fieldMap).toEqual(
			createFieldMap({
				other: new Map([
					['', { collection: 'test-collection', fields: new Set(['test-field-name-a', 'test-field-name-b']) }],
				]),
			}),
		);
	});

	it('Strips functions from field keys', () => {
		const fieldMap = createFieldMap();

		const children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[] = [
			{ type: 'field', fieldKey: 'someFn(test-field-key-a)', name: 'test-field-name-a' },
		] as FieldNode[];

		extractFieldsFromChildren('test-collection', children, fieldMap, {} as SchemaOverview, []);

		expect(fieldMap).toEqual(
			createFieldMap({
				other: new Map([['', { collection: 'test-collection', fields: new Set(['test-field-name-a']) }]]),
			}),
		);
	});
});
