import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import { fetchPermittedAstRootFields } from '../../../../database/run-ast/modules/fetch-permitted-ast-root-fields.js';
import type { Context } from '../../../types.js';
import { processAst } from '../../process-ast/process-ast.js';
import { validateItemAccess } from './validate-item-access.js';

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
	).resolves.toEqual({ accessAllowed: false });

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
	).resolves.toEqual({ accessAllowed: false });
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
	).resolves.toEqual({ accessAllowed: true });
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
	).resolves.toEqual({ accessAllowed: true });
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
	).resolves.toEqual({ accessAllowed: false });
});

test('Returns allowed root fields when returnAllowedRootFields is true', async () => {
	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('field-a').id();
			c.field('field-b').string();
			c.field('field-c').string();
			c.field('field-d').string();
		})
		.build();

	const acc = {} as unknown as Accountability;

	vi.mocked(fetchPermittedAstRootFields).mockResolvedValue([
		{ 'field-a': 1, 'field-b': 1, 'field-c': null, 'field-d': 1 },
	]);

	const result = await validateItemAccess(
		{
			accountability: acc,
			action: 'read',
			collection: 'collection-a',
			primaryKeys: [1],
			returnAllowedRootFields: true,
		},
		{
			schema,
		} as Context,
	);

	expect(result).toEqual({
		accessAllowed: true,
		allowedRootFields: ['field-a', 'field-b', 'field-d'],
	});
});

test('Tests all fields when returnAllowedRootFields is true and no fields specified', async () => {
	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('field-a').id();
			c.field('field-b').string();
			c.field('field-c').string();
		})
		.build();

	const acc = {} as unknown as Accountability;

	vi.mocked(fetchPermittedAstRootFields).mockResolvedValue([{ 'field-a': 1, 'field-b': 1, 'field-c': null }]);

	await validateItemAccess(
		{
			accountability: acc,
			action: 'read',
			collection: 'collection-a',
			primaryKeys: [1],
			returnAllowedRootFields: true,
		},
		{
			schema,
		} as Context,
	);

	// Verify that AST was created with all fields from the collection
	expect(processAst).toHaveBeenCalledWith(
		expect.objectContaining({
			ast: expect.objectContaining({
				children: expect.arrayContaining([
					expect.objectContaining({ fieldKey: 'field-a' }),
					expect.objectContaining({ fieldKey: 'field-b' }),
					expect.objectContaining({ fieldKey: 'field-c' }),
				]),
			}),
		}),
		expect.anything(),
	);
});

test('Tests only specified fields when returnAllowedRootFields is true and fields are provided', async () => {
	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('field-a').id();
			c.field('field-b').string();
			c.field('field-c').string();
		})
		.build();

	const acc = {} as unknown as Accountability;

	vi.mocked(fetchPermittedAstRootFields).mockResolvedValue([{ 'field-a': 1, 'field-b': 1, 'field-c': null }]);

	await validateItemAccess(
		{
			accountability: acc,
			action: 'read',
			collection: 'collection-a',
			primaryKeys: [1],
			fields: ['field-b', 'field-c'], // ← Should be ignored when returnAllowedRootFields is true
			returnAllowedRootFields: true,
		},
		{
			schema,
		} as Context,
	);

	// Verify that AST was created with ALL fields from the collection (fields param is ignored)
	expect(processAst).toHaveBeenCalledWith(
		expect.objectContaining({
			ast: expect.objectContaining({
				children: expect.arrayContaining([
					expect.objectContaining({ fieldKey: 'field-a' }),
					expect.objectContaining({ fieldKey: 'field-b' }),
					expect.objectContaining({ fieldKey: 'field-c' }),
				]),
			}),
		}),
		expect.anything(),
	);
});
