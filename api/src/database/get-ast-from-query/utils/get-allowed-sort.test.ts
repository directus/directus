import type { Accountability, Query, Relation, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { test, expect, vi, beforeEach } from 'vitest';
import { fetchAllowedFields } from '../../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
import { getAllowedSort } from './get-allowed-sort.js';

vi.mock('../../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js');

beforeEach(() => {
	vi.clearAllMocks();

	vi.mocked(fetchAllowedFields).mockResolvedValue([]);
});

test('Returns the primary key if no other field takes precedence', async () => {
	const schema = {
		collections: {
			collection: {
				primary: 'primary',
			},
		},
	} as unknown as SchemaOverview;

	const result = await getAllowedSort({ collection: 'collection', accountability: null }, { schema, knex: {} as Knex });

	expect(result).toEqual(['primary']);
});

test("Returns the collection sort field if it's defined", async () => {
	const schema = {
		collections: {
			collection: {
				primary: 'primary',
				sortField: 'sort',
			},
		},
	} as unknown as SchemaOverview;

	const result = await getAllowedSort({ collection: 'collection', accountability: null }, { schema, knex: {} as Knex });

	expect(result).toEqual(['sort']);
});

test("Returns the relation sort field if it's defined", async () => {
	const schema = {
		collections: {
			collection: {
				primary: 'primary',
				sortField: 'collection-sort',
			},
		},
	} as unknown as SchemaOverview;

	const relation = {
		meta: {
			sort_field: 'relation-sort',
		},
	} as Relation;

	const result = await getAllowedSort(
		{ collection: 'collection', accountability: null, relation },
		{ schema, knex: {} as Knex },
	);

	expect(result).toEqual(['relation-sort']);
});

test('Returns the group by field if it is defined in the query', async () => {
	const schema = {
		collections: {
			collection: {
				primary: 'primary',
				sortField: 'collection-sort',
			},
		},
	} as unknown as SchemaOverview;

	const relation = {
		meta: {
			sort_field: 'relation-sort',
		},
	} as Relation;

	const query = {
		group: ['group-by'],
	} as Query;

	const result = await getAllowedSort(
		{ collection: 'collection', accountability: null, relation, query },
		{ schema, knex: {} as Knex },
	);

	expect(result).toEqual(['group-by']);
});

test('Returns null if the user has no access to the sort field', async () => {
	const schema = {
		collections: {
			collection: {
				primary: 'primary',
				sortField: 'sort',
			},
		},
	} as unknown as SchemaOverview;

	const accountability = { admin: false } as Accountability;

	vi.mocked(fetchAllowedFields).mockResolvedValue([]);

	const result = await getAllowedSort({ collection: 'collection', accountability }, { schema, knex: {} as Knex });

	expect(result).toBeNull();
});

test('Return the sort field if the user has access to it', async () => {
	const schema = {
		collections: {
			collection: {
				primary: 'primary',
				sortField: 'sort',
			},
		},
	} as unknown as SchemaOverview;

	const accountability = { admin: false } as Accountability;

	vi.mocked(fetchAllowedFields).mockResolvedValue(['sort']);

	const result = await getAllowedSort({ collection: 'collection', accountability }, { schema, knex: {} as Knex });

	expect(result).toEqual(['sort']);
});

test('Return the sort field if the user has access to all fields', async () => {
	const schema = {
		collections: {
			collection: {
				primary: 'primary',
				sortField: 'sort',
			},
		},
	} as unknown as SchemaOverview;

	const accountability = { admin: false } as Accountability;

	vi.mocked(fetchAllowedFields).mockResolvedValue(['*']);

	const result = await getAllowedSort({ collection: 'collection', accountability }, { schema, knex: {} as Knex });

	expect(result).toEqual(['sort']);
});

test('Returns the first allowed field if the user has no access to the sort field', async () => {
	const schema = {
		collections: {
			collection: {
				primary: 'primary',
				sortField: 'sort',
			},
		},
	} as unknown as SchemaOverview;

	const accountability = { admin: false } as Accountability;

	vi.mocked(fetchAllowedFields).mockResolvedValue(['allowed-field']);

	const result = await getAllowedSort({ collection: 'collection', accountability }, { schema, knex: {} as Knex });

	expect(result).toEqual(['allowed-field']);
});
