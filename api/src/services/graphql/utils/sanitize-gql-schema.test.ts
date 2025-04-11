import { SchemaBuilder } from '@directus/schema-builder';
import { describe, expect, test } from 'vitest';
import { sanitizeGraphqlSchema } from './sanitize-gql-schema.js';

describe('Sanitize graphql schema', () => {
	test('Filters out invalid names', () => {
		const schema = new SchemaBuilder()
			.collection('normal_collection', (c) => {
				c.field('id').id();
			})
			.collection('123table', (c) => {
				c.field('id').id();
			})
			.collection('__underscore', (c) => {
				c.field('id').id();
			})
			.collection('a-dash', (c) => {
				c.field('id').id();
			})
			.collection('Schrödinger', (c) => {
				c.field('id').id();
			})
			.collection('', (c) => {
				c.field('id').id();
			})
			.build();

		const result = sanitizeGraphqlSchema(schema);

		expect(result.collections['normal_collection']).toEqual(schema.collections['normal_collection']);
		expect(result.collections['123table']).toBeUndefined();
		expect(result.collections['__underscore']).toBeUndefined();
		expect(result.collections['a-dash']).toBeUndefined();
		expect(result.collections['Schrödinger']).toBeUndefined();
		expect(result.collections['']).toBeUndefined();
	});

	test('Filters out reserved names', () => {
		const schema = new SchemaBuilder()
			.collection('Subscription', (c) => {
				c.field('id').id();
			})
			.collection('subscription', (c) => {
				c.field('id').id();
			})
			.collection('Mutation', (c) => {
				c.field('id').id();
			})
			.collection('mutation', (c) => {
				c.field('id').id();
			})
			.collection('String', (c) => {
				c.field('id').id();
			})
			.collection('string', (c) => {
				c.field('id').id();
			})
			.build();

		const result = sanitizeGraphqlSchema(schema);

		expect(result.collections['Subscription']).toBeUndefined();
		expect(result.collections['subscription']).toEqual(schema.collections['subscription']);
		expect(result.collections['Mutation']).toBeUndefined();
		expect(result.collections['mutation']).toEqual(schema.collections['mutation']);
		expect(result.collections['String']).toBeUndefined();
		expect(result.collections['string']).toEqual(schema.collections['string']);
	});

	test('Keeps valid names', () => {
		const schema = new SchemaBuilder()
			.collection('normal', (c) => {
				c.field('id').id();
			})
			.collection('Normal', (c) => {
				c.field('id').id();
			})
			.collection('NORMAL', (c) => {
				c.field('id').id();
			})
			.collection('t3st_numb3rs', (c) => {
				c.field('id').id();
			})
			.collection('_underscore', (c) => {
				c.field('id').id();
			})
			.build();

		const result = sanitizeGraphqlSchema(schema);

		expect(result.collections['normal']).toEqual(schema.collections['normal']);
		expect(result.collections['Normal']).toEqual(schema.collections['Normal']);
		expect(result.collections['NORMAL']).toEqual(schema.collections['NORMAL']);
		expect(result.collections['t3st_numb3rs']).toEqual(schema.collections['t3st_numb3rs']);
		expect(result.collections['_underscore']).toEqual(schema.collections['_underscore']);
	});

	test('Filters out invalid relations', () => {
		const schema = new SchemaBuilder()
			.collection('normal_collection', (c) => {
				c.field('id').id();
			})
			.collection('junction_table', (c) => {
				c.field('id').id();
			})
			.collection('__invalid_collection', (c) => {
				c.field('id').id();
			})
			.build();

		schema.relations = [
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
		];

		const result = sanitizeGraphqlSchema(schema);

		expect(result.collections['normal_collection']).toEqual(schema.collections['normal_collection']);
		expect(result.collections['junction_table']).toEqual(schema.collections['junction_table']);
		expect(result.collections['__invalid_collection']).toBeUndefined();
		expect(result.relations.length).toBe(0);
	});
});
