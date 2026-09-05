import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import type { RequestBodyObject, SchemaObject } from 'openapi3-ts/oas30';
import type { MockedFunction } from 'vitest';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { fetchPermissions } from '../permissions/lib/fetch-permissions.js';
import { SpecificationService } from './index.js';

vi.mock('../permissions/lib/fetch-policies.js', () => ({
	fetchPolicies: vi.fn().mockResolvedValue([]),
}));

vi.mock('../permissions/lib/fetch-permissions.js', () => ({
	fetchPermissions: vi.fn().mockResolvedValue([]),
}));

class Client_PG extends MockClient {}

describe('Integration Tests', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = vi.mocked(knex.default({ client: Client_PG }));
		tracker = createTracker(db);
	});

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
	});

	const schema = new SchemaBuilder()
		.collection('test_table', (c) => {
			c.field('id').integer().primary().options({
				nullable: false,
			});

			c.field('blob').json();
		})
		.build();

	const schema2 = new SchemaBuilder()
		.collection('test_table', (c) => {
			c.field('id').integer().primary().options({
				nullable: false,
			});
		})
		.build();

	describe('Services / Specifications', () => {
		describe('oas', () => {
			describe('generate', () => {
				describe('schema', () => {
					it('returns untyped schema for json fields', async () => {
						const service = new SpecificationService({
							knex: db,
							schema,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const spec = await service.oas.generate();

						expect(spec.components?.schemas).toMatchObject({
							ItemsTestTable: {
								properties: {
									blob: { nullable: true },
								},
							},
						});

						const blobSchema = spec.components?.schemas?.['ItemsTestTable'] as SchemaObject | undefined;
						expect(blobSchema?.properties?.['blob']).not.toHaveProperty('type');
					});
				});

				describe('path', () => {
					it('requestBody for CreateItems POST path should not have type in schema', async () => {
						const service = new SpecificationService({
							knex: db,
							schema: schema2,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const spec = await service.oas.generate();
						const requestBody = spec.paths['/items/test_table']?.post?.requestBody as RequestBodyObject;

						const targetSchema = requestBody?.content?.['application/json']?.schema;

						expect(targetSchema).toHaveProperty('oneOf');
						expect(targetSchema).not.toHaveProperty('type');
					});

					it.each([
						{ label: 'collection list path', schema: schema2, path: '/items/test_table' },
						{
							label: 'system list path',
							schema: new SchemaBuilder()
								.collection('directus_users', (c) => {
									c.field('id').uuid().primary();
								})
								.build(),
							path: '/users',
						},
					])('retains x-metadata schema and meta parameter on $label', async ({ schema, path }) => {
						const service = new SpecificationService({
							knex: db,
							schema,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const spec = await service.oas.generate();
						const getPath = spec.paths[path]?.get;

						const parameters = getPath?.parameters as { $ref?: string }[] | undefined;
						expect(parameters?.some((p) => p?.$ref === '#/components/parameters/Meta')).toBe(true);

						const getSchema = (
							getPath?.responses?.['200'] as { content?: { 'application/json'?: { schema?: unknown } } }
						)?.content?.['application/json']?.schema;

						expect(getSchema).toMatchObject({
							properties: { meta: { $ref: '#/components/schemas/x-metadata' } },
						});
					});
				});

				describe('info.version (hashedVersion)', () => {
					it('is deterministic across repeated calls for the same caller', async () => {
						const service = new SpecificationService({
							knex: db,
							schema,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const first = await service.oas.generate();
						const second = await service.oas.generate();

						expect(first.info.version).toEqual(second.info.version);
					});

					it('is stable across callers with identical effective RBAC access', async () => {
						vi.mocked(fetchPermissions).mockResolvedValue([
							{ collection: 'test_table', action: 'read', fields: ['id'] } as any,
						]);

						const serviceA = new SpecificationService({
							knex: db,
							schema,
							accountability: { role: 'role-a', user: 'user-a', admin: false } as Accountability,
						});

						const serviceB = new SpecificationService({
							knex: db,
							schema,
							accountability: { role: 'role-b', user: 'user-b', admin: false } as Accountability,
						});

						const specA = await serviceA.oas.generate();
						const specB = await serviceB.oas.generate();

						expect(specA.info.version).toEqual(specB.info.version);
					});

					it('changes when the underlying spec shape changes', async () => {
						const serviceWithBlob = new SpecificationService({
							knex: db,
							schema,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const serviceWithoutBlob = new SpecificationService({
							knex: db,
							schema: schema2,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const specWithBlob = await serviceWithBlob.oas.generate();
						const specWithoutBlob = await serviceWithoutBlob.oas.generate();

						expect(specWithBlob.info.version).not.toEqual(specWithoutBlob.info.version);
					});

					it('is stable regardless of collection enumeration order', async () => {
						const schemaAB = new SchemaBuilder()
							.collection('table_a', (c) => {
								c.field('id').integer().primary();
							})
							.collection('table_b', (c) => {
								c.field('id').integer().primary();
							})
							.build();

						const schemaBA = new SchemaBuilder()
							.collection('table_b', (c) => {
								c.field('id').integer().primary();
							})
							.collection('table_a', (c) => {
								c.field('id').integer().primary();
							})
							.build();

						const serviceAB = new SpecificationService({
							knex: db,
							schema: schemaAB,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const serviceBA = new SpecificationService({
							knex: db,
							schema: schemaBA,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const specAB = await serviceAB.oas.generate();
						const specBA = await serviceBA.oas.generate();

						expect(specAB.info.version).toEqual(specBA.info.version);
					});
				});
			});
		});
	});
});
