import { extractFieldsFromQuery } from './extract-fields-from-query.js';
import type { DeepPartial, Query, SchemaOverview } from '@directus/types';
import { expect, test } from 'vitest';

test('Appends paths used in query to FieldMap', () => {
	const fieldMap = { read: new Map(), other: new Map() };

	const query: Query = {
		filter: {
			author: {
				_eq: 1,
			},
		},
		sort: ['id'],
	};

	const schema: DeepPartial<SchemaOverview> = { relations: [] };

	extractFieldsFromQuery('test-collection', query, fieldMap, schema as SchemaOverview);

	expect(fieldMap.read).toEqual(new Map([['', { collection: 'test-collection', fields: new Set(['author', 'id']) }]]));
});

test('Appends nested paths based on m2o relational information', () => {
	const fieldMap = { read: new Map(), other: new Map() };

	const query: Query = {
		filter: {
			author: {
				name: {
					_eq: 'Rijk',
				},
			},
		},
		sort: ['id'],
	};

	const schema: DeepPartial<SchemaOverview> = {
		relations: [
			{
				collection: 'test-collection',
				field: 'author',
				related_collection: 'test-collection-authors',
			},
		],
	};

	extractFieldsFromQuery('test-collection', query, fieldMap, schema as SchemaOverview);

	expect(fieldMap.read).toEqual(
		new Map([
			['', { collection: 'test-collection', fields: new Set(['author', 'id']) }],
			['author', { collection: 'test-collection-authors', fields: new Set(['name']) }],
		]),
	);
});

test('Appends nested paths based on o2m relational information', () => {
	const fieldMap = { read: new Map(), other: new Map() };

	const query: Query = {
		filter: {
			categories: {
				_some: {
					name: {
						_eq: 'recipe',
					},
				},
			},
		},
		sort: ['id'],
	};

	const schema: DeepPartial<SchemaOverview> = {
		relations: [
			{
				collection: 'test-collection-categories',
				field: 'article',
				related_collection: 'test-collection',
				meta: {
					one_field: 'categories',
				},
			},
		],
	};

	extractFieldsFromQuery('test-collection', query, fieldMap, schema as SchemaOverview);

	expect(fieldMap.read).toEqual(
		new Map([
			['', { collection: 'test-collection', fields: new Set(['categories', 'id']) }],
			['categories', { collection: 'test-collection-categories', fields: new Set(['name']) }],
		]),
	);
});

test('Appends nested paths based on collection scope in a2o filter', () => {
	const fieldMap = { read: new Map(), other: new Map() };

	const query: Query = {
		filter: {
			'item:headings': {
				title: {
					_eq: 'Hello World',
				},
			},
		},
	};

	const schema: DeepPartial<SchemaOverview> = {
		relations: [],
	};

	extractFieldsFromQuery('test-collection', query, fieldMap, schema as SchemaOverview);

	expect(fieldMap.read).toEqual(
		new Map([
			['', { collection: 'test-collection', fields: new Set(['item']) }],
			['item:headings', { collection: 'headings', fields: new Set(['title']) }],
		]),
	);
});

test('All together now', () => {
	const fieldMap = { read: new Map(), other: new Map() };

	const query: Query = {
		filter: {
			_or: [
				{
					'item:headings': {
						categories: {
							_some: {
								created_by: {
									name: {
										_eq: 'Rijk',
									},
								},
							},
						},
					},
				},
				{
					'item:headings': {
						status: {
							_eq: 'published',
						},
					},
				},
			],
		},
	};

	const schema: DeepPartial<SchemaOverview> = {
		relations: [
			{
				collection: 'categories',
				field: 'heading',
				related_collection: 'headings',
				meta: {
					one_field: 'categories',
				},
			},
			{
				collection: 'categories',
				field: 'created_by',
				related_collection: 'authors',
			},
		],
	};

	extractFieldsFromQuery('test-collection', query, fieldMap, schema as SchemaOverview);

	expect(fieldMap.read).toEqual(
		new Map([
			['', { collection: 'test-collection', fields: new Set(['item']) }],
			['item:headings', { collection: 'headings', fields: new Set(['categories', 'status']) }],
			['item:headings.categories', { collection: 'categories', fields: new Set(['created_by']) }],
			['item:headings.categories.created_by', { collection: 'authors', fields: new Set(['name']) }],
		]),
	);
});
