---
description: REST and GraphQL API documentation on the "Collections" collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Collections

> Collections are the individual collections of items, similar to tables in a database. Changes to collections will
> alter the schema of the database. [Learn more about Collections](/user-guide/overview/glossary#collections).

## The Collection Object

`collection` **string**\
Name of the collection. This matches the table name in the database.

#### Meta

Directus metadata, primarily used in the Data Studio.

`collection` **string**\
Name of the collection. This matches the table name in the database.

`icon` **string**\
Icon displayed in the Data Studio when working with this collection.

`note` **string**\
Short description displayed in the Data Studio.

`display_template` **string**\
How items in this collection should be displayed when viewed relationally in the Data Studio.

`hidden` **boolean**\
Whether or not this collection is hidden in the Data Studio.

`singleton` **boolean**\
Whether or not this collection is treated as a singleton.

`translations` **array**\
How this collection's name is displayed in the different languages in the Data Studio.

`archive_field` **string**\
What field in the collection holds the archived state.

`archive_value` **string**\
What value the archive field should be set to when archiving an item.

`unarchive_value` **string**\
What value the archive field should be set to when unarchiving an item.

`archive_app_filter` **boolean**\
Whether or not the Data Studio should allow the user to view archived items.

`sort_field` **boolean**\
What field holds the sort value on the collection. The Data Studio uses this to allow drag-and-drop manual sorting.

`accountability` **string**\
What data is tracked. One of `all`, `activity`. See [Accountability](/app/data-model#accountability) for more information.

`item_duplication_fields` **array**\
What fields are duplicated during "Save as copy" action of an item in this collection. See [Duplication](/app/data-model#duplication)
for more information.

`group` **string**\
The name of the parent collection. This is used in [grouping/nesting of collections](/app/data-model#sorting-grouping).

`sort` **number**\
What sort order of the collection relative to other collections of the same level. This is used in [sorting of collections](/app/data-model#sorting-grouping).

`collapse` **string**\
What is the default behavior of this collection or "folder" collection when it has nested collections. One of `open`, `closed`,
`locked`.

`versioning` **boolean**\
Whether or not Content Versioning is enabled for this collection.

#### Schema

"Raw" database information. Based on the database vendor used, different information might be returned. The following
are available for all drivers.

`name` **string**\
The table name.

`comment` **string**\
The table comment.

#### Fields

This holds an array of initial fields used for the collection. You can use the same model as used in
[Fields](/reference/system/fields) to submit fields here. You can use this to set a custom primary key type as well. If
a primary key field is omitted, the request will auto-generate an auto-incremented primary key field named `id`.

::: tip

["folder" collections do not hold any data](/app/data-model#sorting-grouping), hence their schema would be `null`.

:::

```json
{
	"collection": "articles",
	"meta": {
		"collection": "articles",
		"icon": "article",
		"note": "Blog posts",
		"display_template": "{{ title }}",
		"hidden": false,
		"singleton": false,
		"translations": [
			{
				"language": "en-US",
				"translation": "Articles"
			},
			{
				"language": "nl-NL",
				"translation": "Artikelen"
			}
		],
		"archive_field": "status",
		"archive_value": "archived",
		"unarchive_value": "draft",
		"archive_app_filter": true,
		"sort_field": "sort",
		"item_duplication_fields": null,
		"sort": 1
	},
	"schema": {
		"name": "pages",
		"comment": null
	},
	"fields": [
		{
			"field": "title",
			"type": "string",
			"meta": {
				"icon": "title"
			},
			"schema": {
				"is_primary_key": true,
				"is_nullable": false
			}
		}
	]
}
```

## List Collections

List the available collections.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /collections`

`SEARCH /collections`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	collections: [directus_collections]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readCollections } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readCollections());
```

</template>
</SnippetToggler>

#### Query Parameters

This endpoint doesn't currently support any query parameters.

### Response

An array of [collection objects](#the-collection-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /collections`

`SEARCH /collections`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	collections {
		# ...
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readCollections } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(readCollections());
```

</template>
</SnippetToggler>

## Retrieve a Collection

Retrieve a single collection by table name.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /collections/:collection`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	collections_by_name(name: String!): directus_collections
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readCollection } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readCollection(collection_name));
```

</template>
</SnippetToggler>

#### Query Parameters

This endpoint doesn't currently support any query parameters.

### Response

A [collection object](#the-collection-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /collections/articles`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	collections_by_name(name: "articles") {
		# ...
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readCollection } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(readCollection('articles'));
```

</template>
</SnippetToggler>

## Create a Collection

Create a new Collection. This will create a new table in the database as well.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /collections`

Provide a [collection object](#the-collection-object) as the body of your request with a `collection` name property
being a required field.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_collections_item(data: directus_collections): directus_collections
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createCollection } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(
	createCollection(collection_object)
);
```

</template>
</SnippetToggler>

#### Query Parameters

This endpoint doesn't currently support any query parameters.

#### Request Body

The `collection` and `schema` properties are required. To create a [collection folder](/app/data-model#sorting-grouping)
that doesn't have an underlying table, you can set `schema` to `null`.

You are able to provide an array of `fields` to be created during the creation of the collection. See the
[fields object](/reference/system/fields#the-fields-object) for more information on what properties are available in a
field.

### Returns

The [collection object](#the-collection-object) for the collection created in this request.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /collections`

```json
{
	"collection": "testimonials",
	"meta": {
		"icon": "format_quote"
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_collections_item(data: { collection: "testimonials", meta: { icon: "format_quote" } }) {
		# ...
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createCollection } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createCollection({
		collection: 'testimonials',
		meta: {
			note: 'Some quotes from our readers',
		},
	})
);
```

</template>
</SnippetToggler>

## Update a Collection

Update the metadata for an existing collection.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /collections/:collection`

Provide a partial [collection object](#the-collection-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_collections_item(collection: String!, data: update_directus_collections_input!): directus_collections
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateCollection } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateCollection(collection_name, partial_collection_object));
```

</template>
</SnippetToggler>

#### Query Parameters

This endpoint doesn't currently support any query parameters.

#### Request Body

You can only update the `meta` values of the [collection object](#the-collection-object). Updating the collection name
is not supported at this time.

### Response

The [collection object](#the-collection-object) for the updated collection in this request.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /collections/testimonials`

```json
{
	"meta": {
		"note": "Short quotes from happy customers."
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_collections_item(collection: "testimonials", data: { meta: { note: "Short quotes from happy customers." } }) {
		collection
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateCollection } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateCollection('testimonials', {
		meta: {
			note: 'Will be removing these at the end of first quarter',
		},
	})
);
```

</template>
</SnippetToggler>

## Delete a Collection

Delete a collection.

::: danger Destructive

Be aware, this will delete the table from the database, including all items in it. This action can't be undone.

:::

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /collections/:collection`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_collections_item(collection: String!): delete_collection
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteCollection } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteCollection(collection_name));
```

</template>
</SnippetToggler>

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /collections/articles`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_collections_item(collection: "articles") {
		collection
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteCollection } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteCollection('testimonials'));
```

</template>
</SnippetToggler>
