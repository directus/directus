import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import type { RequestBodyObject } from 'openapi3-ts/oas30';
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
							      "aggregate": {
							        "description": "Aggregate function to apply, mapped to the field(s) to apply it to, for example \`count\`, \`sum\`, \`avg\`, \`min\`, or \`max\`.
							",
							        "example": {
							          "count": [
							            "*",
							          ],
							        },
							        "type": "object",
							      },
							      "alias": {
							        "description": "Rename fields on the fly, so you can request the same field multiple times using different relational paths, filters, or aggregations.
							",
							        "example": {
							          "author_name": "author.name",
							        },
							        "type": "object",
							      },
							      "backlink": {
							        "default": true,
							        "description": "Toggle whether reverse-relational fields are included when expanding a \`*.*\` wildcard. Explicitly specified field names are not affected, so \`fields=author.articles\` still includes the reverse relation even when \`backlink\` is \`false\`.
							",
							        "type": "boolean",
							      },
							      "deep": {
							        "description": "Deep allows you to set any of the other query parameters on a nested relational dataset.",
							        "example": {
							          "related_articles": {
							            "_limit": 3,
							          },
							        },
							        "type": "object",
							      },
							      "export": {
							        "description": "Saves the API response to a file. Accepts one of "csv", "csv_utf8", "json", "xml", "yaml".",
							        "enum": [
							          "csv",
							          "csv_utf8",
							          "json",
							          "xml",
							          "yaml",
							        ],
							        "type": "string",
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
							        "description": "Select items in the collection that match the given filter conditions.",
							        "example": {
							          "<field>": {
							            "<operator>": "<value>",
							          },
							        },
							        "externalDocs": {
							          "description": "Available operators and dynamic variables",
							          "url": "https://directus.com/docs/guides/connect/filter-rules#available-operators",
							        },
							        "type": "object",
							      },
							      "groupBy": {
							        "description": "Group the returned items by the given field(s).",
							        "example": [
							          "status",
							        ],
							        "items": {
							          "type": "string",
							        },
							        "type": "array",
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
							        "description": "How to sort the returned items. \`sort\` is a CSV of fields used to sort the fetched items. Sorting defaults to ascending (ASC) order but a minus sign (\` - \`) can be used to reverse this to descending (DESC) order. Fields are prioritized by their order in the CSV. You can also use a \` ? \` to sort randomly.
							",
							        "example": [
							          "-date_created",
							        ],
							        "items": {
							          "type": "string",
							        },
							        "type": "array",
							      },
							      "version": {
							        "description": "Retrieve an item's state from a specific Content Version. The value corresponds to the "key" of the Content Version.
							",
							        "type": "string",
							      },
							      "versionRaw": {
							        "default": false,
							        "description": "When used with \`version\`, returns the raw revision data instead of the merged item data.",
							        "type": "boolean",
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
			});
		});
	});
});
