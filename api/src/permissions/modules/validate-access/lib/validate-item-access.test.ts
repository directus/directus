import type { Accountability, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { beforeEach, expect, test, vi } from 'vitest';
import { getAstFromQuery } from '../../../../database/get-ast-from-query/get-ast-from-query.js';
import { runAst } from '../../../../database/run/run.js';
import type { AccessService } from '../../../../services/access.js';
import type { PermissionsService } from '../../../../services/index.js';
import type { AST } from '../../../../types/ast.js';
import { processAst } from '../../process-ast/process.js';
import { validateItemAccess } from './validate-item-access.js';

vi.mock('../../../../database/get-ast-from-query/get-ast-from-query.js');
vi.mock('../../../../database/run/run.js');
vi.mock('../../process-ast/process.js');

let knex: Knex;
let accessService: AccessService;
let permissionsService: PermissionsService;

beforeEach(() => {
	vi.clearAllMocks();

	knex = {} as unknown as Knex;

	accessService = {
		readByQuery: vi.fn().mockResolvedValue([]),
	} as unknown as AccessService;

	permissionsService = {
		readByQuery: vi.fn().mockResolvedValue([]),
	} as unknown as PermissionsService;
});

test('Throws error when primary key does not exist in given collection', async () => {
	const schema = { collections: {} } as unknown as SchemaOverview;
	const acc = {} as unknown as Accountability;

	await expect(
		validateItemAccess(
			{ accountability: acc, action: 'read', collection: 'collection-a', primaryKeys: [1] },
			{ knex, accessService, permissionsService, schema },
		),
	).rejects.toBeInstanceOf(Error);
});

test('Queries the database', async () => {
	const schema = { collections: { 'collection-a': { primary: 'field-a' } } } as unknown as SchemaOverview;
	const acc = {} as unknown as Accountability;
	const ast = {} as unknown as AST;

	vi.mocked(getAstFromQuery).mockResolvedValue(ast);
	vi.mocked(runAst).mockResolvedValue([]);

	await expect(
		validateItemAccess(
			{ accountability: acc, action: 'read', collection: 'collection-a', primaryKeys: [1] },
			{ knex, accessService, permissionsService, schema },
		),
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
		{
			schema,
			accessService,
			permissionsService,
		},
	);

	expect(processAst).toHaveBeenCalledWith(accessService, permissionsService, ast, 'read', acc, schema);
});

test('Returns false if no items are returned', async () => {
	const schema = { collections: { 'collection-a': { primary: 'field-a' } } } as unknown as SchemaOverview;
	const acc = {} as unknown as Accountability;

	vi.mocked(runAst).mockResolvedValue([]);

	await expect(
		validateItemAccess(
			{ accountability: acc, action: 'read', collection: 'collection-a', primaryKeys: [1] },
			{ knex, accessService, permissionsService, schema },
		),
	).resolves.toBe(false);
});

test('Returns true the number of returned items matches the number of requested primary keys', async () => {
	const schema = { collections: { 'collection-a': { primary: 'field-a' } } } as unknown as SchemaOverview;
	const acc = {} as unknown as Accountability;

	vi.mocked(runAst).mockResolvedValue([{}, {}]);

	await expect(
		validateItemAccess(
			{ accountability: acc, action: 'read', collection: 'collection-a', primaryKeys: [1, 2] },
			{ knex, accessService, permissionsService, schema },
		),
	).resolves.toBe(true);
});
