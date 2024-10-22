import type { Accountability, SchemaOverview } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import { getAstFromQuery } from '../../../../database/get-ast-from-query/get-ast-from-query.js';
import { fetchPermittedAstRootFields } from '../../../../database/run-ast/modules/fetch-permitted-ast-root-fields.js';
import type { AST } from '../../../../types/ast.js';
import type { Context } from '../../../types.js';
import { processAst } from '../../process-ast/process-ast.js';
import { validateItemAccess } from './validate-item-access.js';

vi.mock('../../../../database/get-ast-from-query/get-ast-from-query.js');
vi.mock('../../../../database/run-ast/modules/fetch-permitted-ast-root-fields.js');
vi.mock('../../../../database/run-ast/run-ast.js');
vi.mock('../../process-ast/process-ast.js');

beforeEach(() => {
	vi.clearAllMocks();
});

test('Throws error when primary key does not exist in given collection', async () => {
	const schema = { collections: {} } as unknown as SchemaOverview;
	const acc = {} as unknown as Accountability;

	await expect(
		validateItemAccess({ accountability: acc, action: 'read', collection: 'collection-a', primaryKeys: [1] }, {
			schema,
		} as Context),
	).rejects.toBeInstanceOf(Error);
});

test('Queries the database', async () => {
	const schema = { collections: { 'collection-a': { primary: 'field-a' } } } as unknown as SchemaOverview;
	const acc = {} as unknown as Accountability;
	const ast = { query: {} } as unknown as AST;

	vi.mocked(getAstFromQuery).mockResolvedValue(ast);
	vi.mocked(fetchPermittedAstRootFields).mockResolvedValue([]);

	await expect(
		validateItemAccess({ accountability: acc, action: 'read', collection: 'collection-a', primaryKeys: [1] }, {
			schema,
		} as Context),
	).resolves.toBe(false);

	expect(getAstFromQuery).toHaveBeenCalledWith(
		{
			collection: 'collection-a',
			query: {
				fields: [],
				limit: 1,
			},
			accountability: acc,
		},
		{ schema } as Context,
	);

	expect(processAst).toHaveBeenCalledWith(
		{
			accountability: acc,
			action: 'read',
			collection: 'collection-a',
			primaryKeys: [1],
			ast,
		},
		{ schema },
	);

	expect(fetchPermittedAstRootFields).toHaveBeenCalledWith(
		{
			query: {
				filter: {
					'field-a': {
						_in: [1],
					},
				},
			},
		},
		{
			schema,
			accountability: acc,
			knex: undefined,
		},
	);
});

test('Returns false if no items are returned', async () => {
	const schema = { collections: { 'collection-a': { primary: 'field-a' } } } as unknown as SchemaOverview;
	const acc = {} as unknown as Accountability;

	vi.mocked(fetchPermittedAstRootFields).mockResolvedValue([]);

	await expect(
		validateItemAccess({ accountability: acc, action: 'read', collection: 'collection-a', primaryKeys: [1] }, {
			schema,
		} as Context),
	).resolves.toBe(false);
});

test('Returns true if the number of returned items matches the number of requested primary keys', async () => {
	const schema = { collections: { 'collection-a': { primary: 'field-a' } } } as unknown as SchemaOverview;
	const acc = {} as unknown as Accountability;

	vi.mocked(fetchPermittedAstRootFields).mockResolvedValue([{}, {}]);

	await expect(
		validateItemAccess({ accountability: acc, action: 'read', collection: 'collection-a', primaryKeys: [1, 2] }, {
			schema,
		} as Context),
	).resolves.toBe(true);
});

test('Returns true if the number of returned items matches the number of requested primary keys and the user has access to the fields', async () => {
	const schema = { collections: { 'collection-a': { primary: 'field-a' } } } as unknown as SchemaOverview;
	const acc = {} as unknown as Accountability;
	const ast = { query: {} } as unknown as AST;

	vi.mocked(getAstFromQuery).mockResolvedValue(ast);
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

test('Returns false the number of returned items matches the number of requested primary keys and the user does not have access to the fields', async () => {
	const schema = { collections: { 'collection-a': { primary: 'field-a' } } } as unknown as SchemaOverview;
	const acc = {} as unknown as Accountability;
	const ast = { query: {} } as unknown as AST;

	vi.mocked(getAstFromQuery).mockResolvedValue(ast);
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
