import type { Knex } from 'knex';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import type { MockedFunction } from 'vitest';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CollectionsService, FieldsService, RelationsService, SpecificationService } from './index.js';
import type { Collection } from '../types/index.js';

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

	describe('Services / Specifications', () => {
		describe('oas', () => {
			describe('generate', () => {
				let service: SpecificationService;

				beforeEach(() => {
					service = new SpecificationService({
						knex: db,
						schema: { collections: {}, relations: [] },
						accountability: { role: 'admin', admin: true },
					});
				});

				describe('schema', () => {
					it('returns untyped schema for json fields', async () => {
						vi.spyOn(CollectionsService.prototype, 'readByQuery').mockResolvedValue([
							{
								collection: 'test_table',
								meta: {
									accountability: 'all',
									collection: 'test_table',
									group: null,
									hidden: false,
									icon: null,
									item_duplication_fields: null,
									note: null,
									singleton: false,
									translations: null,
								},
								schema: {
									name: 'test_table',
								},
							},
						] as any[]);

						vi.spyOn(FieldsService.prototype, 'readAll').mockResolvedValue([
							{
								collection: 'test_table',
								field: 'id',
								name: 'id',
								type: 'integer',
								meta: {
									id: 1,
									collection: 'test_table',
									conditions: null,
									display: null,
									display_options: null,
									field: 'id',
									group: null,
									hidden: true,
									interface: null,
									note: null,
									options: null,
									readonly: false,
									required: false,
									sort: null,
									special: null,
									translations: null,
									validation: null,
									validation_message: null,
									width: 'full',
								},
								schema: {
									comment: null,
									data_type: 'integer',
									default_value: null,
									foreign_key_column: null,
									foreign_key_schema: null,
									foreign_key_table: null,
									generation_expression: null,
									has_auto_increment: false,
									is_generated: false,
									is_nullable: false,
									is_primary_key: true,
									is_unique: true,
									max_length: null,
									name: 'id',
									numeric_precision: null,
									numeric_scale: null,
									table: 'test_table',
								},
							},
							{
								collection: 'test_table',
								field: 'blob',
								name: 'blob',
								type: 'json',
								meta: {
									id: 2,
									collection: 'test_table',
									conditions: null,
									display: null,
									display_options: null,
									field: 'blob',
									group: null,
									hidden: true,
									interface: null,
									note: null,
									options: null,
									readonly: false,
									required: false,
									sort: null,
									special: null,
									translations: null,
									validation: null,
									validation_message: null,
									width: 'full',
								},
								schema: {
									comment: null,
									data_type: 'json',
									default_value: null,
									foreign_key_column: null,
									foreign_key_schema: null,
									foreign_key_table: null,
									generation_expression: null,
									has_auto_increment: false,
									is_generated: false,
									is_nullable: true,
									is_primary_key: false,
									is_unique: false,
									max_length: null,
									name: 'blob',
									numeric_precision: null,
									numeric_scale: null,
									table: 'test_table',
								},
							},
						]);

						vi.spyOn(RelationsService.prototype, 'readAll').mockResolvedValue([]);

						const spec = await service.oas.generate();

						expect(spec.components?.schemas).toMatchInlineSnapshot(`
							{
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
						const collection: Collection = {
							collection: 'test_table',
							meta: {
								accountability: 'all',
								collection: 'test_table',
								group: null,
								hidden: false,
								icon: null,
								item_duplication_fields: null,
								note: null,
								singleton: false,
								translations: {},
							},
							schema: {
								name: 'test_table',
							},
						};

						vi.spyOn(CollectionsService.prototype, 'readByQuery').mockResolvedValue([collection]);

						vi.spyOn(FieldsService.prototype, 'readAll').mockResolvedValue([
							{
								collection: collection.collection,
								field: 'id',
								name: 'id',
								type: 'integer',
								meta: {
									id: 1,
									collection: 'test_table',
									conditions: null,
									display: null,
									display_options: null,
									field: 'id',
									group: null,
									hidden: true,
									interface: null,
									note: null,
									options: null,
									readonly: false,
									required: false,
									sort: null,
									special: null,
									translations: null,
									validation: null,
									validation_message: null,
									width: 'full',
								},
								schema: {
									comment: null,
									data_type: 'integer',
									default_value: null,
									foreign_key_column: null,
									foreign_key_schema: null,
									foreign_key_table: null,
									generation_expression: null,
									has_auto_increment: false,
									is_generated: false,
									is_nullable: false,
									is_primary_key: true,
									is_unique: true,
									max_length: null,
									name: 'id',
									numeric_precision: null,
									numeric_scale: null,
									table: 'test_table',
								},
							},
						]);

						vi.spyOn(RelationsService.prototype, 'readAll').mockResolvedValue([]);

						const spec = await service.oas.generate();

						const targetSchema =
							spec.paths[`/items/${collection.collection}`].post.requestBody.content['application/json'].schema;

						expect(targetSchema).toHaveProperty('oneOf');
						expect(targetSchema).not.toHaveProperty('type');
					});
				});
			});
		});
	});
});
