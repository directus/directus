import { expect, test } from 'vitest';
import { getCollectionMetaUpdates } from './get-collection-meta-updates.js';

test('get no updates for empty list', () => {
	const updates = getCollectionMetaUpdates('collection', 'field', [], {}, new Map());

	expect(updates).toEqual([]);
});

test('updates to archive_field and sort_field for root collection to null if they are deleted field', () => {
	const updates = getCollectionMetaUpdates(
		'collection',
		'field',
		[
			{
				collection: 'collection',
				archive_field: 'field',
				sort_field: 'field',
				item_duplication_fields: null,
			},
		],
		{},
		new Map(),
	);

	expect(updates).toEqual([
		{
			updates: {
				archive_field: null,
				sort_field: null,
			},
			collection: 'collection',
		},
	]);
});

test('no updates to archive_field and sort_field for root collection if they are not the deleted field', () => {
	const updates = getCollectionMetaUpdates(
		'collection',
		'field',
		[
			{
				collection: 'collection',
				archive_field: 'field1',
				sort_field: 'field2',
				item_duplication_fields: null,
			},
		],
		{},
		new Map(),
	);

	expect(updates).toEqual([]);
});

test('no updates to archive_field, sort_field and item_duplication_fields for root collection if they are null', () => {
	const updates = getCollectionMetaUpdates(
		'collection',
		'field',
		[
			{
				collection: 'collection',
				archive_field: null,
				sort_field: null,
				item_duplication_fields: null,
			},
		],
		{},
		new Map(),
	);

	expect(updates).toEqual([]);
});

test('updates item_duplication_fields to null for root collection if it contains deleted non relational field', () => {
	const updates = getCollectionMetaUpdates(
		'collection',
		'field',
		[
			{
				collection: 'collection',
				archive_field: null,
				sort_field: null,
				item_duplication_fields: ['field'],
			},
		],
		{
			collection: {
				fields: {
					field: {},
				},
			},
		} as any,
		new Map(),
	);

	expect(updates).toEqual([
		{
			collection: 'collection',
			updates: {
				item_duplication_fields: null,
			},
		},
	]);
});

test('updates item_duplication_fields to null for root collection if it contains invalid relational field', () => {
	const updates = getCollectionMetaUpdates(
		'collection',
		'field',
		[
			{
				collection: 'collection',
				archive_field: null,
				sort_field: null,
				item_duplication_fields: ['relation.field1'],
			},
		],
		{
			collection: {
				fields: {
					field: {},
				},
			},
		} as any,
		new Map([]),
	);

	expect(updates).toEqual([
		{
			collection: 'collection',
			updates: {
				item_duplication_fields: null,
			},
		},
	]);
});

test('updates item_duplication_fields to null for root collection if it contains nested field', () => {
	const updates = getCollectionMetaUpdates(
		'collection',
		'field',
		[
			{
				collection: 'collection',
				archive_field: null,
				sort_field: null,
				item_duplication_fields: ['a.b.field'],
			},
		],
		{
			collection: {
				fields: {
					field: {},
				},
			},
			a: {
				fields: {
					b: {},
				},
			},
		} as any,
		new Map([
			['collection:a', 'A'],
			['a:b', 'collection'],
		]),
	);

	expect(updates).toEqual([
		{
			collection: 'collection',
			updates: {
				item_duplication_fields: null,
			},
		},
	]);
});

test('no updates if the item_duplication_fields remains the same after processing', () => {
	const updates = getCollectionMetaUpdates(
		'collectionA',
		'field',
		[
			{
				collection: 'collectionA',
				archive_field: null,
				sort_field: null,
				item_duplication_fields: ['title', 'a.b'],
			},
		],
		{
			collection: {
				fields: {
					field: {},
					title: {},
					a: {},
				},
			},
			a: {
				fields: {
					b: {},
				},
			},
		} as any,
		new Map([['collection:a', 'a']]),
	);

	expect(updates).toEqual([]);
});

test('updates only the item_duplication_fields that have the deleted field', () => {
	const updates = getCollectionMetaUpdates(
		'collectionA',
		'field',
		[
			{
				collection: 'collectionA',
				archive_field: null,
				sort_field: null,
				item_duplication_fields: ['title'],
			},
			{
				collection: 'collectionB',
				archive_field: null,
				sort_field: null,
				item_duplication_fields: ['a.b.field', 'title', 'a.b'],
			},
		],
		{
			collection: {
				fields: {
					field: {},
					title: {},
				},
			},
			a: {
				fields: {
					b: {},
				},
			},
		} as any,
		new Map([['a:b', 'collection']]),
	);

	expect(updates).toEqual([
		{
			collection: 'collectionB',
			updates: {
				item_duplication_fields: JSON.stringify(['title', 'a.b']),
			},
		},
	]);
});

test('updates the item_duplication_fields and re-stringifies if string provided', () => {
	const updates = getCollectionMetaUpdates(
		'collectionA',
		'field',
		[
			{
				collection: 'collectionA',
				archive_field: null,
				sort_field: null,
				item_duplication_fields: JSON.stringify(['title', 'field']),
			},
		],
		{
			collection: {
				fields: {
					field: {},
					title: {},
				},
			},
		} as any,
		new Map(),
	);

	expect(updates).toEqual([
		{
			collection: 'collectionA',
			updates: {
				item_duplication_fields: JSON.stringify(['title']),
			},
		},
	]);
});

test('updates the item_duplication_fields and sets as string if array is provided', () => {
	const updates = getCollectionMetaUpdates(
		'collectionA',
		'field',
		[
			{
				collection: 'collectionA',
				archive_field: null,
				sort_field: null,
				item_duplication_fields: ['title', 'field'],
			},
		],
		{
			collection: {
				fields: {
					field: {},
					title: {},
				},
			},
		} as any,
		new Map(),
	);

	expect(updates).toEqual([
		{
			collection: 'collectionA',
			updates: {
				item_duplication_fields: JSON.stringify(['title']),
			},
		},
	]);
});

test('updates only the item_duplication_fields that have the deleted field for m2a', () => {
	const updates = getCollectionMetaUpdates(
		'collectionA',
		'title',
		[
			{
				collection: 'collectionA',
				archive_field: null,
				sort_field: null,
				item_duplication_fields: ['title'],
			},
			{
				collection: 'collectionB',
				archive_field: null,
				sort_field: null,
				item_duplication_fields: ['builder.item:collectionA.title', 'builder.item:collectionC.title'],
			},
		],
		{
			collectionA: {
				fields: {
					title: {},
				},
			},
			collectionB: {
				fields: {
					builder: {},
				},
			},
			collectionC: {
				fields: {
					title: {},
				},
			},
		} as any,
		new Map([
			['collectionB:builder', 'collectionD'],
			['collectionD:item:collectionA', 'collectionA'],
			['collectionD:item:collectionC', 'collectionC'],
		]),
	);

	expect(updates).toEqual([
		{
			collection: 'collectionA',
			updates: {
				item_duplication_fields: null,
			},
		},
		{
			collection: 'collectionB',
			updates: {
				item_duplication_fields: JSON.stringify(['builder.item:collectionC.title']),
			},
		},
	]);
});
