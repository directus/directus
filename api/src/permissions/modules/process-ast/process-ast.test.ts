import { ForbiddenError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import type { AST } from '../../../types/ast.js';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { processAst } from './process-ast.js';

vi.mock('../../lib/fetch-policies.js');
vi.mock('../../lib/fetch-permissions.js');

vi.mock('../../../services/permissions.js', () => ({
	PermissionsService: vi.fn(),
}));

vi.mock('../../../services/access.js', () => ({
	AccessService: vi.fn(),
}));

beforeEach(() => {
	vi.clearAllMocks();

	vi.mocked(fetchPolicies).mockResolvedValue([]);
	vi.mocked(fetchPermissions).mockResolvedValue([]);
});

test('Returns AST unmodified if accountability is null', async () => {
	const schema = new SchemaBuilder()
		.collection('test-collection', (c) => {
			c.field('id').id();
		})
		.build();

	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const accountability = null;

	const output = await processAst({ action: 'read', accountability, ast }, { schema } as Context);

	expect(output).toBe(ast);
});

test('Returns AST unmodified and unverified is current user is admin', async () => {
	const schema = new SchemaBuilder()
		.collection('test-collection', (c) => {
			c.field('id').id();
		})
		.build();

	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const accountability = { user: null, roles: [], admin: true } as unknown as Accountability;

	const output = await processAst({ accountability, action: 'read', ast }, { schema } as Context);

	expect(output).toBe(ast);
});

test('Validates all paths existence in AST if accountability is null', async () => {
	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const schema = new SchemaBuilder().build();
	const accountability = null;

	await expect(async () =>
		processAst({ action: 'read', accountability, ast }, { schema } as Context),
	).rejects.toThrowError(ForbiddenError);
});

test('Validates all paths existence in AST if current user is admin', async () => {
	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const schema = new SchemaBuilder().build();
	const accountability = { admin: true } as unknown as Accountability;

	await expect(async () =>
		processAst({ action: 'read', accountability, ast }, { schema } as Context),
	).rejects.toThrowError(ForbiddenError);
});

test('Validates all paths in AST and throws if no permissions match', async () => {
	const schema = new SchemaBuilder()
		.collection('test-collection', (c) => {
			c.field('id').id();
		})
		.build();

	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const accountability = { user: null, roles: [] } as unknown as Accountability;

	vi.mocked(fetchPolicies).mockResolvedValue(['test-policy-1']);

	await expect(
		async () => await processAst({ action: 'read', ast, accountability }, { schema } as Context),
	).rejects.toThrowError(ForbiddenError);

	expect(fetchPermissions).toHaveBeenCalledWith(
		{
			accountability,
			action: 'read',
			policies: ['test-policy-1'],
			collections: ['test-collection'],
		},
		{
			schema,
		},
	);
});

test('Injects permission cases for the provided AST', async () => {
	const ast = {
		type: 'root',
		name: 'test-collection',
		children: [
			{
				type: 'field',
				fieldKey: 'test-field-a',
				name: 'test-field-a',
			},
		],
	} as unknown as AST;

	const schema = new SchemaBuilder()
		.collection('test-collection', (c) => {
			c.field('test-field-a').id();
		})
		.build();

	const accountability = { user: null, roles: [] } as unknown as Accountability;

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

	await processAst({ ast, action: 'read', accountability }, { schema } as Context);

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
				type: 'field',
				fieldKey: 'test-field-a',
				name: 'test-field-a',
				whenCase: [0],
			},
		],
	});
});
