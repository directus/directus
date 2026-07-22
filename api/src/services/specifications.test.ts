import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import type { RequestBodyObject, SchemaObject } from 'openapi3-ts/oas30';
import type { MockedFunction } from 'vitest';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { SpecificationService } from './index.js';

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
			});
		});
	});
});
