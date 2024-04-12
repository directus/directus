import type { DeepPartial, SchemaOverview } from '@directus/types';
import { describe, expect, it } from 'vitest';
import type { FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../../types/ast.js';
import { extractFieldsFromChildren } from './extract-fields-from-children.js';

describe('Global', () => {
	it('Creates FieldMap entry for passed collection', () => {
		const fieldMap = new Map();

		extractFieldsFromChildren('test-collection', [], fieldMap, {} as SchemaOverview, []);

		expect(fieldMap).toEqual(new Map([['', { collection: 'test-collection', fields: new Set() }]]));
	});

	it('Uses passed path as map key', () => {
		const fieldMap = new Map();

		extractFieldsFromChildren('test-collection', [], fieldMap, {} as SchemaOverview, ['path', 'to', 'fields']);

		expect(fieldMap).toEqual(new Map([['path.to.fields', { collection: 'test-collection', fields: new Set() }]]));
	});
});

describe('a2o', () => {
	it('Extracts children for each related collection with the prefixed path', () => {
		const fieldMap = new Map();

		const children: Partial<NestedCollectionNode>[] = [
			{
				type: 'a2o',
				fieldKey: 'test-a2o-a',
				children: {
					'test-collection-a': [{ type: 'field', fieldKey: 'test-field-key-a', name: 'test-field-name-a' }],
					'test-collection-b': [{ type: 'field', fieldKey: 'test-field-key-b', name: 'test-field-name-b' }],
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
		];

		extractFieldsFromChildren(
			'test-collection',
			children as NestedCollectionNode[],
			fieldMap,
			{ relations: [] } as unknown as SchemaOverview,
			[],
		);

		expect(fieldMap).toEqual(
			new Map([
				['', { collection: 'test-collection', fields: new Set(['test-a2o-a']) }],
				[
					'test-a2o-a:test-collection-a',
					{ collection: 'test-collection-a', fields: new Set(['test-field-key-a', 'test-filter-field-a']) },
				],
				['test-a2o-a:test-collection-b', { collection: 'test-collection-b', fields: new Set(['test-field-key-b']) }],
			]),
		);
	});

	it('Extracts fields used in query', () => {
		const fieldMap = new Map();

		const children: Partial<NestedCollectionNode>[] = [
			{
				type: 'a2o',
				fieldKey: 'test-a2o-a',
				children: {
					'test-collection-a': [{ type: 'field', fieldKey: 'test-field-key-a', name: 'test-field-name-a' }],
					'test-collection-b': [{ type: 'field', fieldKey: 'test-field-key-b', name: 'test-field-name-b' }],
				},
			},
			{
				type: 'a2o',
				fieldKey: 'test-a2o-b',
				children: {
					'test-collection-a': [{ type: 'field', fieldKey: 'test-field-key-a2', name: 'test-field-name-a2' }],
					'test-collection-c': [{ type: 'field', fieldKey: 'test-field-key-c', name: 'test-field-name-c' }],
				},
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
			new Map([
				['', { collection: 'test-collection', fields: new Set(['test-a2o-a', 'test-a2o-b']) }],
				['test-a2o-a:test-collection-a', { collection: 'test-collection-a', fields: new Set(['test-field-key-a']) }],
				['test-a2o-a:test-collection-b', { collection: 'test-collection-b', fields: new Set(['test-field-key-b']) }],
				['test-a2o-b:test-collection-a', { collection: 'test-collection-a', fields: new Set(['test-field-key-a2']) }],
				['test-a2o-b:test-collection-c', { collection: 'test-collection-c', fields: new Set(['test-field-key-c']) }],
			]),
		);
	});
});

describe('m2o', () => {
	it('Extract children with correct path', () => {
		const fieldMap = new Map();

		const children: DeepPartial<NestedCollectionNode>[] = [
			{
				type: 'm2o',
				fieldKey: 'test-m2o-a',
				relation: {
					collection: 'test-related-collection-a',
				},
				children: [
					{ type: 'field', fieldKey: 'test-field-key-a' },
					{ type: 'field', fieldKey: 'test-field-key-b' },
				],
			},
			{
				type: 'm2o',
				fieldKey: 'test-m2o-b',
				relation: {
					collection: 'test-related-collection-b',
				},
				children: [
					{ type: 'field', fieldKey: 'test-field-key-a' },
					{ type: 'field', fieldKey: 'test-field-key-b' },
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
			new Map([
				['', { collection: 'test-collection', fields: new Set(['test-m2o-a', 'test-m2o-b']) }],
				[
					'test-m2o-a',
					{ collection: 'test-related-collection-a', fields: new Set(['test-field-key-a', 'test-field-key-b']) },
				],
				[
					'test-m2o-b',
					{ collection: 'test-related-collection-b', fields: new Set(['test-field-key-a', 'test-field-key-b']) },
				],
			]),
		);
	});

	it('Extracts fields used in query', () => {
		const fieldMap = new Map();

		const children: DeepPartial<NestedCollectionNode>[] = [
			{
				type: 'm2o',
				fieldKey: 'test-m2o-a',
				relation: {
					collection: 'test-related-collection-a',
				},
				children: [{ type: 'field', fieldKey: 'test-field-key-a' }],
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
			{ relations: [] } as unknown as SchemaOverview,
			[],
		);

		expect(fieldMap).toEqual(
			new Map([
				['', { collection: 'test-collection', fields: new Set(['test-m2o-a']) }],
				[
					'test-m2o-a',
					{ collection: 'test-related-collection-a', fields: new Set(['test-field-key-a', 'test-filter-field-a']) },
				],
			]),
		);
	});
});

describe('o2m', () => {
	it('Extract children with correct path', () => {
		const fieldMap = new Map();

		const children: DeepPartial<NestedCollectionNode>[] = [
			{
				type: 'o2m',
				fieldKey: 'test-o2m-a',
				relation: {
					related_collection: 'test-related-collection-a',
				},
				children: [
					{ type: 'field', fieldKey: 'test-field-key-a' },
					{ type: 'field', fieldKey: 'test-field-key-b' },
				],
			},
			{
				type: 'o2m',
				fieldKey: 'test-o2m-b',
				relation: {
					related_collection: 'test-related-collection-b',
				},
				children: [
					{ type: 'field', fieldKey: 'test-field-key-a' },
					{ type: 'field', fieldKey: 'test-field-key-b' },
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
			new Map([
				['', { collection: 'test-collection', fields: new Set(['test-o2m-a', 'test-o2m-b']) }],
				[
					'test-o2m-a',
					{ collection: 'test-related-collection-a', fields: new Set(['test-field-key-a', 'test-field-key-b']) },
				],
				[
					'test-o2m-b',
					{ collection: 'test-related-collection-b', fields: new Set(['test-field-key-a', 'test-field-key-b']) },
				],
			]),
		);
	});

	it('Extracts fields used in query', () => {
		const fieldMap = new Map();

		const children: DeepPartial<NestedCollectionNode>[] = [
			{
				type: 'o2m',
				fieldKey: 'test-o2m-a',
				relation: {
					related_collection: 'test-related-collection-a',
				},
				children: [{ type: 'field', fieldKey: 'test-field-key-a' }],
				query: {
					sort: ['-test-filter-field-a'],
				},
			},
		];

		extractFieldsFromChildren(
			'test-collection',
			children as NestedCollectionNode[],
			fieldMap,
			{ relations: [] } as unknown as SchemaOverview,
			[],
		);

		expect(fieldMap).toEqual(
			new Map([
				['', { collection: 'test-collection', fields: new Set(['test-o2m-a']) }],
				[
					'test-o2m-a',
					{ collection: 'test-related-collection-a', fields: new Set(['test-field-key-a', 'test-filter-field-a']) },
				],
			]),
		);
	});
});

describe('functionField', () => {
	it('Adds basic function field to field set', () => {
		const fieldMap = new Map();

		const children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[] = [
			{
				type: 'functionField',
				fieldKey: 'year(test-field-key-a)',
				name: 'test-field-name-a',
				query: {},
				relatedCollection: 'test-related-collection',
			},
		];

		extractFieldsFromChildren('test-collection', children, fieldMap, {} as SchemaOverview, []);

		expect(fieldMap).toEqual(
			new Map([
				['', { collection: 'test-collection', fields: new Set(['test-field-key-a']) }],
				['year(test-field-key-a)', { collection: 'test-related-collection', fields: new Set([]) }],
			]),
		);
	});

	it('Processes query', () => {
		const fieldMap = new Map();

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
		];

		extractFieldsFromChildren(
			'test-collection',
			children,
			fieldMap,
			{ relations: [] } as unknown as SchemaOverview,
			[],
		);

		expect(fieldMap).toEqual(
			new Map([
				['', { collection: 'test-collection', fields: new Set(['test-field-key-a']) }],
				['year(test-field-key-a)', { collection: 'test-related-collection', fields: new Set(['rating']) }],
			]),
		);
	});
});

describe('field', () => {
	it('Adds basic fields to field set', () => {
		const fieldMap = new Map();

		const children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[] = [
			{ type: 'field', fieldKey: 'test-field-key-a', name: 'test-field-name-a' },
			{ type: 'field', fieldKey: 'test-field-key-b', name: 'test-field-name-b' },
		];

		extractFieldsFromChildren('test-collection', children, fieldMap, {} as SchemaOverview, []);

		expect(fieldMap).toEqual(
			new Map([['', { collection: 'test-collection', fields: new Set(['test-field-key-a', 'test-field-key-b']) }]]),
		);
	});

	it('Strips functions from field keys', () => {
		const fieldMap = new Map();

		const children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[] = [
			{ type: 'field', fieldKey: 'someFn(test-field-key-a)', name: 'test-field-name-a' },
		];

		extractFieldsFromChildren('test-collection', children, fieldMap, {} as SchemaOverview, []);

		expect(fieldMap).toEqual(new Map([['', { collection: 'test-collection', fields: new Set(['test-field-key-a']) }]]));
	});
});
