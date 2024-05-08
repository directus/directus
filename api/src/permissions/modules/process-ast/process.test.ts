import { ForbiddenError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import type { AccessService } from '../../../services/access.js';
import type { PermissionsService } from '../../../services/permissions/index.js';
import type { AST } from '../../../types/ast.js';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import { processAst } from './process.js';

let accessService: AccessService;
let permissionsService: PermissionsService;

vi.mock('../../lib/fetch-policies.js');
vi.mock('../../lib/fetch-permissions.js');

beforeEach(() => {
	vi.clearAllMocks();

	vi.mocked(fetchPolicies).mockResolvedValue([]);
	vi.mocked(fetchPermissions).mockResolvedValue([]);

	accessService = {
		readByQuery: vi.fn().mockResolvedValue([]),
	} as unknown as AccessService;

	permissionsService = {
		readByQuery: vi.fn().mockResolvedValue([]),
	} as unknown as PermissionsService;
});

test('Throws if no policies exist for user', async () => {
	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const accountability = { user: null, roles: [] } as unknown as Accountability;
	const schema = {} as SchemaOverview;

	vi.mocked(accessService.readByQuery).mockResolvedValue([]);

	try {
		await processAst({ action: 'read', accountability, ast }, { accessService, permissionsService, schema });
	} catch (err) {
		expect(err).toBeInstanceOf(ForbiddenError);
	}
});

test('Returns AST unmodified if accountability is null', async () => {
	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const accountability = null;
	const schema = {} as SchemaOverview;

	const output = await processAst(
		{ action: 'read', accountability, ast },
		{ accessService, permissionsService, schema },
	);

	expect(output).toBe(ast);
});

test('Returns AST unmodified and unverified is current user is admin', async () => {
	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const accountability = { user: null, roles: [], admin: true } as unknown as Accountability;
	const schema = {} as SchemaOverview;

	const output = await processAst(
		{ accountability, action: 'read', ast },
		{ accessService, permissionsService, schema },
	);

	expect(output).toBe(ast);
});

test('Validates all paths in AST', async () => {
	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const accountability = { user: null, roles: [] } as unknown as Accountability;
	const schema = {} as SchemaOverview;

	vi.mocked(fetchPolicies).mockResolvedValue(['test-policy-1']);

	try {
		await processAst({ action: 'read', ast, accountability }, { accessService, permissionsService, schema });
	} catch (err) {
		expect(err).toBeInstanceOf(ForbiddenError);
	}

	expect(fetchPermissions).toHaveBeenCalledWith(
		{
			action: 'read',
			policies: ['test-policy-1'],
			collections: ['test-collection'],
		},
		{ permissionsService },
	);
});

test('Injects permission cases for the provided AST', async () => {
	const ast = {
		type: 'root',
		name: 'test-collection',
		children: [
			{
				fieldKey: 'test-field-a',
			},
		],
	} as unknown as AST;

	const accountability = { user: null, roles: [] } as unknown as Accountability;
	const schema = {} as SchemaOverview;

	vi.mocked(fetchPolicies).mockResolvedValue(['test-policy-1']);

	vi.mocked(fetchPermissions).mockResolvedValue([
		{
			policy: 'test-policy-1',
			collection: 'test-collection',
			action: 'read',
			fields: ['*'],
			permissions: { status: { _eq: 'published' } },
			validation: null,
			presets: null,
		},
	]);

	await processAst({ ast, action: 'read', accountability }, { accessService, permissionsService, schema });

	expect(ast).toEqual({
		type: 'root',
		name: 'test-collection',
		cases: [
			{
				status: {
					_eq: 'published',
				},
			},
		],
		children: [
			{
				fieldKey: 'test-field-a',
				whenCase: [0],
			},
		],
	});
});
