import type { CollectionsOverview, SchemaOverview } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { sanitizeGraphqlSchema } from './sanitize-gql-schema.js';

const mockCollection = (name: string, fields: string[] = []) =>
	({
		collection: name,
		primary: 'id',
		singleton: false,
		sortField: null,
		note: null,
		accountability: null,
		fields: Object.fromEntries([['id', null], ...fields.map((f) => [f, null])]),
	}) as CollectionsOverview[string];

describe('Sanitize graphql schema', () => {
	test('Filters out invalid names', () => {
		const testSchema: SchemaOverview = {
			collections: {
				normal_collection: mockCollection('normal_collection'),
				'123table': mockCollection('123table'),
				__underscore: mockCollection('__underscore'),
				'a-dash': mockCollection('a-dash'),
				Schrödinger: mockCollection('Schrödinger'),
				'': mockCollection(''),
			},
			relations: [],
		};

		const result = sanitizeGraphqlSchema(testSchema);

		expect(result.collections['normal_collection']).toEqual(testSchema.collections['normal_collection']);
		expect(result.collections['123table']).toBeUndefined();
		expect(result.collections['__underscore']).toBeUndefined();
		expect(result.collections['a-dash']).toBeUndefined();
		expect(result.collections['Schrödinger']).toBeUndefined();
		expect(result.collections['']).toBeUndefined();
	});

	test('Filters out reserved names', () => {
		const testSchema: SchemaOverview = {
			collections: {
				Subscription: mockCollection('Subscription'),
				subscription: mockCollection('subscription'),
				Mutation: mockCollection('Mutation'),
				mutation: mockCollection('mutation'),
				String: mockCollection('String'),
				string: mockCollection('string'),
			},
			relations: [],
		};

		const result = sanitizeGraphqlSchema(testSchema);

		expect(result.collections['Subscription']).toBeUndefined();
		expect(result.collections['subscription']).toEqual(testSchema.collections['subscription']);
		expect(result.collections['Mutation']).toBeUndefined();
		expect(result.collections['mutation']).toEqual(testSchema.collections['mutation']);
		expect(result.collections['String']).toBeUndefined();
		expect(result.collections['string']).toEqual(testSchema.collections['string']);
	});

	test('Keeps valid names', () => {
		const testSchema: SchemaOverview = {
			collections: {
				normal: mockCollection('normal'),
				Normal: mockCollection('Normal'),
				NORMAL: mockCollection('NORMAL'),
				t3st_numb3rs: mockCollection('t3st_numb3rs'),
				_underscore: mockCollection('_underscore'),
			},
			relations: [],
		};

		const result = sanitizeGraphqlSchema(testSchema);

		expect(result.collections['normal']).toEqual(testSchema.collections['normal']);
		expect(result.collections['Normal']).toEqual(testSchema.collections['Normal']);
		expect(result.collections['NORMAL']).toEqual(testSchema.collections['NORMAL']);
		expect(result.collections['t3st_numb3rs']).toEqual(testSchema.collections['t3st_numb3rs']);
		expect(result.collections['_underscore']).toEqual(testSchema.collections['_underscore']);
	});

	test('Filters out invalid relations', () => {
		const testSchema: SchemaOverview = {
			collections: {
				normal_collection: mockCollection('normal_collection'),
				junction_table: mockCollection('junction_table'),
				__invalid_collection: mockCollection('__invalid_collection'),
			},
			relations: [
				{
					collection: 'normal_collection',
					field: 'test',
					related_collection: '__invalid_collection',
					meta: null,
					schema: null,
				},
				{
					collection: '__invalid_collection',
					field: 'test',
					related_collection: 'normal_collection',
					meta: null,
					schema: null,
				},
				{
					collection: 'normal_collection',
					field: 'test',
					related_collection: null,
					meta: {
						id: 1,
						many_collection: 'junction_table',
						many_field: 'item',
						one_collection: null,
						one_field: null,
						one_collection_field: 'collection',
						one_allowed_collections: ['__invalid_collection'],
						one_deselect_action: 'delete',
						junction_field: 'invalid_id',
						sort_field: null,
					},
					schema: null,
				},
			],
		};

		const result = sanitizeGraphqlSchema(testSchema);

		expect(result.collections['normal_collection']).toEqual(testSchema.collections['normal_collection']);
		expect(result.collections['junction_table']).toEqual(testSchema.collections['junction_table']);
		expect(result.collections['__invalid_collection']).toBeUndefined();
		expect(result.relations.length).toBe(0);
	});
});
