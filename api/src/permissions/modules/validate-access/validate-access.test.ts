import { ForbiddenError } from '@directus/errors';
import { validateAccess } from './validate-access.js';
import { expect, test, vi, beforeEach } from 'vitest';
import type { Accountability, PermissionsAction, PrimaryKey, Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { getAstFromQuery } from '../../../database/get-ast-from-query/get-ast-from-query.js';
import { runAst } from '../../../database/run/run.js';
import type { AccessService } from '../../../services/access.js';
import type { PermissionsService } from '../../../services/index.js';
import { processAst } from '../process-ast/process.js';
import { validateItemAccess } from './lib/validate-item-access.js';
import { validateCollectionAccess } from './lib/validate-collection-access.js';

vi.mock('./lib/validate-item-access.js');
vi.mock('./lib/validate-collection-access.js');

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

test('Returns when admin is true', async () => {
	const schema = {} as unknown as SchemaOverview;
	const acc = { admin: true } as unknown as Accountability;
	const action = 'read';
	const collection = 'collection-a';

	await expect(
		validateAccess(knex, accessService, permissionsService, schema, acc, action, collection),
	).resolves.toBeUndefined();
});

test('Throws if you do not have item access when primary keys are passed', async () => {
	const schema = {} as unknown as SchemaOverview;
	const acc = { admin: false } as unknown as Accountability;
	const action = 'read';
	const collection = 'collection-a';

	vi.mocked(validateCollectionAccess).mockResolvedValue(false);

	await expect(
		validateAccess(knex, accessService, permissionsService, schema, acc, action, collection),
	).rejects.toBeInstanceOf(ForbiddenError);
});

test('Throws if you do not have collection access when primary keys are not passed', async () => {
	const schema = {} as unknown as SchemaOverview;
	const acc = { admin: false } as unknown as Accountability;
	const action = 'read';
	const collection = 'collection-a';

	vi.mocked(validateItemAccess).mockResolvedValue(false);

	await expect(
		validateAccess(knex, accessService, permissionsService, schema, acc, action, collection),
	).rejects.toBeInstanceOf(ForbiddenError);
});
