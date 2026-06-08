import { SchemaBuilder } from '@directus/schema-builder';
import type { Item } from '@directus/types';
import { describe, expect, test } from 'vitest';
import type { NestedCollectionNode } from '../../../types/ast.js';
import { mergeWithParentItems } from './merge-with-parent-items.js';

describe('m2o', () => {
	const schema = new SchemaBuilder()
		.collection('collection_a', (c) => {
			c.field('primary').id();
			c.field('node').m2o('collection_b');
		})
		.build();

	const nestedNode: NestedCollectionNode = {
		type: 'm2o',
		name: 'm2o',
		children: [],
		query: {},
		fieldKey: 'node',
		relation: schema.relations[0]!,
		parentKey: '',
		relatedKey: '',
		whenCase: [],
		cases: [],
	};

	test('should return null node when no access to node primary key', () => {
		const nestedItem: Item[] = [
			{
				id: null,
				first_name: 'Lorem',
				last_name: 'Ipsum',
			},
			{
				id: null,
				first_name: 'Lorem',
				last_name: 'Ipsum',
			},
		];

		const parentItem: Item[] = [{ id: 1, node: 'nestedPK1' }];

		const items = mergeWithParentItems(schema, nestedItem, parentItem, nestedNode, true);

		expect(items).toEqual([{ id: 1, node: null }]);
	});

	test('should return null node when the node record is not linked to the parent record', () => {
		const nestedItem: Item[] = [
			{
				id: 'nestedPK2',
				first_name: 'Lorem',
				last_name: 'Ipsum',
			},
		];

		const parentItem: Item[] = [{ id: 1, node: 'nestedPK1' }];

		const items = mergeWithParentItems(schema, nestedItem, parentItem, nestedNode, true);

		expect(items).toEqual([{ id: 1, node: null }]);
	});

	test('should return object response for single parentItems record', () => {
		const nestedItem: Item[] = [
			{
				id: 'nestedPK1',
				first_name: 'Lorem',
				last_name: 'Ipsum',
			},
			{
				id: 'nestedPK2',
				first_name: 'Dolor',
				last_name: 'Sat',
			},
		];

		const parentItem: Item[] = [
			{ id: 1, node: 'nestedPK1' },
			{ id: 2, node: 'nestedPK2' },
		];

		const items = mergeWithParentItems(schema, nestedItem, parentItem, nestedNode, true);

		expect(items).toEqual([
			{
				id: 1,
				node: {
					id: 'nestedPK1',
					first_name: 'Lorem',
					last_name: 'Ipsum',
				},
			},
			{
				id: 2,
				node: {
					id: 'nestedPK2',
					first_name: 'Dolor',
					last_name: 'Sat',
				},
			},
		]);
	});

	test('should return array response for multiple parentItems records', () => {
		const nestedItem: Item[] = [
			{
				id: 'nestedPK1',
				first_name: 'Lorem',
				last_name: 'Ipsum',
			},
		];

		const parentItem: Item = { id: 1, node: 'nestedPK1' };

		const items = mergeWithParentItems(schema, nestedItem, parentItem, nestedNode, true);

		expect(items).toEqual({
			id: 1,
			node: {
				id: 'nestedPK1',
				first_name: 'Lorem',
				last_name: 'Ipsum',
			},
		});
	});

	test('should resolve aliased m2o when relation.field holds raw foreign key', () => {
		const nestedItem: Item[] = [{ id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' }];

		const parentItem: Item[] = [{ id: 1, node: 'nestedPK1' }];

		const aliasNode = { ...nestedNode, fieldKey: 'aliased' } as NestedCollectionNode;
		const items = mergeWithParentItems(schema, nestedItem, parentItem, aliasNode, true) as Item[];

		expect(items).toEqual([
			{
				id: 1,
				node: 'nestedPK1',
				aliased: { id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' },
			},
		]);
	});

	test('should resolve both original and aliased m2o fields sharing relation.field', () => {
		const nestedItem: Item[] = [{ id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' }];

		const parentItem: Item[] = [{ id: 1, node: 'nestedPK1' }];

		const originalNode = { ...nestedNode, fieldKey: 'node' } as NestedCollectionNode;
		let items = mergeWithParentItems(schema, nestedItem, parentItem, originalNode, true) as Item[];

		const aliasNode = { ...nestedNode, fieldKey: 'aliased' } as NestedCollectionNode;
		items = mergeWithParentItems(schema, nestedItem, items, aliasNode, true) as Item[];

		expect(items).toEqual([
			{
				id: 1,
				node: { id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' },
				aliased: { id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' },
			},
		]);
	});

	test('should resolve multiple m2o aliases sharing relation.field', () => {
		const nestedItem: Item[] = [{ id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' }];

		const parentItem: Item[] = [{ id: 1, node: 'nestedPK1' }];

		const originalNode = { ...nestedNode, fieldKey: 'node' } as NestedCollectionNode;
		let items = mergeWithParentItems(schema, nestedItem, parentItem, originalNode, true) as Item[];

		const firstAlias = { ...nestedNode, fieldKey: 'a' } as NestedCollectionNode;
		items = mergeWithParentItems(schema, nestedItem, items, firstAlias, true) as Item[];

		const secondAlias = { ...nestedNode, fieldKey: 'b' } as NestedCollectionNode;
		items = mergeWithParentItems(schema, nestedItem, items, secondAlias, true) as Item[];

		expect(items).toEqual([
			{
				id: 1,
				node: { id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' },
				a: { id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' },
				b: { id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' },
			},
		]);
	});
});

describe('o2m', () => {
	const schema = new SchemaBuilder()
		.collection('collection_a', (c) => {
			c.field('id').id();
			c.field('nodes').o2m('collection_b', 'parent_id');
		})
		.build();

	const nestedNode: NestedCollectionNode = {
		type: 'o2m',
		name: 'o2m',
		children: [],
		query: {},
		fieldKey: 'nodes',
		relation: schema.relations[0]!,
		parentKey: '',
		relatedKey: '',
		whenCase: [],
		cases: [],
	};

	test('should return empty nodes array when parent primary key is null', () => {
		const nestedItem: Item[] = [
			{
				id: 'nestedPK1',
				first_name: 'Lorem',
				last_name: 'Ipsum',
				parent_id: 1,
			},
		];

		const parentItem: Item[] = [{ id: null }];

		const items = mergeWithParentItems(schema, nestedItem, parentItem, nestedNode, true);

		expect(items).toEqual([{ id: null, nodes: [] }]);
	});

	test('should return empty nodes array when parent foreign key is null', () => {
		const nestedItem: Item[] = [
			{
				id: 'nestedPK1',
				first_name: 'Lorem',
				last_name: 'Ipsum',
				parent_id: null,
			},
		];

		const parentItem: Item[] = [{ id: 1 }];

		const items = mergeWithParentItems(schema, nestedItem, parentItem, nestedNode, true);

		expect(items).toEqual([
			{
				id: 1,
				nodes: [],
			},
		]);
	});

	test('should return empty nodes array when parent foreign key does not match parent primary key', () => {
		const nestedItem: Item[] = [
			{
				id: 'nestedPK1',
				first_name: 'Lorem',
				last_name: 'Ipsum',
				parent_id: 1,
			},
		];

		const parentItem: Item[] = [{ id: 2 }];

		const items = mergeWithParentItems(schema, nestedItem, parentItem, nestedNode, true);

		expect(items).toEqual([
			{
				id: 2,
				nodes: [],
			},
		]);
	});

	test('should return nodes array when parent primary key and node foreign keys have type mismatch', () => {
		const nestedItem: Item[] = [
			{
				id: '1234',
				first_name: 'Lorem',
				last_name: 'Ipsum',
				parent_id: 1,
			},
		];

		const parentItem: Item[] = [{ id: 1 }];

		const items = mergeWithParentItems(schema, nestedItem, parentItem, nestedNode, true);

		expect(items).toEqual([
			{
				id: 1,
				nodes: [
					{
						id: '1234',
						first_name: 'Lorem',
						last_name: 'Ipsum',
						parent_id: 1,
					},
				],
			},
		]);
	});

	test('should return nodes array', () => {
		const nestedItem: Item[] = [
			{
				id: 1,
				first_name: 'Lorem',
				last_name: 'Ipsum',
				parent_id: 1,
			},
		];

		const parentItem: Item[] = [{ id: 1 }];

		const items = mergeWithParentItems(schema, nestedItem, parentItem, nestedNode, true);

		expect(items).toEqual([
			{
				id: 1,
				nodes: [
					{
						id: 1,
						first_name: 'Lorem',
						last_name: 'Ipsum',
						parent_id: 1,
					},
				],
			},
		]);
	});
});

describe('a2o', () => {
	const schema = new SchemaBuilder()
		.collection('collection_a', (c) => {
			c.field('id').id();
			c.field('item').a2o(['collection_b', 'collection_c']);
		})
		.build();

	const baseNode = {
		type: 'a2o' as const,
		names: ['collection_b', 'collection_c'],
		children: {},
		query: {},
		relation: schema.relations[0]!,
		parentKey: 'id',
		relatedKey: { collection_b: 'id', collection_c: 'id' },
		whenCase: [],
		cases: {},
	};

	test('should merge a2o item into parent', () => {
		const nestedNode = { ...baseNode, fieldKey: 'item' } as NestedCollectionNode;

		const nestedItem = {
			collection_b: [{ id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' }],
			collection_c: [{ id: 'nestedPK2', first_name: 'Dolor', last_name: 'Sat' }],
		};

		const parentItem: Item[] = [
			{ id: 1, item: 'nestedPK1', collection: 'collection_b' },
			{ id: 2, item: 'nestedPK2', collection: 'collection_c' },
		];

		const items = mergeWithParentItems(schema, nestedItem, parentItem, nestedNode, true);

		expect(items).toEqual([
			{ id: 1, item: { id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' }, collection: 'collection_b' },
			{ id: 2, item: { id: 'nestedPK2', first_name: 'Dolor', last_name: 'Sat' }, collection: 'collection_c' },
		]);
	});

	test('should merge a2o item into parent using field alias', () => {
		const nestedNode = { ...baseNode, fieldKey: 'c' } as NestedCollectionNode;

		const nestedItem = {
			collection_b: [{ id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' }],
		};

		const parentItem: Item[] = [{ id: 1, item: 'nestedPK1', collection: 'collection_b' }];

		const items = mergeWithParentItems(schema, nestedItem, parentItem, nestedNode, true);

		expect(items).toEqual([
			{
				id: 1,
				item: 'nestedPK1',
				collection: 'collection_b',
				c: { id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' },
			},
		]);
	});

	test('should return null when no matching nested item is found', () => {
		const nestedNode = { ...baseNode, fieldKey: 'item' } as NestedCollectionNode;

		const nestedItem = {
			collection_b: [{ id: 'nestedPK2', first_name: 'Dolor', last_name: 'Sat' }],
		};

		const parentItem: Item[] = [{ id: 1, item: 'nestedPK1', collection: 'collection_b' }];

		const items = mergeWithParentItems(schema, nestedItem, parentItem, nestedNode, true);

		expect(items).toEqual([{ id: 1, item: null, collection: 'collection_b' }]);
	});

	test('should return null when collection is not present in nestedItem', () => {
		const nestedNode = { ...baseNode, fieldKey: 'item' } as NestedCollectionNode;

		const nestedItem = {
			collection_b: [{ id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' }],
		};

		const parentItem: Item[] = [{ id: 1, item: 'nestedPK2', collection: 'collection_c' }];

		const items = mergeWithParentItems(schema, nestedItem, parentItem, nestedNode, true);

		expect(items).toEqual([{ id: 1, item: null, collection: 'collection_c' }]);
	});

	test('should resolve both original and aliased a2o fields sharing relation.field', () => {
		const nestedItem = {
			collection_b: [{ id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' }],
		};

		const parentItem: Item[] = [{ id: 1, item: 'nestedPK1', collection: 'collection_b' }];

		const firstNode = { ...baseNode, fieldKey: 'item' } as NestedCollectionNode;
		let items = mergeWithParentItems(schema, nestedItem, parentItem, firstNode, true) as Item[];

		const secondNode = { ...baseNode, fieldKey: 'any' } as NestedCollectionNode;
		items = mergeWithParentItems(schema, nestedItem, items, secondNode, true) as Item[];

		expect(items).toEqual([
			{
				id: 1,
				collection: 'collection_b',
				item: { id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' },
				any: { id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' },
			},
		]);
	});

	test('should resolve multiple a2o aliases sharing relation.field', () => {
		const nestedItem = {
			collection_b: [{ id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' }],
		};

		const parentItem: Item[] = [{ id: 1, item: 'nestedPK1', collection: 'collection_b' }];

		const originalNode = { ...baseNode, fieldKey: 'item' } as NestedCollectionNode;
		let items = mergeWithParentItems(schema, nestedItem, parentItem, originalNode, true) as Item[];

		const firstAlias = { ...baseNode, fieldKey: 'a' } as NestedCollectionNode;
		items = mergeWithParentItems(schema, nestedItem, items, firstAlias, true) as Item[];

		const secondAlias = { ...baseNode, fieldKey: 'b' } as NestedCollectionNode;
		items = mergeWithParentItems(schema, nestedItem, items, secondAlias, true) as Item[];

		expect(items).toEqual([
			{
				id: 1,
				collection: 'collection_b',
				item: { id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' },
				a: { id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' },
				b: { id: 'nestedPK1', first_name: 'Lorem', last_name: 'Ipsum' },
			},
		]);
	});
});
