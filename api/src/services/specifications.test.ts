import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import type { RequestBodyObject } from 'openapi3-ts/oas30';
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

						expect(spec.components?.schemas).toMatchInlineSnapshot(`
							{
							  "Collections": {
							    "properties": {
							      "collection": {
							        "description": "The collection key.",
							        "example": "customers",
							        "type": "string",
							      },
							      "meta": {
							        "description": "Metadata of the collection.",
							        "example": null,
							        "nullable": true,
							        "properties": {
							          "archive_app_filter": {
							            "description": "What value to use for "archived" items.",
							            "example": null,
							            "nullable": true,
							            "type": "string",
							          },
							          "archive_field": {
							            "description": "What field holds the archive value.",
							            "example": null,
							            "nullable": true,
							            "type": "string",
							          },
							          "archive_value": {
							            "description": "What value to use to "unarchive" items.",
							            "example": null,
							            "nullable": true,
							            "type": "string",
							          },
							          "collection": {
							            "description": "The collection key.",
							            "example": "customers",
							            "type": "string",
							          },
							          "color": {
							            "description": "Choose an accent color for this collection.",
							            "example": "#6644ff",
							            "nullable": true,
							            "type": "string",
							          },
							          "display_template": {
							            "description": "Text representation of how items from this collection are shown across the system.",
							            "example": null,
							            "nullable": true,
							            "type": "string",
							          },
							          "hidden": {
							            "description": "Whether or not the collection is hidden from the navigation in the admin app.",
							            "example": false,
							            "type": "boolean",
							          },
							          "icon": {
							            "description": "Name of a Google Material Design Icon that's assigned to this collection.",
							            "example": "people",
							            "nullable": true,
							            "type": "string",
							          },
							          "note": {
							            "description": "A note describing the collection.",
							            "example": null,
							            "nullable": true,
							            "type": "string",
							          },
							          "singleton": {
							            "description": "Whether or not the collection is treated as a single object.",
							            "example": false,
							            "type": "boolean",
							          },
							          "sort_field": {
							            "description": "The sort field in the collection.",
							            "example": null,
							            "nullable": true,
							            "type": "string",
							          },
							          "translations": {
							            "description": "Key value pairs of how to show this collection's name in different languages in the admin app.",
							            "example": null,
							            "nullable": true,
							            "type": "string",
							          },
							          "unarchive_value": {
							            "description": "Whether or not to show the "archived" filter.",
							            "example": null,
							            "nullable": true,
							            "type": "string",
							          },
							          "versioning": {
							            "description": "Whether or not Content Versioning is enabled for this collection.",
							            "example": false,
							            "type": "boolean",
							          },
							        },
							        "type": "object",
							      },
							      "schema": {
							        "properties": {
							          "comment": {
							            "description": "Comment as saved in the database.",
							            "example": null,
							            "nullable": true,
							            "type": "string",
							          },
							          "name": {
							            "description": "The collection key.",
							            "example": "customers",
							            "type": "string",
							          },
							          "schema": {
							            "description": "Database schema (pg only).",
							            "example": "public",
							            "type": "string",
							          },
							        },
							        "type": "object",
							      },
							    },
							    "type": "object",
							  },
							  "Diff": {
							    "properties": {
							      "diff": {
							        "properties": {
							          "collections": {
							            "items": {
							              "properties": {
							                "collection": {
							                  "type": "string",
							                },
							                "diff": {
							                  "items": {
							                    "type": "object",
							                  },
							                  "type": "array",
							                },
							              },
							              "type": "object",
							            },
							            "type": "array",
							          },
							          "fields": {
							            "items": {
							              "properties": {
							                "collection": {
							                  "type": "string",
							                },
							                "diff": {
							                  "items": {
							                    "type": "object",
							                  },
							                  "type": "array",
							                },
							                "field": {
							                  "type": "string",
							                },
							              },
							              "type": "object",
							            },
							            "type": "array",
							          },
							          "relations": {
							            "items": {
							              "properties": {
							                "collection": {
							                  "type": "string",
							                },
							                "diff": {
							                  "items": {
							                    "type": "object",
							                  },
							                  "type": "array",
							                },
							                "field": {
							                  "type": "string",
							                },
							                "related_collection": {
							                  "type": "string",
							                },
							              },
							              "type": "object",
							            },
							            "type": "array",
							          },
							        },
							        "type": "object",
							      },
							      "hash": {
							        "type": "string",
							      },
							    },
							    "type": "object",
							  },
							  "Error": {
							    "properties": {
							      "extensions": {
							        "additionalProperties": true,
							        "properties": {
							          "code": {
							            "type": "string",
							          },
							        },
							        "required": [
							          "code",
							        ],
							        "type": "object",
							      },
							      "message": {
							        "type": "string",
							      },
							    },
							    "required": [
							      "message",
							      "extensions",
							    ],
							    "type": "object",
							  },
							  "Fields": {
							    "properties": {
							      "collection": {
							        "description": "Unique name of the collection this field is in.",
							        "example": "about_us",
							        "type": "string",
							      },
							      "field": {
							        "description": "Unique name of the field. Field name is unique within the collection.",
							        "example": "id",
							        "type": "string",
							      },
							      "meta": {
							        "description": "The meta info.",
							        "nullable": true,
							        "properties": {
							          "collection": {
							            "description": "Unique name of the collection this field is in.",
							            "example": "posts",
							            "type": "string",
							          },
							          "display": {
							            "description": "What display is used in the admin app to display the value for this field.",
							            "example": null,
							            "nullable": true,
							            "type": "string",
							          },
							          "display_options": {
							            "description": "Options for the display that's used. This format is based on the individual display.",
							            "example": null,
							            "nullable": true,
							            "type": "object",
							          },
							          "field": {
							            "description": "Unique name of the field. Field name is unique within the collection.",
							            "example": "title",
							            "type": "string",
							          },
							          "group": {
							            "description": "What field group this field is part of.",
							            "example": null,
							            "nullable": true,
							            "type": "integer",
							          },
							          "hidden": {
							            "description": "If this field should be hidden.",
							            "example": true,
							            "type": "boolean",
							          },
							          "id": {
							            "description": "Unique identifier for the field in the \`directus_fields\` collection.",
							            "example": 3,
							            "type": "integer",
							          },
							          "locked": {
							            "description": "If the field can be altered by the end user. Most Directus system fields have this value set to \`true\`.",
							            "example": true,
							            "type": "boolean",
							          },
							          "note": {
							            "description": "A user provided note for the field. Will be rendered alongside the interface on the edit page.",
							            "example": "",
							            "nullable": true,
							            "type": "string",
							          },
							          "options": {
							            "description": "Options for the interface that's used. This format is based on the individual interface.",
							            "example": null,
							            "nullable": true,
							            "type": "object",
							          },
							          "readonly": {
							            "description": "Prevents the user from editing the value in the field.",
							            "example": false,
							            "type": "boolean",
							          },
							          "sort": {
							            "description": "Sort order of this field on the edit page of the admin app.",
							            "example": 1,
							            "nullable": true,
							            "type": "integer",
							          },
							          "special": {
							            "description": "Transformation flags for field",
							            "example": null,
							            "items": {
							              "type": "string",
							            },
							            "nullable": true,
							            "type": "array",
							          },
							          "system-interface": {
							            "description": "What interface is used in the admin app to edit the value for this field.",
							            "example": "primary-key",
							            "nullable": true,
							            "type": "string",
							          },
							          "translations": {
							            "description": "Key value pair of \`<language>: <translation>\` that allows the user to change the displayed name of the field in the admin app.",
							            "example": null,
							            "nullable": true,
							            "type": "object",
							          },
							          "width": {
							            "description": "Width of the field on the edit form.",
							            "enum": [
							              "half",
							              "half-left",
							              "half-right",
							              "full",
							              "fill",
							              null,
							            ],
							            "example": null,
							            "nullable": true,
							            "type": "string",
							          },
							        },
							        "type": "object",
							      },
							      "schema": {
							        "description": "The schema info.",
							        "properties": {
							          "comment": {
							            "description": "Comment as saved in the database.",
							            "example": null,
							            "nullable": true,
							            "type": "string",
							          },
							          "default_value": {
							            "description": "The default value of the field.",
							            "example": null,
							            "nullable": true,
							            "type": "string",
							          },
							          "foreign_key_column": {
							            "description": "Related column from the foreign key constraint.",
							            "example": null,
							            "nullable": true,
							            "type": "string",
							          },
							          "foreign_key_schema": {
							            "description": "Related schema from the foreign key constraint (pg only).",
							            "example": null,
							            "nullable": true,
							            "type": "string",
							          },
							          "foreign_key_table": {
							            "description": "Related table from the foreign key constraint.",
							            "example": null,
							            "nullable": true,
							            "type": "string",
							          },
							          "has_auto_increment": {
							            "description": "If the field has auto increment.",
							            "example": false,
							            "type": "boolean",
							          },
							          "is_nullable": {
							            "description": "If the field is nullable.",
							            "example": false,
							            "type": "boolean",
							          },
							          "is_primary_key": {
							            "description": "If the field is primary key.",
							            "example": false,
							            "type": "boolean",
							          },
							          "max_length": {
							            "description": "The max length of the field.",
							            "example": null,
							            "nullable": true,
							            "type": "integer",
							          },
							          "name": {
							            "description": "The name of the field.",
							            "example": "title",
							            "type": "string",
							          },
							          "schema": {
							            "description": "Database schema (pg only).",
							            "example": "public",
							            "type": "string",
							          },
							          "table": {
							            "description": "The collection of the field.",
							            "example": "posts",
							            "type": "string",
							          },
							          "type": {
							            "description": "The datatype of the field.",
							            "example": "string",
							            "type": "string",
							          },
							        },
							        "type": "object",
							      },
							      "type": {
							        "description": "Directus specific data type. Used to cast values in the API.",
							        "example": "integer",
							        "type": "string",
							      },
							    },
							    "type": "object",
							  },
							  "ItemsTestTable": {
							    "properties": {
							      "blob": {
							        "nullable": true,
							      },
							      "id": {
							        "nullable": false,
							        "type": "integer",
							      },
							    },
							    "required": [
							      "id",
							    ],
							    "type": "object",
							    "x-collection": "test_table",
							  },
							  "Query": {
							    "properties": {
							      "deep": {
							        "description": "Deep allows you to set any of the other query parameters on a nested relational dataset.",
							        "example": {
							          "related_articles": {
							            "_limit": 3,
							          },
							        },
							        "type": "object",
							      },
							      "fields": {
							        "description": "Control what fields are being returned in the object.",
							        "example": [
							          "*",
							          "*.*",
							        ],
							        "items": {
							          "type": "string",
							        },
							        "type": "array",
							      },
							      "filter": {
							        "example": {
							          "<field>": {
							            "<operator>": "<value>",
							          },
							        },
							        "type": "object",
							      },
							      "limit": {
							        "description": "Set the maximum number of items that will be returned",
							        "type": "number",
							      },
							      "offset": {
							        "description": "How many items to skip when fetching data.",
							        "type": "number",
							      },
							      "page": {
							        "description": "Cursor for use in pagination. Often used in combination with limit.",
							        "type": "number",
							      },
							      "search": {
							        "description": "Filter by items that contain the given search query in one of their fields.",
							        "type": "string",
							      },
							      "sort": {
							        "description": "How to sort the returned items.",
							        "example": [
							          "-date_created",
							        ],
							        "items": {
							          "type": "string",
							        },
							        "type": "array",
							      },
							    },
							    "type": "object",
							  },
							  "Relations": {
							    "properties": {
							      "id": {
							        "description": "Unique identifier for the relation.",
							        "example": 1,
							        "type": "integer",
							      },
							      "junction_field": {
							        "description": "Field on the junction table that holds the many field of the related relation.",
							        "example": null,
							        "nullable": true,
							        "type": "string",
							      },
							      "many_collection": {
							        "description": "Collection that has the field that holds the foreign key.",
							        "example": "directus_activity",
							        "type": "string",
							      },
							      "many_field": {
							        "description": "Foreign key. Field that holds the primary key of the related collection.",
							        "example": "user",
							        "type": "string",
							      },
							      "many_primary": {
							        "description": "The primary key field of the current collection.",
							        "example": "id",
							        "type": "string",
							      },
							      "one_collection": {
							        "description": "Collection on the _one_ side of the relationship.",
							        "example": "directus_users",
							        "type": "string",
							      },
							      "one_field": {
							        "description": "Alias column that serves as the _one_ side of the relationship.",
							        "example": null,
							        "nullable": true,
							        "type": "string",
							      },
							      "one_primary": {
							        "description": "The primary key field of the related collection.",
							        "example": "id",
							        "type": "string",
							      },
							    },
							    "type": "object",
							  },
							  "Schema": {
							    "properties": {
							      "collections": {
							        "items": {
							          "$ref": "#/components/schemas/Collections",
							        },
							        "type": "array",
							      },
							      "directus": {
							        "type": "string",
							      },
							      "fields": {
							        "items": {
							          "$ref": "#/components/schemas/Fields",
							        },
							        "type": "array",
							      },
							      "relations": {
							        "items": {
							          "$ref": "#/components/schemas/Relations",
							        },
							        "type": "array",
							      },
							      "vendor": {
							        "type": "string",
							      },
							      "version": {
							        "example": 1,
							        "type": "integer",
							      },
							    },
							    "type": "object",
							  },
							  "x-metadata": {
							    "properties": {
							      "filter_count": {
							        "description": "Returns the item count of the collection you're querying, taking the current filter/search parameters into account.",
							        "type": "integer",
							      },
							      "total_count": {
							        "description": "Returns the total item count of the collection you're querying.",
							        "type": "integer",
							      },
							    },
							    "type": "object",
							  },
							}
						`);
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
