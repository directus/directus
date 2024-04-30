import { ForbiddenError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import type { AST } from '../../../types/ast.js';
import { processAst } from './process.js';

import type { AccessService } from '../../../services/access.js';
import type { PermissionsService } from '../../../services/permissions/index.js';

let accessService: AccessService;
let permissionsService: PermissionsService;

beforeEach(() => {
	accessService = {
		readByQuery: vi.fn(),
	} as unknown as AccessService;

	permissionsService = {
		readByQuery: vi.fn(),
	} as unknown as PermissionsService;
});

test('Throws if no policies exist for user', async () => {
	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const acc = {} as Accountability;
	const sch = {} as SchemaOverview;

	vi.mocked(accessService.readByQuery).mockResolvedValue([]);

	try {
		await processAst(accessService, permissionsService, ast, 'read', acc, sch);
	} catch (err) {
		expect(err).toBeInstanceOf(ForbiddenError);
	}
});

test('Returns AST unmodified and unverified is current user is admin', async () => {
	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const acc = {} as Accountability;
	const sch = {} as SchemaOverview;

	vi.mocked(accessService.readByQuery).mockResolvedValue([{ policy: { admin_access: true } }]);

	const output = await processAst(accessService, permissionsService, ast, 'read', acc, sch);

	expect(output).toBe(ast);
});

test('Validates all paths in AST', async () => {
	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const acc = {} as Accountability;
	const sch = {} as SchemaOverview;

	vi.mocked(accessService.readByQuery).mockResolvedValue([{ policy: { id: 'test-policy-1' } }]);

	try {
		await processAst(accessService, permissionsService, ast, 'read', acc, sch);
	} catch (err) {
		expect(err).toBeInstanceOf(ForbiddenError);
	}

	expect(permissionsService.readByQuery).toHaveBeenCalledWith({
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

	vi.mocked(accessService.readByQuery).mockResolvedValue([{ policy: { id: 'test-policy-1' } }]);

	vi.mocked(permissionsService.readByQuery).mockResolvedValue([
		{
			policy: 'test-policy-1',
			collection: 'test-collection',
			action: 'read',
			fields: ['*'],
			permissions: { status: { _eq: 'published' } },
		},
	]);

	await processAst(accessService, permissionsService, ast, 'read', acc, sch);

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
