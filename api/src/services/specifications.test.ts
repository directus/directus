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

				describe('$ref preservation in mergeWith', () => {
					it('detail path requestBody schema is a bare $ref, not a deep-merged object', async () => {
						const service = new SpecificationService({
							knex: db,
							schema: schema2,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const spec = await service.oas.generate();

						const patchBody = spec.paths['/items/test_table/{id}']?.patch?.requestBody as any;
						const bodySchema = patchBody?.content?.['application/json']?.schema;

						expect(bodySchema).toEqual({ $ref: '#/components/schemas/ItemsTestTable' });
					});

					it('singleton list path GET response data is a bare $ref, not a deep-merged object', async () => {
						const singletonSchema = new SchemaBuilder()
							.collection('settings', (c) => {
								c.field('id').integer().primary().options({ nullable: false });
							})
							.options({ singleton: true })
							.build();

						const service = new SpecificationService({
							knex: db,
							schema: singletonSchema,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const spec = await service.oas.generate();

						const responseData =
							spec.paths['/items/settings']?.get?.responses?.['200']?.content?.['application/json']?.schema?.properties
								?.data;

						expect(responseData).toEqual({ $ref: '#/components/schemas/ItemsSettings' });
					});
				});

				describe('security / tags assignment', () => {
					it('collection-specific tags array replaces the generic Items tag rather than appending to it', async () => {
						const service = new SpecificationService({
							knex: db,
							schema: schema2,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const spec = await service.oas.generate();

						// Each collection gets its own tag (e.g. 'ItemsTestTable') in place of the generic
						// 'Items' tag on the static /items/{collection} template this operation is cloned from.
						expect(spec.paths['/items/test_table']?.get?.tags).toEqual(['ItemsTestTable']);
					});
				});

				describe('public role security declarations', () => {
					it('stamps optional-auth security on operations accessible to the public role', async () => {
						vi.mocked(fetchPermissions).mockResolvedValueOnce([{ collection: 'test_table', action: 'read' } as any]);

						const service = new SpecificationService({
							knex: db,
							schema,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const spec = await service.oas.generate();

						// A publicly-readable route can also be called with auth (e.g. an authenticated
						// caller may see more fields than the public role), so every scheme stays listed
						// as an option alongside the no-auth entry ({}) rather than excluding auth.
						expect(spec.paths['/items/test_table']?.get?.security).toEqual([
							{},
							{ Auth: [] },
							{ KeyAuth: [] },
							{ CookieAuth: [] },
						]);
					});

					it('does not stamp optional-auth security on operations not accessible to the public role', async () => {
						const service = new SpecificationService({
							knex: db,
							schema,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const spec = await service.oas.generate();

						// Public role has no read access, so no optional-auth override is stamped. The
						// operation has no explicit security key and falls back to the document-level
						// default (Auth, KeyAuth, or CookieAuth required) via standard OAS3 inheritance.
						expect(spec.paths['/items/test_table']?.get?.security).toBeUndefined();
					});

					it('also stamps optional-auth security on system-collection operations accessible to the public role', async () => {
						vi.mocked(fetchPermissions).mockResolvedValueOnce([
							{ collection: 'directus_files', action: 'read' } as any,
						]);

						const systemSchema = new SchemaBuilder()
							.collection('directus_files', (c) => {
								c.field('id').uuid().primary();
							})
							.build();

						const service = new SpecificationService({
							knex: db,
							schema: systemSchema,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const spec = await service.oas.generate();

						expect(spec.paths['/files']?.get?.security).toEqual([
							{},
							{ Auth: [] },
							{ KeyAuth: [] },
							{ CookieAuth: [] },
						]);
					});
				});

				describe('CookieAuth / RefreshTokenCookieAuth scheme coverage', () => {
					it('includes CookieAuth in the spec-wide security default', async () => {
						const service = new SpecificationService({
							knex: db,
							schema,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const spec = await service.oas.generate();

						// A session cookie authenticates every request via the global extractToken
						// middleware, so it belongs on the default alongside Auth/KeyAuth.
						expect(spec.security).toEqual([{ Auth: [] }, { KeyAuth: [] }, { CookieAuth: [] }]);
					});

					it('carries the static security declaration through for /auth/refresh and /auth/logout', async () => {
						const service = new SpecificationService({
							knex: db,
							schema,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const spec = await service.oas.generate();

						// The refresh token can be supplied in the request body (no scheme), the session
						// cookie (CookieAuth), or the refresh-token cookie (RefreshTokenCookieAuth) -
						// distinct from the spec-wide default, so both endpoints declare it explicitly.
						const expectedSecurity = [{}, { CookieAuth: [] }, { RefreshTokenCookieAuth: [] }];

						expect(spec.paths['/auth/refresh']?.post?.security).toEqual(expectedSecurity);
						expect(spec.paths['/auth/logout']?.post?.security).toEqual(expectedSecurity);
					});
				});

				describe('non-admin permission gating', () => {
					it("reduces the schema to only the caller's own permitted fields", async () => {
						vi.mocked(fetchPermissions).mockResolvedValueOnce([
							{ collection: 'test_table', action: 'read', fields: ['id'] } as any,
						]);

						const service = new SpecificationService({
							knex: db,
							schema,
							accountability: { role: 'some-role', admin: false } as Accountability,
						});

						const spec = await service.oas.generate();

						const itemSchema = spec.components?.schemas?.['ItemsTestTable'] as any;
						expect(itemSchema?.properties).toHaveProperty('id');
						expect(itemSchema?.properties).not.toHaveProperty('blob');
					});

					it('denies actions not explicitly granted for a collection the caller does have some access to', async () => {
						// Only a 'read' permission is granted for test_table, so it's present in the
						// resulting CollectionAccess map (read access triggers the collection's entry to
						// exist at all, which is also why it still gets a tag/schema generated), but
						// 'create'/'update'/'delete' were never touched for it and stay at their
						// initialized 'none' default rather than being absent.
						vi.mocked(fetchPermissions).mockResolvedValueOnce([
							{ collection: 'test_table', action: 'read', fields: ['id'] } as any,
						]);

						const service = new SpecificationService({
							knex: db,
							schema: schema2,
							accountability: { role: 'some-role', admin: false } as Accountability,
						});

						const spec = await service.oas.generate();

						expect(spec.paths?.['/items/test_table']?.get).toBeDefined();
						expect(spec.paths?.['/items/test_table']?.post).toBeUndefined();
						expect(spec.paths?.['/items/test_table']?.patch).toBeUndefined();
						expect(spec.paths?.['/items/test_table']?.delete).toBeUndefined();
					});

					it('excludes a collection entirely when the caller has no permissions for it at all', async () => {
						const multiSchema = new SchemaBuilder()
							.collection('test_table', (c) => {
								c.field('id').integer().primary().options({ nullable: false });
							})
							.collection('other_table', (c) => {
								c.field('id').integer().primary().options({ nullable: false });
							})
							.build();

						// No permissions at all are granted for test_table, so it's entirely absent from
						// the resulting CollectionAccess map - hasCollectionAccess must treat this the
						// same as an explicit 'none', not read the missing entry as having access.
						vi.mocked(fetchPermissions).mockResolvedValueOnce([
							{ collection: 'other_table', action: 'read', fields: ['id'] } as any,
						]);

						const service = new SpecificationService({
							knex: db,
							schema: multiSchema,
							accountability: { role: 'some-role', admin: false } as Accountability,
						});

						const spec = await service.oas.generate();

						expect(spec.paths?.['/items/test_table']).toBeUndefined();
						expect(spec.paths?.['/items/other_table']?.get).toBeDefined();
					});
				});

				describe('transitive schema $ref resolution', () => {
					it('backfills schemas that are only reachable via a $ref inside another required schema', async () => {
						const service = new SpecificationService({
							knex: db,
							schema,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						const spec = await service.oas.generate();

						// `Schema` is always pulled in via OAS_REQUIRED_SCHEMAS and references `Collections`,
						// `Fields`, and `Relations` via $ref, but nothing else in `generate()` adds those three
						// directly. Without resolveSchemaRefs backfilling transitive dependencies, they would be
						// left as dangling $refs with no matching entry in components.schemas.
						expect(spec.components?.schemas).toHaveProperty('Schema');
						expect(spec.components?.schemas?.['Collections']).toBeDefined();
						expect(spec.components?.schemas?.['Fields']).toBeDefined();
						expect(spec.components?.schemas?.['Relations']).toBeDefined();
					});
				});
			});
		});
	});
});
