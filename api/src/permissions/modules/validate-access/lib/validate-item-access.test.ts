import type { Accountability, SchemaOverview } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import { getAstFromQuery } from '../../../../database/get-ast-from-query/get-ast-from-query.js';
import { runAst } from '../../../../database/run-ast/run-ast.js';
import type { AST } from '../../../../types/ast.js';
import type { Context } from '../../../types.js';
import { processAst } from '../../process-ast/process-ast.js';
import { validateItemAccess } from './validate-item-access.js';

vi.mock('../../../../database/get-ast-from-query/get-ast-from-query.js');
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
	const ast = {} as unknown as AST;

	vi.mocked(getAstFromQuery).mockResolvedValue(ast);
	vi.mocked(runAst).mockResolvedValue([]);

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
				filter: {
					'field-a': {
						_in: [1],
					},
				},
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
});

test('Returns false if no items are returned', async () => {
	const schema = { collections: { 'collection-a': { primary: 'field-a' } } } as unknown as SchemaOverview;
	const acc = {} as unknown as Accountability;

	vi.mocked(runAst).mockResolvedValue([]);

	await expect(
		validateItemAccess({ accountability: acc, action: 'read', collection: 'collection-a', primaryKeys: [1] }, {
			schema,
		} as Context),
	).resolves.toBe(false);
});

test('Returns true the number of returned items matches the number of requested primary keys', async () => {
	const schema = { collections: { 'collection-a': { primary: 'field-a' } } } as unknown as SchemaOverview;
	const acc = {} as unknown as Accountability;

	vi.mocked(runAst).mockResolvedValue([{}, {}]);

	await expect(
		validateItemAccess({ accountability: acc, action: 'read', collection: 'collection-a', primaryKeys: [1, 2] }, {
			schema,
		} as Context),
	).resolves.toBe(true);
});
