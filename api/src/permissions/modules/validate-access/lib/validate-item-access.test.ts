import { validateItemAccess } from './validate-item-access.js';
import { fetchPermittedAstRootFields } from '../../../../database/run-ast/modules/fetch-permitted-ast-root-fields.js';
import type { Context } from '../../../types.js';
import { processAst } from '../../process-ast/process-ast.js';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../../../database/run-ast/modules/fetch-permitted-ast-root-fields.js');
vi.mock('../../../../database/run-ast/run-ast.js');
vi.mock('../../process-ast/process-ast.js');

beforeEach(() => {
	vi.clearAllMocks();
});

test('Throws error when primary key does not exist in given collection', async () => {
	const schema = new SchemaBuilder().build();
	const acc = {} as unknown as Accountability;

	await expect(
		validateItemAccess({ accountability: acc, action: 'read', collection: 'collection-a', primaryKeys: [1] }, {
			schema,
		} as Context),
	).rejects.toBeInstanceOf(Error);
});

test('Queries the database', async () => {
	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('field-a').id();
		})
		.build();

	const acc = {} as unknown as Accountability;

	vi.mocked(fetchPermittedAstRootFields).mockResolvedValue([]);

	await expect(
		validateItemAccess({ accountability: acc, action: 'read', collection: 'collection-a', primaryKeys: [1] }, {
			schema,
		} as Context),
	).resolves.toBe(false);

	expect(processAst).toHaveBeenCalledWith(
		{
			accountability: acc,
			action: 'read',
			collection: 'collection-a',
			primaryKeys: [1],
			ast: {
				type: 'root',
				name: 'collection-a',
				query: expect.objectContaining({ limit: 1 }),
				children: [],
				cases: [],
			},
		},
		{ schema },
	);

	expect(fetchPermittedAstRootFields).toHaveBeenCalledWith(
		{
			type: 'root',
			name: 'collection-a',
			children: [],
			cases: [],
			query: {
				filter: {
					'field-a': {
						_in: [1],
					},
				},
				limit: 1,
			},
		},
		{
			schema,
			accountability: acc,
			knex: undefined,
			action: 'read',
		},
	);
});

test('Returns false if no items are returned', async () => {
	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('field-a').id();
		})
		.build();

	const acc = {} as unknown as Accountability;

	vi.mocked(fetchPermittedAstRootFields).mockResolvedValue([]);

	await expect(
		validateItemAccess({ accountability: acc, action: 'read', collection: 'collection-a', primaryKeys: [1] }, {
			schema,
		} as Context),
	).resolves.toBe(false);
});

test('Returns true if the number of returned items matches the number of requested primary keys', async () => {
	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('field-a').id();
		})
		.build();

	const acc = {} as unknown as Accountability;

	vi.mocked(fetchPermittedAstRootFields).mockResolvedValue([{}, {}]);

	await expect(
		validateItemAccess({ accountability: acc, action: 'read', collection: 'collection-a', primaryKeys: [1, 2] }, {
			schema,
		} as Context),
	).resolves.toBe(true);
});

test('Returns true if the number of returned items matches the number of requested primary keys and the user has access to the fields', async () => {
	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('field-a').id();
		})
		.build();

	const acc = {} as unknown as Accountability;

	vi.mocked(fetchPermittedAstRootFields).mockResolvedValue([{ field_a: 1 }, { field_a: 1 }]);

	await expect(
		validateItemAccess(
			{ accountability: acc, action: 'read', collection: 'collection-a', primaryKeys: [1, 2], fields: ['field_a'] },
			{
				schema,
			} as Context,
		),
	).resolves.toBe(true);
});

test('Returns false if the number of returned items matches the number of requested primary keys and the user does not have access to the fields', async () => {
	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('field-a').id();
		})
		.build();

	const acc = {} as unknown as Accountability;

	vi.mocked(fetchPermittedAstRootFields).mockResolvedValue([{ field_a: null }, { field_a: 1 }]);

	await expect(
		validateItemAccess(
			{ accountability: acc, action: 'read', collection: 'collection-a', primaryKeys: [1, 2], fields: ['field_a'] },
			{
				schema,
			} as Context,
		),
	).resolves.toBe(false);
});
