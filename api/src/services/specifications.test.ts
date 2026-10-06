import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability, SchemaOverview } from '@directus/types';
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
		vi.mocked(fetchPermissions).mockResolvedValue([]);
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

					const articlesSchema = new SchemaBuilder()
						.collection('articles', (c) => {
							c.field('id').integer().primary();
							c.field('title').string();
							c.field('author').integer();
						})
						.collection('authors', (c) => {
							c.field('id').integer().primary();
							c.field('name').string();
						})
						.build();

					const authorRelation = new SchemaBuilder()
						.collection('articles', (c) => {
							c.field('id').integer().primary();
							c.field('author').m2o('authors');
						})
						.build().relations[0]!;

					async function versionFor(schema: SchemaOverview) {
						const service = new SpecificationService({
							knex: db,
							schema,
							accountability: { role: 'admin', admin: true } as Accountability,
						});

						return (await service.oas.generate()).info.version;
					}

					it.each<[string, (schema: SchemaOverview) => void]>([
						['collection note', (s) => (s.collections['articles']!.note = 'Published articles')],
						['collection singleton', (s) => (s.collections['articles']!.singleton = true)],
						['field note', (s) => (s.collections['articles']!.fields['title']!.note = 'Headline')],
						['field nullable', (s) => (s.collections['articles']!.fields['title']!.nullable = false)],
						['field default value', (s) => (s.collections['articles']!.fields['title']!.defaultValue = 'Untitled')],
						['field generated', (s) => (s.collections['articles']!.fields['title']!.generated = true)],
						['field type', (s) => (s.collections['articles']!.fields['title']!.type = 'text')],
						['field list', (s) => delete s.collections['articles']!.fields['title']],
						['collection primary key', (s) => (s.collections['authors']!.primary = 'name')],
						['m2o relation', (s) => s.relations.push(authorRelation)],
					])('changes when the %s changes', async (_, change) => {
						const changed = structuredClone(articlesSchema);
						change(changed);

						expect(await versionFor(changed)).not.toEqual(await versionFor(articlesSchema));
					});

					it.each<[string, (schema: SchemaOverview) => void]>([
						['field special', (s) => (s.collections['articles']!.fields['title']!.special = ['cast-json'])],
						['field searchable', (s) => (s.collections['articles']!.fields['title']!.searchable = false)],
						['collection sort field', (s) => (s.collections['articles']!.sortField = 'title')],
						['collection accountability', (s) => (s.collections['articles']!.accountability = null)],
					])('is unchanged when the %s changes', async (_, change) => {
						const changed = structuredClone(articlesSchema);
						change(changed);

						expect(await versionFor(changed)).toEqual(await versionFor(articlesSchema));
					});

					const relationalSchema = new SchemaBuilder()
						.collection('articles', (c) => {
							c.field('id').integer().primary();
							c.field('author').m2o('authors', 'articles');
							c.field('block').a2o(['authors', 'editors']);
						})
						.collection('authors', (c) => {
							c.field('id').integer().primary();
						})
						.collection('editors', (c) => {
							c.field('id').integer().primary();
						})
						.build();

					it.each<[string, (schema: SchemaOverview) => void]>([
						['m2o related collection', (s) => (s.relations[0]!.related_collection = 'editors')],
						['o2m alias field', (s) => (s.relations[0]!.meta!.one_field = 'posts')],
						['a2o collection field', (s) => (s.relations[1]!.meta!.one_collection_field = 'kind')],
						['a2o allowed collections', (s) => (s.relations[1]!.meta!.one_allowed_collections = ['authors'])],
					])('changes when the %s changes', async (_, change) => {
						const changed = structuredClone(relationalSchema);
						change(changed);

						expect(await versionFor(changed)).not.toEqual(await versionFor(relationalSchema));
					});

					const restrictedSchema = new SchemaBuilder()
						.collection('articles', (c) => {
							c.field('id').integer().primary();
							c.field('title').string();
							c.field('internal_notes').string();
						})
						.collection('secrets', (c) => {
							c.field('id').integer().primary();
						})
						.build();

					async function editorVersionFor(schema: SchemaOverview) {
						vi.mocked(fetchPermissions).mockResolvedValue([
							{ collection: 'articles', action: 'read', fields: ['id', 'title'] } as any,
						]);

						const service = new SpecificationService({
							knex: db,
							schema,
							accountability: { role: 'editor', user: 'editor-user', admin: false } as Accountability,
						});

						return (await service.oas.generate()).info.version;
					}

					it.each<[string, (schema: SchemaOverview) => void]>([
						['an unreadable collection', (s) => (s.collections['secrets']!.note = 'Internal')],
						['an unreadable field', (s) => (s.collections['articles']!.fields['internal_notes']!.note = 'Internal')],
					])('is unchanged for a non-admin when %s changes', async (_, change) => {
						const changed = structuredClone(restrictedSchema);
						change(changed);

						expect(await editorVersionFor(changed)).toEqual(await editorVersionFor(restrictedSchema));
					});

					it('changes for a non-admin when a readable field changes', async () => {
						const changed = structuredClone(restrictedSchema);
						changed.collections['articles']!.fields['title']!.note = 'Headline';

						expect(await editorVersionFor(changed)).not.toEqual(await editorVersionFor(restrictedSchema));
					});

					it('changes when a non-admin caller gains a permission action', async () => {
						const service = new SpecificationService({
							knex: db,
							schema: articlesSchema,
							accountability: { role: 'editor', user: 'editor-user', admin: false } as Accountability,
						});

						vi.mocked(fetchPermissions).mockResolvedValue([
							{ collection: 'articles', action: 'read', fields: ['*'] } as any,
						]);

						const readOnly = await service.oas.generate();

						vi.mocked(fetchPermissions).mockResolvedValue([
							{ collection: 'articles', action: 'read', fields: ['*'] } as any,
							{ collection: 'articles', action: 'update', fields: ['*'] } as any,
						]);

						const readAndUpdate = await service.oas.generate();

						expect(readAndUpdate.info.version).not.toEqual(readOnly.info.version);
					});

					it('differs between a signed-in user and a public caller with the same permissions', async () => {
						vi.mocked(fetchPermissions).mockResolvedValue([
							{ collection: 'articles', action: 'read', fields: ['*'] } as any,
						]);

						const userService = new SpecificationService({
							knex: db,
							schema: articlesSchema,
							accountability: { role: 'editor', user: 'editor-user', admin: false } as Accountability,
						});

						const publicService = new SpecificationService({
							knex: db,
							schema: articlesSchema,
							accountability: { role: null, user: null, admin: false } as Accountability,
						});

						const userSpec = await userService.oas.generate();
						const publicSpec = await publicService.oas.generate();

						expect(userSpec.info.version).not.toEqual(publicSpec.info.version);
					});
				});
			});
		});
	});
});
