import { ForbiddenError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import type { AST } from '../../types/ast.js';
import { processAst } from './process.js';

import { AccessService } from '../../services/access.js';
import { PermissionsService } from '../../services/permissions/index.js';
import { RolesService } from '../../services/roles.js';

vi.mock('../../database/index.js');
vi.mock('../../services/access.js');
vi.mock('../../services/permissions/index.js');
vi.mock('../../services/roles.js');

beforeEach(() => {
	vi.clearAllMocks();

	vi.mocked(AccessService.prototype.readByQuery).mockResolvedValue([]);
	vi.mocked(PermissionsService.prototype.readByQuery).mockResolvedValue([]);
	vi.mocked(RolesService.prototype.readByQuery).mockResolvedValue([]);
});

test('Throws if no policies exist for user', async () => {
	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const acc = {} as Accountability;
	const sch = {} as SchemaOverview;

	vi.mocked(AccessService.prototype.readByQuery).mockResolvedValue([]);

	try {
		await processAst(ast, 'read', acc, sch);
	} catch (err) {
		expect(err).toBeInstanceOf(ForbiddenError);
	}
});

test('Returns AST unmodified and unverified is current user is admin', async () => {
	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const acc = {} as Accountability;
	const sch = {} as SchemaOverview;

	vi.mocked(AccessService.prototype.readByQuery).mockResolvedValue([{ policy: { admin_access: true } }]);

	const output = await processAst(ast, 'read', acc, sch);

	expect(output).toBe(ast);
});

test('Validates all paths in AST', async () => {
	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const acc = {} as Accountability;
	const sch = {} as SchemaOverview;

	vi.mocked(AccessService.prototype.readByQuery).mockResolvedValue([{ policy: { id: 'test-policy-1' } }]);

	try {
		await processAst(ast, 'read', acc, sch);
	} catch (err) {
		expect(err).toBeInstanceOf(ForbiddenError);
	}

	expect(PermissionsService.prototype.readByQuery).toHaveBeenCalledWith({
		filter: {
			_and: [
				{
					policy: {
						_in: ['test-policy-1'],
					},
				},
				{
					collection: {
						_in: ['test-collection'],
					},
				},
				{
					action: {
						_eq: 'read',
					},
				},
			],
		},
	});
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

	const acc = {} as Accountability;

	const sch = {} as SchemaOverview;

	vi.mocked(AccessService.prototype.readByQuery).mockResolvedValue([{ policy: { id: 'test-policy-1' } }]);

	vi.mocked(PermissionsService.prototype.readByQuery).mockResolvedValue([
		{
			policy: 'test-policy-1',
			collection: 'test-collection',
			action: 'read',
			fields: ['*'],
			permissions: { status: { _eq: 'published' } },
		},
	]);

	await processAst(ast, 'read', acc, sch);

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
