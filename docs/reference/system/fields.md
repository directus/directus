---
description: REST and GraphQL API documentation on the Fields collection in Directus.
readTime: 7 min read
pageClass: page-reference
---

# Fields

> Fields are individual pieces of content within an item. They are mapped to columns in the database.
> [Learn more about Fields](/user-guide/overview/glossary#fields).

## The Field Object

`collection` **string**\
Name of the collection the field resides in.

`field` **string**\
The identifier of the field. This matches the table column name.

`type` **string**\
The Directus data type of the field. See [Types](/user-guide/overview/glossary#types) for possible options.

#### Meta

Directus metadata, primarily used in the Data Studio. Meta is optional.

`id` **integer**\
Primary key of the metadata row in `directus_fields`.

`collection` **string**\
The name of the collection this field resides in.

`field` **string**\
Identifier of the field. Matches the column name in the database.

`special` **string**\
Any special transform flags that apply to this field.

`interface` **string**\
The interface used for this field.

`options` **object**\
The interface options configured for this field. The structure is based on the interface used.

`display` **string**\
The display used for this field.

`display_options` **string**\
The configured options for the used display.

`readonly` **boolean**\
If the field is considered readonly in the Data Studio.

`required` **boolean**\
If the field is considered required in the Data Studio.

`hidden` **boolean**\
If the field is hidden from the edit page in the Data Studio.

`sort` **integer**\
Where this field is shown on the edit page in the Data Studio.

`width` **string**\
How wide the interface is rendered on the edit page in the Data Studio. One of `half`, `half-left`, `half-right`, `half-space`,
`full`, `fill`.

`translations` **array**\
How this field's name is displayed in the different languages in the Data Studio.

`note` **string**\
Short description displayed in the Data Studio.

#### Schema

"Raw" database information. Based on the database vendor used, different information might be returned. The following
are available for all drivers. Note: schema is optional. If a field exist in directus_fields, but not in the database,
it's an alias commonly used for relational (O2M) or presentation purposes in the Data Studio.

`name` **string**\
Identifier of the field. Matches the column name in the database.

`table` **string**\
Name of the table the column resides in.

`data_type` **string**\
The datatype as used in the database. Note: this value is database vendor specific.

`default_value` **any**\
The configured default value for the column.

`max_length` **integer**\
Configured length for varchar type columns.

`numeric_precision` **integer**\
Precision for integer/float/decimal type fields.

`numeric_scale` **integer**\
Scale for integer/float/decimal type fields.

`is_generated` **boolean**\
Whether or not it is a generated column on the part of the database.

`generation_expression` **string**\
The database level expression used for computing the column, in case it is a generated column.

`is_nullable` **boolean**\
Whether or not the column is nullable. This is what is used as the "required" state in Directus.

`is_unique` **boolean**\
Whether or not the column has a unique constraint.

`is_indexed` **boolean**\
Whether or not the column is indexed.

`is_primary_key` **boolean**\
Whether or not the field is the primary key of the table.

`foreign_key_column` **string**\
If the current column has a foreign key constraint, this points to the related column.

`foreign_key_table` **string**\
If the current column has a foreign key constraint, this points to the related table.

`comment` **string**\
Comment as stored in the database.

```json
{
	"collection": "articles",
	"field": "id",
	"type": "integer",
	"meta": {
		"id": 16,
		"collection": "articles",
		"field": "id",
		"special": null,
		"interface": "numeric",
		"options": null,
		"display": null,
		"display_options": null,
		"readonly": true,
		"required": true,
		"hidden": true,
		"sort": 1,
		"width": "full",
		"translations": null,
		"note": "The unique identifier of the article"
	},
	"schema": {
		"name": "id",
		"table": "articles",
		"data_type": "integer",
		"default_value": null,
		"max_length": null,
		"numeric_precision": 32,
		"numeric_scale": 0,
		"is_generated": false,
		"generation_expression": null,
		"is_nullable": false,
		"is_unique": false,
		"is_indexed": true,
		"is_primary_key": true,
		"has_auto_increment": true,
		"foreign_key_column": null,
		"foreign_key_table": null,
		"comment": null
	}
}
```

## List All Fields

List the available fields.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /fields`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	fields: [directus_fields]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readFields } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readFields());
```

</template>
</SnippetToggler>

#### Query Parameters

This endpoint doesn't currently support any query parameters.

### Response

An array of [field objects](#the-field-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /fields`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	fields {
		collection
		field
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readFields } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readFields());
```

</template>
</SnippetToggler>

## List Fields in Collection

List the available fields in a given collection.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /fields/:collection`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	fields_in_collection(collection: String!): directus_fields
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readFieldsByCollection } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readFieldsByCollection(collection_name));
```

</template>
</SnippetToggler>

#### Query Parameters

This endpoint doesn't currently support any query parameters.

### Response

An array of [field objects](#the-field-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /fields/articles`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	fields_in_collection(collection: "articles") {
		collection
		field
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readFieldsByCollection } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(readFieldsByCollection('articles'));
```

</template>
</SnippetToggler>

## Retrieve a Field

Get a single field in a given collection.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /fields/:collection/:field`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	fields_by_name(collection: String!, field: String!): directus_fields
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readField } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readField(collection_name, field_name));
```

</template>
</SnippetToggler>

#### Query Parameters

This endpoint doesn't currently support any query parameters.

### Response

A [field object](#the-field-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /fields/articles/title`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	fields_by_name(collection: "articles", field: "title") {
		collection
		field
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readField } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(readField('articles', 'title'));
```

</template>
</SnippetToggler>

## Create a Field

Create a new field in the given collection.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /fields/:collection`

Provide a [collection object](#the-collection-object) as the body of your request with `field` and `type` being required
parameters.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_fields_item(collection: String!, data: create_directus_fields_input!): directus_fields
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createField } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(
	createField(collection_name, {
		field: field_name,
		type: field_type,
		field_field: value,
	})
);
```

</template>
</SnippetToggler>

#### Query Parameters

This endpoint doesn't currently support any query parameters.

#### Request Body

`field` **Required**\
Field key, also used as the column name.

`type` **Required**\
One of the Directus types. This in turn controls what datatype is used for the column in the database. Setting the type to
`alias` prevents a column from being created in the database.

`meta`\
Any of the optional meta values in the [field object](#the-field-object).

`schema`\
Any of the optional schema values in the [field object](#the-field-object).

### Response

The [field object](#the-field-object) for the created field.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /fields/articles`

```json
{
	"field": "title",
	"type": "string",
	"meta": {
		"icon": "title"
	},
	"schema": {
		"default_value": "Hello World"
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_fields_item(
		collection: "articles"
		data: { field: "title", type: "string", meta: { icon: "title" }, schema: { default_value: "Hello World" } }
	) {
		collection
		field
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createField } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createField('articles', {
		field: 'subject tags',
		type: 'csv',
		meta: {
			interface: 'tags',
			note: 'subject tags for an article',
		},
	})
);
```

</template>
</SnippetToggler>

## Update a Field

Updates the given field in the given collection.

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /fields/articles/title`

Provide a partial [field object](#the-field-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_fields_item(collection: String!, field: String!, data: update_directus_fields_input!): directus_fields
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateField } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateField(collection_name, field_name, partial_field_object));
```

</template>
</SnippetToggler>

#### Query Parameters

This endpoint doesn't currently support any query parameters.

#### Request Body

`type`\
The new type for the field.

::: warning Changing Type

Types may not be compatible, and/or data might be truncated / corrupted. Please be careful when changing types of an
existing field with content.

:::

`meta`\
Any of the optional meta values in the [field object](#the-field-object).

`schema`\
Any of the optional schema values in the [field object](#the-field-object).

Updating the field name is not supported at this time.

### Response

The [field object](#the-field-object) for the updated field.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /fields/articles/title`

```json
{
	"meta": {
		"note": "Put the title here"
	},
	"schema": {
		"default_value": "Hello World!"
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_fields_item(
		collection: "articles"
		field: "title"
		data: { meta: { note: "Put the title here" }, schema: { default_value: "Hello World!" } }
	) {
		collection
		field
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateField } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateField('articles', 'subject tags', {
		meta: {
			note: 'tags for the article based on subjects addressed',
		},
	})
);
```

</template>
</SnippetToggler>

## Delete a Field

Deletes the given field in the given collection.

::: danger Destructive

Be aware, this will delete the column from the database, including all data in it. This action can't be undone.

:::

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /fields/:collection/:field`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_fields_item(collection: String!, field: String!): delete_field
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteField } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteField(collection_name, field_name));
```

</template>
</SnippetToggler>

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /fields/articles/title`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_fields_item(collection: "articles", field: "title") {
		collection
		field
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteField } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteField('articles', 'featured_quote'));
```

</template>
</SnippetToggler>
