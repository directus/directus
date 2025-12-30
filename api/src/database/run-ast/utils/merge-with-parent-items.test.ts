import { mergeWithParentItems } from './merge-with-parent-items.js';
import type { NestedCollectionNode } from '../../../types/ast.js';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Item } from '@directus/types';
import { describe, expect, test } from 'vitest';

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
