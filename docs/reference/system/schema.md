---
description: REST and GraphQL API documentation on the Schema endpoint in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Schema

> Retrieve and update the schema of an instance.

## Retrieve Schema Snapshot

Retrieve the current schema. This endpoint is only available to admin users.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```
// returns JSON object
GET /schema/snapshot

// download as YAML file
GET /schema/snapshot?export=yaml
```

</template>
<template #graphql>

```
// Not supported in GraphQL
```

</template>
<template #sdk>

```js
import { createDirectus, rest, schemaSnapshot } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(schemaSnapshot());
```

</template>
</SnippetToggler>

#### Query Parameters

Supports the [export](/reference/query#export) query parameter.

### Response

Returns the JSON object containing schema details by default, or downloads it in an alternative format when `export`
query parameter is used.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```
// returns JSON object
GET /schema/snapshot

// download as YAML file
GET /schema/snapshot?export=yaml
```

</template>
<template #graphql>

// Not supported in GraphQL

</template>
<template #sdk>

```js
import { createDirectus, rest, schemaSnapshot } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(schemaSnapshot());
```

</template>
</SnippetToggler>

## Retrieve Schema Difference

Compare the current instance's schema against the schema snapshot in JSON request body and retrieve the difference. This
endpoint is only available to admin users.

Alternatively, upload a JSON or YAML schema file. Relies on a `multipart/form-data` encoded request like regular file
uploads. Check [Upload a File](/reference/files#upload-a-file) for more information.

::: warning Different versions and vendors

This endpoint does not allow different Directus versions and database vendors by default. This is to avoid any
unintentional diffs from being generated. You can opt in to bypass these checks by passing the `force` query parameter.

:::

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

::: details **Toggle Open to See Request**

```
POST /schema/diff

Content-Type: multipart/form-data; charset=utf-8; boundary=__X_BOUNDARY__
Content-Length: 3442422

--__X_BOUNDARY__
Content-Disposition: form-data; name="file"; filename="schema.yaml"
Content-Type: text/yaml

version: version_num
directus: directus_version
vendor: database_type
collections:
  - collection: collection_name
    meta:
      // Meta fields
    schema:
      // Schema fields
fields:
  - collection: collection_name
    field: field_id
    type: field_type
    meta:
      // Meta fields
    schema:
      // Schema Fields
  - collection: collection_name
    field: field_id
    type: field_type
    meta:
      // Meta fields
    schema:
      // Schema Fields
  - collection: collection_name
    field: field_id
    type: field_type
    meta:
      // Meta fields
    schema:
      // Schema Fields
relations: []
```

:::

</template>
<template #graphql>

```
// Not supported in GraphQL
```

</template>
<template #sdk>

::: details **Toggle Open to See Request**

```js
import { createDirectus, rest, schemaDiff } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	schemaDiff({
		version: version_num,
		directus: 'directus_version',
		vendor: 'database_type',
		collections: [
			{
				collection: 'collection_name',
				meta: {
					// Meta fields
				},
				schema: {
					// Schema fields
				},
			},
		],
		fields: [
			{
				collection: 'collection_name',
				field: 'field_1_id',
				type: 'field_1_type',
				meta: {
					// Meta fields
				},
				schema: {
					// Meta fields
				},
			},
			{
				collection: 'collection_name',
				field: 'field_2_id',
				type: 'field_2_type',
				meta: {
					// Meta fields
				},
				schema: {
					// Meta fields
				},
			},
			{
				collection: 'collection_name',
				field: 'field_3_id',
				type: 'field_3_type',
				meta: {
					// Meta fields
				},
				schema: {
					// Meta fields
				},
			},
		],
		relations: [],
	})
);

console.dir(result, { depth: null });
```

:::

</template>
</SnippetToggler>

#### Query Parameters

`force` **boolean**\
Bypass version and database vendor restrictions.

#### Request Body

JSON object containing [collections](/reference/system/collections#the-collection-object),
[fields](/reference/system/fields#the-field-object), and [relations](/reference/system/relations#the-relation-object) to
apply.

Alternatively, send a JSON or YAML schema file in a `multipart/form-data` request. See
[Upload a File](/reference/files#upload-a-file) for more information.

### Response

Returns the differences between the current instance's schema and the schema passed in the request body.

::: details **Toggle Open to See Sample Response**

```json
{
	"hash": "2b3c71570228b864e16098147e5497f61b245a42",
	"diff": {
		"collections": [
			{
				"collection": "articles",
				"diff": [
					{
						"kind": "N",
						"rhs": {
							"collection": "articles",
							"meta": {
								"accountability": "all",
								"archive_app_filter": true,
								"archive_field": null,
								"archive_value": null,
								"collapse": "open",
								"collection": "articles",
								"color": null,
								"display_template": null,
								"group": null,
								"hidden": false,
								"icon": null,
								"item_duplication_fields": null,
								"note": null,
								"singleton": false,
								"sort": null,
								"sort_field": null,
								"translations": null,
								"unarchive_value": null
							},
							"schema": {
								"name": "articles"
							}
						}
					}
				]
			}
		],
		"fields": [
			{
				"collection": "articles",
				"field": "id",
				"diff": [
					{
						"kind": "N",
						"rhs": {
							"collection": "articles",
							"field": "id",
							"type": "integer",
							"meta": {
								"collection": "articles",
								"conditions": null,
								"display": null,
								"display_options": null,
								"field": "id",
								"group": null,
								"hidden": true,
								"interface": "input",
								"note": null,
								"options": null,
								"readonly": true,
								"required": false,
								"sort": null,
								"special": null,
								"translations": null,
								"validation": null,
								"validation_message": null,
								"width": "full"
							},
							"schema": {
								"name": "id",
								"table": "articles",
								"data_type": "integer",
								"default_value": null,
								"max_length": null,
								"numeric_precision": null,
								"numeric_scale": null,
								"is_nullable": false,
								"is_unique": false,
								"is_primary_key": true,
								"is_generated": false,
								"generation_expression": null,
								"has_auto_increment": true,
								"foreign_key_table": null,
								"foreign_key_column": null
							}
						}
					}
				]
			},
			{
				"collection": "articles",
				"field": "title",
				"diff": [
					{
						"kind": "N",
						"rhs": {
							"collection": "articles",
							"field": "title",
							"type": "string",
							"meta": {
								"collection": "articles",
								"conditions": null,
								"display": null,
								"display_options": null,
								"field": "title",
								"group": null,
								"hidden": false,
								"interface": "input",
								"note": null,
								"options": null,
								"readonly": false,
								"required": false,
								"sort": null,
								"special": null,
								"translations": null,
								"validation": null,
								"validation_message": null,
								"width": "full"
							},
							"schema": {
								"name": "title",
								"table": "articles",
								"data_type": "varchar",
								"default_value": null,
								"max_length": 255,
								"numeric_precision": null,
								"numeric_scale": null,
								"is_nullable": true,
								"is_unique": false,
								"is_primary_key": false,
								"is_generated": false,
								"generation_expression": null,
								"has_auto_increment": false,
								"foreign_key_table": null,
								"foreign_key_column": null
							}
						}
					}
				]
			}
		],
		"relations": []
	}
}
```

:::

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

::: details **Toggle Open to See Example Request**

```
POST /schema/diff

Content-Type: multipart/form-data; charset=utf-8; boundary=__X_BOUNDARY__
Content-Length: 3442422

--__X_BOUNDARY__
Content-Disposition: form-data; name="file"; filename="schema.yaml"
Content-Type: text/yaml

version: 1
directus: 10.0.0
vendor: sqlite
collections:
  - collection: articles
    meta:
      accountability: all
      archive_app_filter: true
      archive_field: null
      archive_value: null
      collapse: open
      collection: articles
      color: null
      display_template: null
      group: null
      hidden: false
      icon: null
      item_duplication_fields: null
      note: null
      singleton: false
      sort: null
      sort_field: null
      translations: null
      unarchive_value: null
    schema:
      name: articles
fields:
  - collection: articles
    field: id
    type: integer
    meta:
      collection: articles
      conditions: null
      display: null
      display_options: null
      field: id
      group: null
      hidden: true
      interface: input
      note: null
      options: null
      readonly: true
      required: false
      sort: null
      special: null
      translations: null
      validation: null
      validation_message: null
      width: full
    schema:
      name: id
      table: articles
      data_type: integer
      default_value: null
      max_length: null
      numeric_precision: null
      numeric_scale: null
      is_nullable: false
      is_unique: false
      is_primary_key: true
      is_generated: false
      generation_expression: null
      has_auto_increment: true
      foreign_key_table: null
      foreign_key_column: null
  - collection: articles
    field: title
    type: string
    meta:
      collection: articles
      conditions: null
      display: null
      display_options: null
      field: title
      group: null
      hidden: false
      interface: input
      note: null
      options: null
      readonly: false
      required: false
      sort: null
      special: null
      translations: null
      validation: null
      validation_message: null
      width: full
    schema:
      name: title
      table: articles
      data_type: varchar
      default_value: null
      max_length: 255
      numeric_precision: null
      numeric_scale: null
      is_nullable: true
      is_unique: false
      is_primary_key: false
      is_generated: false
      generation_expression: null
      has_auto_increment: false
      foreign_key_table: null
      foreign_key_column: null
relations: []
```

:::

</template>
<template #graphql>

```
// Not supported in GraphQL
```

</template>
<template #sdk>

::: details **Toggle Open to See Example Request**

```js
import { createDirectus, rest, schemaDiff } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	schemaDiff({
		version: 1,
		directus: '12.0.3',
		vendor: 'postgres',
		collections: [
			{
				collection: 'posts',
				meta: {
					accountability: 'all',
					archive_app_filter: true,
					archive_field: null,
					archive_value: null,
					collapse: 'open',
					collection: 'posts',
					color: null,
					display_template: null,
					group: null,
					hidden: false,
					icon: null,
					item_duplication_fields: null,
					note: null,
					singleton: false,
					sort: null,
					sort_field: null,
					translations: null,
					unarchive_value: null,
				},
				schema: {
					name: 'posts',
				},
			},
		],
		fields: [
			{
				collection: 'posts',
				field: 'id',
				type: 'integer',
				meta: {
					collection: 'posts',
					conditions: null,
					display: null,
					display_options: null,
					field: 'id',
					group: null,
					hidden: true,
					interface: 'input',
					note: null,
					options: null,
					readonly: true,
					required: false,
					sort: null,
					special: null,
					translations: null,
					validation: null,
					validation_message: null,
					width: 'full',
				},
				schema: {
					name: 'id',
					table: 'posts',
					data_type: 'integer',
					default_value: null,
					max_length: null,
					numeric_precision: null,
					numeric_scale: null,
					is_nullable: false,
					is_unique: false,
					is_primary_key: true,
					is_generated: false,
					generation_expression: null,
					has_auto_increment: true,
					foreign_key_table: null,
					foreign_key_column: null,
				},
			},
			{
				collection: 'posts',
				field: 'title',
				type: 'string',
				meta: {
					collection: 'posts',
					conditions: null,
					display: null,
					display_options: null,
					field: 'title',
					group: null,
					hidden: false,
					interface: 'input',
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
					name: 'title',
					table: 'posts',
					data_type: 'varchar',
					default_value: null,
					max_length: 255,
					numeric_precision: null,
					numeric_scale: null,
					is_nullable: true,
					is_unique: false,
					is_primary_key: false,
					is_generated: false,
					generation_expression: null,
					has_auto_increment: false,
					foreign_key_table: null,
					foreign_key_column: null,
				},
			},
		],
		relations: [],
	})
);

console.dir(result, { depth: null });
```

:::

</template>
</SnippetToggler>

## Apply Schema Difference

Update the instance's schema by passing the diff previously retrieved via `/schema/diff` endpoint in the request body.
This endpoint is only available to admin users.

### Request

See Example

#### Query Parameters

This endpoint doesn't currently support any query parameters.

#### Request Body

JSON object containing hash and diffs of [collections](/reference/system/collections#the-collection-object),
[fields](/reference/system/fields#the-field-object), and [relations](/reference/system/relations#the-relation-object) to
apply.

Alternatively, upload a JSON or YAML schema file. Relies on a `multipart/form-data` encoded request like regular file
uploads. Check [Upload a File](/reference/files#upload-a-file) for more information.

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

::: details **Toggle Open to See Sample Body**

```
POST /schema/apply

{
  "hash": "2b3c71570228b864e16098147e5497f61b245a42",
  "diff": {
    "collections": [
      {
        "collection": "articles",
        "diff": [
          {
            "kind": "N",
            "rhs": {
              "collection": "articles",
              "meta": {
                "accountability": "all",
                "archive_app_filter": true,
                "archive_field": null,
                "archive_value": null,
                "collapse": "open",
                "collection": "articles",
                "color": null,
                "display_template": null,
                "group": null,
                "hidden": false,
                "icon": null,
                "item_duplication_fields": null,
                "note": null,
                "singleton": false,
                "sort": null,
                "sort_field": null,
                "translations": null,
                "unarchive_value": null
              },
              "schema": {
                "name": "articles"
              }
            }
          }
        ]
      }
    ],
    "fields": [
      {
        "collection": "articles",
        "field": "id",
        "diff": [
          {
            "kind": "N",
            "rhs": {
              "collection": "articles",
              "field": "id",
              "type": "integer",
              "meta": {
                "collection": "articles",
                "conditions": null,
                "display": null,
                "display_options": null,
                "field": "id",
                "group": null,
                "hidden": true,
                "interface": "input",
                "note": null,
                "options": null,
                "readonly": true,
                "required": false,
                "sort": null,
                "special": null,
                "translations": null,
                "validation": null,
                "validation_message": null,
                "width": "full"
              },
              "schema": {
                "name": "id",
                "table": "articles",
                "data_type": "integer",
                "default_value": null,
                "max_length": null,
                "numeric_precision": null,
                "numeric_scale": null,
                "is_nullable": false,
                "is_unique": false,
                "is_primary_key": true,
                "is_generated": false,
                "generation_expression": null,
                "has_auto_increment": true,
                "foreign_key_table": null,
                "foreign_key_column": null
              }
            }
          }
        ]
      },
      {
        "collection": "articles",
        "field": "title",
        "diff": [
          {
            "kind": "N",
            "rhs": {
              "collection": "articles",
              "field": "title",
              "type": "string",
              "meta": {
                "collection": "articles",
                "conditions": null,
                "display": null,
                "display_options": null,
                "field": "title",
                "group": null,
                "hidden": false,
                "interface": "input",
                "note": null,
                "options": null,
                "readonly": false,
                "required": false,
                "sort": null,
                "special": null,
                "translations": null,
                "validation": null,
                "validation_message": null,
                "width": "full"
              },
              "schema": {
                "name": "title",
                "table": "articles",
                "data_type": "varchar",
                "default_value": null,
                "max_length": 255,
                "numeric_precision": null,
                "numeric_scale": null,
                "is_nullable": true,
                "is_unique": false,
                "is_primary_key": false,
                "is_generated": false,
                "generation_expression": null,
                "has_auto_increment": false,
                "foreign_key_table": null,
                "foreign_key_column": null
              }
            }
          }
        ]
      }
    ],
    "relations": []
  }
}
```

:::

</template>
<template #graphql>

```
/// Not Supported in GraphQL
```

</template>
<template #sdk>

::: details **Toggle Open to See Example Request**

```js
import { createDirectus, rest, schemaApply } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	schemaApply({
		hash: '7d4499bc1e09bab3558b46cc09cd83fea2c05144',
		diff: {
			collections: [
				{
					collection: 'articles',
					diff: [
						{
							kind: 'N',
							rhs: {
								collection: 'articles',
								meta: {
									accountability: 'all',
									archive_app_filter: true,
									archive_field: null,
									archive_value: null,
									collapse: 'open',
									collection: 'articles',
									color: null,
									display_template: null,
									group: null,
									hidden: false,
									icon: null,
									item_duplication_fields: null,
									note: null,
									singleton: false,
									sort: null,
									sort_field: null,
									translations: null,
									unarchive_value: null,
								},
								schema: {
									name: 'articles',
								},
							},
						},
					],
				},
			],
			fields: [
				{
					collection: 'articles',
					field: 'id',
					diff: [
						{
							kind: 'N',
							rhs: {
								collection: 'articles',
								field: 'id',
								type: 'integer',
								meta: {
									collection: 'articles',
									conditions: null,
									display: null,
									display_options: null,
									field: 'id',
									group: null,
									hidden: true,
									interface: 'input',
									note: null,
									options: null,
									readonly: true,
									required: false,
									sort: null,
									special: null,
									translations: null,
									validation: null,
									validation_message: null,
									width: 'full',
								},
								schema: {
									name: 'id',
									table: 'articles',
									data_type: 'integer',
									default_value: null,
									max_length: null,
									numeric_precision: null,
									numeric_scale: null,
									is_nullable: false,
									is_unique: false,
									is_primary_key: true,
									is_generated: false,
									generation_expression: null,
									has_auto_increment: true,
									foreign_key_table: null,
									foreign_key_column: null,
								},
							},
						},
					],
				},
				{
					collection: 'articles',
					field: 'title',
					diff: [
						{
							kind: 'N',
							rhs: {
								collection: 'articles',
								field: 'title',
								type: 'string',
								meta: {
									collection: 'articles',
									conditions: null,
									display: null,
									display_options: null,
									field: 'title',
									group: null,
									hidden: false,
									interface: 'input',
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
									name: 'title',
									table: 'articles',
									data_type: 'varchar',
									default_value: null,
									max_length: 255,
									numeric_precision: null,
									numeric_scale: null,
									is_nullable: true,
									is_unique: false,
									is_primary_key: false,
									is_generated: false,
									generation_expression: null,
									has_auto_increment: false,
									foreign_key_table: null,
									foreign_key_column: null,
								},
							},
						},
					],
				},
			],
			relations: [],
		},
	})
);
```

:::

</template>
</SnippetToggler>

::: tip Hashes

The hash property in the diff is based on the target instance's schema and version. It is used to safeguard against
changes that may happen after the current diff was generated which can potentially incur unexpected side effects when
applying the diffs without this safeguard. In case the schema has been changed in the meantime, the diff must be
regenerated.

:::
