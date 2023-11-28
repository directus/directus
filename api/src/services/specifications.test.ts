import type { Knex } from 'knex';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import type { MockedFunction } from 'vitest';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { SpecificationService } from './index.js';
import type { CollectionsOverview } from '@directus/types';

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
				describe('schema', () => {
					it('returns untyped schema for json fields', async () => {
						const service = new SpecificationService({
							knex: db,
							schema: {
								collections: {
									test_table: {
										collection: 'test_table',
										primary: 'id',
										singleton: false,
										sortField: null,
										accountability: 'all',
										note: null,
										fields: {
											id: {
												field: 'id',
												type: 'integer',
												nullable: false,
												generated: false,
												defaultValue: null,
												dbType: 'integer',
												precision: null,
												scale: null,
												special: [],
												note: null,
												validation: null,
												alias: false,
											},
											blob: {
												field: 'blob',
												type: 'json',
												dbType: 'json',
												defaultValue: null,
												nullable: true,
												generated: false,
												precision: null,
												scale: null,
												special: [],
												note: null,
												alias: false,
												validation: null,
											},
										},
									},
								} as CollectionsOverview,
								relations: [],
							},
							accountability: { role: 'admin', admin: true },
						});

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
						const service = new SpecificationService({
							knex: db,
							schema: {
								collections: {
									test_table: {
										collection: 'test_table',
										primary: 'id',
										singleton: false,
										sortField: null,
										accountability: 'all',
										note: null,
										fields: {
											id: {
												field: 'id',
												type: 'integer',
												nullable: false,
												generated: false,
												defaultValue: null,
												dbType: 'integer',
												precision: null,
												scale: null,
												special: [],
												note: null,
												validation: null,
												alias: false,
											},
										},
									},
								} as CollectionsOverview,
								relations: [],
							},
							accountability: { role: 'admin', admin: true },
						});

						const spec = await service.oas.generate();

						const targetSchema = spec.paths['/items/test_table']?.post?.requestBody?.content['application/json'].schema;

						expect(targetSchema).toHaveProperty('oneOf');
						expect(targetSchema).not.toHaveProperty('type');
					});
				});
			});
		});
	});
});
