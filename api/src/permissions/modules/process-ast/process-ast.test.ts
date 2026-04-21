import { ForbiddenError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import type { AST } from '../../../types/ast.js';
import { getExcludedCollections } from '../../../utils/get-excluded-collections.js';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { processAst } from './process-ast.js';

const createKnexMock = (excludedCollections: string[] = []) =>
	({
		select: () => ({
			from: () => ({
				where: async () => excludedCollections.map((collection) => ({ collection })),
			}),
		}),
	}) as unknown as Context['knex'];

vi.mock('../../lib/fetch-policies.js');
vi.mock('../../lib/fetch-permissions.js');

vi.mock('../../../utils/get-excluded-collections.js', () => ({
	getExcludedCollections: vi.fn(),
}));

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
	vi.mocked(getExcludedCollections).mockResolvedValue(new Set());
});

test('Returns AST unmodified if accountability is null', async () => {
	const schema = new SchemaBuilder()
		.collection('test-collection', (c) => {
			c.field('id').id();
		})
		.build();

	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const accountability = null;

	const output = await processAst({ action: 'read', accountability, ast }, {
		schema,
		knex: createKnexMock(),
	} as Context);

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

	const output = await processAst({ accountability, action: 'read', ast }, {
		schema,
		knex: createKnexMock(),
	} as Context);

	expect(output).toBe(ast);
});

test('Validates all paths existence in AST if accountability is null', async () => {
	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const schema = new SchemaBuilder().build();
	const accountability = null;

	await expect(async () =>
		processAst({ action: 'read', accountability, ast }, { schema, knex: createKnexMock() } as Context),
	).rejects.toThrowError(ForbiddenError);
});

test('Validates all paths existence in AST if current user is admin', async () => {
	const ast = { type: 'root', name: 'test-collection', children: [] } as unknown as AST;
	const schema = new SchemaBuilder().build();
	const accountability = { admin: true } as unknown as Accountability;

	await expect(async () =>
		processAst({ action: 'read', accountability, ast }, { schema, knex: createKnexMock() } as Context),
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
		async () =>
			await processAst({ action: 'read', ast, accountability }, { schema, knex: createKnexMock() } as Context),
	).rejects.toThrowError(ForbiddenError);

	expect(fetchPermissions).toHaveBeenCalledWith(
		{
			accountability,
			action: 'read',
			policies: ['test-policy-1'],
			collections: ['test-collection'],
		},
		expect.objectContaining({
			knex: expect.any(Object),
			schema,
		}),
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

	await processAst({ ast, action: 'read', accountability }, { schema, knex: createKnexMock() } as Context);

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

test('rejects relational traversal to excluded collections', async () => {
	vi.mocked(getExcludedCollections).mockResolvedValueOnce(new Set(['secret_notes']));

	const schema = {
		collections: {
			articles: {
				collection: 'articles',
				primary: 'id',
				singleton: false,
				accountability: null,
				note: null,
				sortField: null,
				fields: {
					id: {
						field: 'id',
						type: 'integer',
						dbType: null,
						defaultValue: null,
						nullable: false,
						generated: false,
						alias: false,
						searchable: true,
						note: null,
						precision: null,
						scale: null,
						special: [],
						validation: null,
					},
					secret: {
						field: 'secret',
						type: 'alias',
						dbType: null,
						defaultValue: null,
						nullable: true,
						generated: false,
						alias: true,
						searchable: true,
						note: null,
						precision: null,
						scale: null,
						special: ['m2o'],
						validation: null,
					},
				},
			},
			secret_notes: {
				collection: 'secret_notes',
				primary: 'id',
				singleton: false,
				accountability: null,
				note: null,
				sortField: null,
				fields: {
					id: {
						field: 'id',
						type: 'integer',
						dbType: null,
						defaultValue: null,
						nullable: false,
						generated: false,
						alias: false,
						searchable: true,
						note: null,
						precision: null,
						scale: null,
						special: [],
						validation: null,
					},
				},
			},
		},
		relations: [
			{
				collection: 'articles',
				field: 'secret',
				related_collection: 'secret_notes',
				schema: null,
				meta: null,
			},
		],
	} as Context['schema'];

	const ast = {
		type: 'root',
		name: 'articles',
		children: [
			{
				type: 'm2o',
				fieldKey: 'secret',
				name: 'secret',
				relation: {
					collection: 'articles',
					field: 'secret',
					related_collection: 'secret_notes',
					schema: null,
					meta: null,
				},
				children: [{ type: 'field', fieldKey: 'id', name: 'id' }],
				query: {},
				parentKey: 'id',
				relatedKey: 'id',
				whenCase: [],
				cases: [],
			},
		],
	} as unknown as AST;

	const accountability = { user: null, roles: [] } as unknown as Accountability;

	vi.mocked(fetchPolicies).mockResolvedValue(['test-policy-1']);

	vi.mocked(fetchPermissions).mockResolvedValue([
		{
			policy: 'test-policy-1',
			collection: 'articles',
			action: 'read',
			fields: ['*'],
			permissions: null,
			validation: null,
			presets: null,
		},
	]);

	const knex = Object.assign(
		(_table: 'directus_relations') => ({
			select: () => ({
				where: async () => [],
			}),
		}),
		{
			select: () => ({
				from: () => ({
					where: async () => [{ collection: 'secret_notes' }],
				}),
			}),
		},
	) as unknown as Context['knex'];

	await expect(processAst({ action: 'read', accountability, ast }, { schema, knex } as Context)).rejects.toThrow(
		ForbiddenError,
	);
});

test('rejects relational traversal to excluded collections for admins', async () => {
	vi.mocked(getExcludedCollections).mockResolvedValueOnce(new Set(['secret_notes']));

	const schema = {
		collections: {
			articles: {
				collection: 'articles',
				primary: 'id',
				singleton: false,
				accountability: null,
				note: null,
				sortField: null,
				fields: {
					id: {
						field: 'id',
						type: 'integer',
						dbType: null,
						defaultValue: null,
						nullable: false,
						generated: false,
						alias: false,
						searchable: true,
						note: null,
						precision: null,
						scale: null,
						special: [],
						validation: null,
					},
					secret: {
						field: 'secret',
						type: 'alias',
						dbType: null,
						defaultValue: null,
						nullable: true,
						generated: false,
						alias: true,
						searchable: true,
						note: null,
						precision: null,
						scale: null,
						special: ['m2o'],
						validation: null,
					},
				},
			},
			secret_notes: {
				collection: 'secret_notes',
				primary: 'id',
				singleton: false,
				accountability: null,
				note: null,
				sortField: null,
				fields: {
					id: {
						field: 'id',
						type: 'integer',
						dbType: null,
						defaultValue: null,
						nullable: false,
						generated: false,
						alias: false,
						searchable: true,
						note: null,
						precision: null,
						scale: null,
						special: [],
						validation: null,
					},
				},
			},
		},
		relations: [
			{
				collection: 'articles',
				field: 'secret',
				related_collection: 'secret_notes',
				schema: null,
				meta: null,
			},
		],
	} as Context['schema'];

	const ast = {
		type: 'root',
		name: 'articles',
		children: [
			{
				type: 'm2o',
				fieldKey: 'secret',
				name: 'secret',
				relation: {
					collection: 'articles',
					field: 'secret',
					related_collection: 'secret_notes',
					schema: null,
					meta: null,
				},
				children: [{ type: 'field', fieldKey: 'id', name: 'id' }],
				query: {},
				parentKey: 'id',
				relatedKey: 'id',
				whenCase: [],
				cases: [],
			},
		],
	} as unknown as AST;

	const accountability = { admin: true } as unknown as Accountability;

	const knex = Object.assign(
		(_table: 'directus_relations') => ({
			select: () => ({
				where: async () => [],
			}),
		}),
		{
			select: () => ({
				from: () => ({
					where: async () => [{ collection: 'secret_notes' }],
				}),
			}),
		},
	) as unknown as Context['knex'];

	await expect(processAst({ action: 'read', accountability, ast }, { schema, knex } as Context)).rejects.toThrow(
		ForbiddenError,
	);
});
