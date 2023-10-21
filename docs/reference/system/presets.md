---
description: REST and GraphQL API documentation on the Presets collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Preset

> Presets hold the preferences of individual users of the platform. This allows Directus to show and maintain custom
> item listings and bookmarks for users of the app. [Learn more about Presets](/user-guide/overview/glossary#presets).

## The Preset Object

`id` **uuid**\
Primary key of the preset.

`bookmark` **string**\
The title of the bookmark. If this value is `null`, it's considered a preset instead of a bookmark.

`user` **many-to-one**\
User this preset applies to. Many-to-one to [users](/reference/system/users).

`role` **many-to-one**\
Role this preset applies to. Many-to-one to [users](/reference/system/users).

`collection` **string**\
Collection this preset applies to.

`search` **string**\
The search query used in the preset.

`filters` **array**\
The filters used in the preset.

`layout` **string**\
The layout used in this preset.

`layout_query` **object**\
The item query used by the layout. This structure is based on the used layout.

`layout_options` **object**\
The options used by the layout. This structure is based on the used layout.

```json
{
	"id": 39,
	"bookmark": null,
	"user": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
	"role": null,
	"collection": "directus_activity",
	"search": null,
	"filters": [],
	"layout": "tabular",
	"layout_query": {
		"tabular": {
			"sort": "-timestamp",
			"fields": ["action", "collection", "timestamp", "user"],
			"page": 1
		}
	},
	"layout_options": {
		"tabular": {
			"widths": {
				"action": 100,
				"collection": 210,
				"timestamp": 240,
				"user": 240
			}
		}
	}
}
```

## List Presets

List all presets that exist in Directus.

::: tip Permissions

The data returned in this endpoint will be filtered based on the user's permissions. For example, presets for a role
other than the current user's role won't be returned.

:::

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /presets`

`SEARCH /presets`

If using SEARCH you can provide a [query object](/reference/query) as the body of your request.

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	presets: [directus_presets]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readPresets } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readPresets(object_field));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [preset objects](#the-preset-object). If no items are available, data
will be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /presets`

`SEARCH /presets`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	presets {
		id
		user
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readPresets } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readPresets({
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Retrieve a preset

List an existing preset by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

GET /presets/:id

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	presets_by_id(id: ID!): directus_presets
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readPreset } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readPreset(preset_id, query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the requested [preset object](#the-preset-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /presets/42`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	presets_by_id(id: 42) {
		id
		user
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readPreset } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readPreset('27', {
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Create a Preset

Create a new preset.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /presets`

Provide a [preset object](#the-preset-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_presets_item(data: create_directus_presets_input!): directus_presets
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createPreset } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createPreset(presets_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [preset object](#the-preset-object).

### Response

Returns the [preset object](#the-preset-object) for the created preset.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /presets`

```json
{
	"user": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
	"layout": "cards",
	"search": "Directus"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_presets_item(data: { user: "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca", layout: "cards", search: "Directus" }) {
		id
		user
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createPreset } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createPreset({
		collection: 'articles',
		layout: 'kanban',
	})
);
```

</template>
</SnippetToggler>

## Create Multiple Presets

Create multiple new presets.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /presets`

Provide an array of [presets objects](#the-presets-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_presets_items(data: [create_directus_presets_input!]!): [directus_presets]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createPresets } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createPresets(presets_object_array));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [preset objects](#the-preset-object).

### Response

Returns the [preset object](#the-preset-object) for the created preset.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /presets`

```json
[
	{
		"collection": "directus_files",
		"user": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
		"layout": "cards",
		"search": "Directus"
	},
	{
		"collection": "articles",
		"user": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
		"layout": "tabular"
	}
]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_presets_items(
		data: [
			{
				collection: "directus_files"
				user: "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca"
				layout: "cards"
				search: "Directus"
			}
			{ collection: "articles", user: "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca", layout: "tabular" }
		]
	) {
		id
		user
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createPresets } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createPresets([
		{
			collection: 'articles',
			layout: 'kanban',
		},
		{
			collection: 'authors',
			layout: 'tabular',
		},
	])
);
```

</template>
</SnippetToggler>

## Update a Preset

Update an existing preset.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /presets/:id`

Provide a partial [preset object](#the-preset-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_presets_item(id: ID!, data: update_directus_presets_input): directus_presets
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updatePresets } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updatePreset(preset_id, partial_preset_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [preset object](#the-preset-object).

### Response

Returns the [preset object](#the-preset-object) for the updated preset.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /presets/34`

```json
{
	"layout": "tabular"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_presets_item(id: 32, data: { layout: "tabular" }) {
		id
		user
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updatePreset } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updatePreset('24', {
		layout: 'tabular',
	})
);
```

</template>
</SnippetToggler>

## Update Multiple Presets

Update multiple existing presets.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /presets`

```json
{
	"keys": preset_id_array,
	"data": partial_preset_object
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_presets_items(ids: [ID!]!, data: update_directus_presets_input): [directus_presets]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updatePresets } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updatePresets(preset_id_array, partial_preset_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the presets you'd like to update.

`data` **Required**\
Any of [the preset object](#the-preset-object)'s properties.

### Response

Returns the [preset objects](#the-preset-object) for the updated presets.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /presets`

```json
{
	"keys": [15, 64],
	"data": {
		"layout": "tabular"
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_presets_items(ids: [15, 64], data: { layout: "tabular" }) {
		id
		user
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updatePresets } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updatePresets(['24', '34'], {
		layout: 'tabular',
	})
);
```

</template>
</SnippetToggler>

## Delete a Preset

Delete an existing preset.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /presets/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_presets_item(id: ID!): delete_one
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deletePreset } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deletePreset(preset_id));
```

</template>
</SnippetToggler>

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /presets/34`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_presets_item(id: 32) {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deletePreset } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deletePreset('24'));
```

</template>
</SnippetToggler>

## Delete Multiple Presets

Delete multiple existing presets.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /presets`

Provide an array of preset IDs as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_presets_items(ids: [ID!]!): delete_many
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deletePresets } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deletePreset(preset_id_array));
```

</template>
</SnippetToggler>

#### Request Body

An array of preset primary keys

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /presets`

```json
[15, 251, 810]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_presets_items(ids: [15, 251, 810]) {
		ids
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deletePresets } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deletePresets(['24', '48']));
```

</template>
</SnippetToggler>
