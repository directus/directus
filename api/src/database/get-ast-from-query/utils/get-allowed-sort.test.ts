import { getAllowedSort } from './get-allowed-sort.js';
import { fetchAllowedFields } from '../../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability, Query } from '@directus/types';
import type { Knex } from 'knex';
import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js');

beforeEach(() => {
	vi.clearAllMocks();

	vi.mocked(fetchAllowedFields).mockResolvedValue([]);
});

test('Returns the primary key if no other field takes precedence', async () => {
	const schema = new SchemaBuilder()
		.collection('collection', (c) => {
			c.field('primary').id();
		})
		.build();

	const result = await getAllowedSort({ collection: 'collection', accountability: null }, { schema, knex: {} as Knex });

	expect(result).toEqual(['primary']);
});

test("Returns the collection sort field if it's defined", async () => {
	const schema = new SchemaBuilder()
		.collection('collection', (c) => {
			c.field('primary').id();
			c.field('sort').string().sort();
		})
		.build();

	const result = await getAllowedSort({ collection: 'collection', accountability: null }, { schema, knex: {} as Knex });

	expect(result).toEqual(['sort']);
});

test("Returns the relation sort field if it's defined", async () => {
	const schema = new SchemaBuilder()
		.collection('collection', (c) => {
			c.field('primary').id();
			c.field('collection-sort').string().sort();

			c.field('relation-field').m2o('related-collection', undefined, (relation) => {
				relation.options({
					meta: {
						sort_field: 'relation-sort',
					},
				});
			});
		})
		.build();

	const result = await getAllowedSort(
		{ collection: 'collection', accountability: null, relation: schema.relations[0]! },
		{ schema, knex: {} as Knex },
	);

	expect(result).toEqual(['relation-sort']);
});

test('Returns the group by field if it is defined in the query', async () => {
	const schema = new SchemaBuilder()
		.collection('collection', (c) => {
			c.field('primary').id();
			c.field('collection-sort').string().sort();

			c.field('relation-field').m2o('related-collection', undefined, (relation) => {
				relation.options({
					meta: {
						sort_field: 'relation-sort',
					},
				});
			});
		})
		.build();

	const query = {
		group: ['group-by'],
	} as Query;

	const result = await getAllowedSort(
		{ collection: 'collection', accountability: null, relation: schema.relations[0]!, query },
		{ schema, knex: {} as Knex },
	);

	expect(result).toEqual(['group-by']);
});

test('Returns null if the user has no access to the sort field', async () => {
	const schema = new SchemaBuilder()
		.collection('collection', (c) => {
			c.field('primary').id();
			c.field('collection-sort').string().sort();
		})
		.build();

	const accountability = { admin: false } as Accountability;

	vi.mocked(fetchAllowedFields).mockResolvedValue([]);

	const result = await getAllowedSort({ collection: 'collection', accountability }, { schema, knex: {} as Knex });

	expect(result).toBeNull();
});

test('Return the sort field if the user has access to it', async () => {
	const schema = new SchemaBuilder()
		.collection('collection', (c) => {
			c.field('primary').id();
			c.field('collection-sort').string().sort();
		})
		.build();

	const accountability = { admin: false } as Accountability;

	vi.mocked(fetchAllowedFields).mockResolvedValue(['sort']);

	const result = await getAllowedSort({ collection: 'collection', accountability }, { schema, knex: {} as Knex });

	expect(result).toEqual(['sort']);
});

test('Return the sort field if the user has access to all fields', async () => {
	const schema = new SchemaBuilder()
		.collection('collection', (c) => {
			c.field('primary').id();
			c.field('sort').string().sort();
		})
		.build();

	const accountability = { admin: false } as Accountability;

	vi.mocked(fetchAllowedFields).mockResolvedValue(['*']);

	const result = await getAllowedSort({ collection: 'collection', accountability }, { schema, knex: {} as Knex });

	expect(result).toEqual(['sort']);
});

test('Returns the first allowed field if the user has no access to the sort field', async () => {
	const schema = new SchemaBuilder()
		.collection('collection', (c) => {
			c.field('primary').id();
			c.field('sort').string().sort();
		})
		.build();

	const accountability = { admin: false } as Accountability;

	vi.mocked(fetchAllowedFields).mockResolvedValue(['allowed-field']);

	const result = await getAllowedSort({ collection: 'collection', accountability }, { schema, knex: {} as Knex });

	expect(result).toEqual(['allowed-field']);
});
