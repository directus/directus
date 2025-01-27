---
description: REST and GraphQL API documentation to access and manage Items in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Accessing Items

> Items are individual pieces of data in your database. They can be anything, from articles, to IoT status checks.
> [Learn more about Items](/user-guide/overview/glossary#items).

## The Item Object

Items don't have a predefined schema. The format depends completely on how you configured your collections and fields in
Directus. For the sake of documentation, we'll use a fictional articles collection with the following fields: `id`,
`status`, `title`, `body`, `featured_image`, and `author`.

::: tip Relational Data

By default, the item object doesn't contain nested relational data. To retrieve nested data, see
[Relational Data](/reference/introduction#relational-data) and [Field Parameters](/reference/query#fields).

:::

```json
{
	"id": 1,
	"status": "published",
	"title": "Hello, world!",
	"body": "This is my first article",
	"featured_image": "768eabec-3c54-4110-a6bb-64b548116661",
	"author": "0bc7b36a-9ba9-4ce0-83f0-0a526f354e07"
}
```

## Get Items

List all items that exist in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /items/:collection`

`SEARCH /items/:collection`

If using SEARCH you can provide a [query object](/reference/query) as the body of your request.

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

</template>
<template #graphql>

`POST /graphql`

```graphql
type Query {
	<collection>: [<collection>]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readItems('collection_name', query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

::: tip Relational Data

The [Field Parameter](/reference/query#fields) is required to return nested relational data.

:::

### Response

An array of up to [limit](/reference/query#limit) [item objects](#the-item-object). If no items are available, data will
be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /items/articles`

`SEARCH /items/articles`

</template>
<template #graphql>

`POST /graphql`

```graphql
query {
	articles {
		id
		title
		author {
			first_name
		}
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readItems('posts', {
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Get Item by ID

Get an item that exists in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /items/:collection/:id`

</template>
<template #graphql>

`POST /graphql`

```graphql
type Query {
	<collection>_by_id(id: ID!, version: String): <collection>
}

type Query {
	<collection>_by_version(id: ID!, version: String!): <collection_version_raw>
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readItem } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readItem(collection_name, item_id, query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

Additionally, supports a `version` parameter to retrieve an item's state from a specific
[Content Version](/reference/system/versions). The value corresponds to the `key` of the Content Version.

### Response

Returns an [item object](#the-item-object) if a valid primary key was provided.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /items/articles/15`

</template>
<template #graphql>

`POST /graphql`

```graphql
query {
	articles_by_id(id: 15) {
		id
		title
		body
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readItem } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(readItem('articles', '15'));
```

</template>
</SnippetToggler>

For a specific Content Version:

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```http
GET /items/articles/15
	?version=draft
```

</template>
<template #graphql>

`POST /graphql`

```graphql
query {
	articles_by_version(id: 15, version: "draft") {
		id
		title
		body
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readItem } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(readItem('articles', '1', { version: 'draft' }));
```

</template>
</SnippetToggler>

## Get Singleton

List a singleton item in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /items/:collection`

</template>
<template #graphql>

`POST /graphql`

```graphql
type Query {
	<collection>(version: String): <collection>
}

type Query {
	<collection>_by_version(version: String!): <collection_version_raw>
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readSingleton } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readSingleton(collection_name));
```

</template>
</SnippetToggler>

::: tip Info

The REST and GraphQL requests for singletons are the same as those used to [Get Items](#get-items) but in contrast the
response consists of a plain [item object](#the-item-object) (the singleton) instead of an array of items.

:::

#### Query Parameters

Supports all [global query parameters](/reference/query).

Additionally, supports a `version` parameter to retrieve a singleton's state from a specific
[Content Version](/reference/system/versions). The value corresponds to the `key` of the Content Version.

#### Request Body

`collection_name` the name of the collection is required.

### Response

Returns an [item object](#the-item-object) if a valid collection name was provided.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /items/about`

</template>
<template #graphql>

`POST /graphql`

```graphql
query {
	about {
		id
		content
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readSingleton } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(readSingleton('about'));
```

</template>
</SnippetToggler>

For a specific Content Version:

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

```http
GET /items/about
	?version=draft
```

</template>
<template #graphql>

`POST /graphql`

```graphql
query {
	about_by_version(version: "draft") {
		id
		content
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readSingleton } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(readSingleton('about', { version: 'draft' }));
```

</template>
</SnippetToggler>

## Create an Item

Create a new item in the given collection.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /items/:collection`

Provide an [item object](#the-item-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql`

```graphql
type Mutation {
	create_<collection>_item(data: create_<collection>_input): <collection>
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createItem } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createItem(collection_name, item_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [item objects](#the-item-object).

::: tip Relational Data

Relational data needs to be correctly nested to add new items successfully. Check out the
[relational data section](/reference/introduction#relational-data) for more information.

:::

### Response

Returns the [item objects](#the-item-object) of the item that were created.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /items/articles`

```json
{
	"title": "Hello world!",
	"body": "This is our first article"
}
```

</template>
<template #graphql>

`POST /graphql`

```graphql
mutation {
	create_articles_item(data: { title: "Hello world!", body: "This is our first article" }) {
		id
		title
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createItem } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createItem('articles', {
		title: 'What is Directus?',
		content: 'Directus is an Open Data Platform built to democratize the database.',
	})
);
```

</template>
</SnippetToggler>

## Create Multiple Items

Create new items in the given collection.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /items/:collection`

Provide an array of [item object](#the-item-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql`

```graphql
type Mutation {
	create_<collection>_items(data: [create_<collection>_input]): [<collection>]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createItems } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createItems(collection_name, item_object_array));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [item objects](#the-item-object).

### Response

Returns the [item objects](#the-item-object) of the item that were created.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /items/articles`

```json
[
	{
		"title": "Hello world!",
		"body": "This is our first article"
	},
	{
		"title": "Hello again, world!",
		"body": "This is our second article"
	}
]
```

</template>
<template #graphql>

`POST /graphql`

```graphql
mutation {
	create_articles_items(
		data: [
			{ title: "Hello world!", body: "This is our first article" }
			{ title: "Hello again, world!", body: "This is our second article" }
		]
	) {
		id
		title
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createItems } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createItems('articles', [
		{
			title: 'What is Directus?',
			content: 'Directus is an Open Data Platform built to democratize the database.',
		},
		{
			title: 'Build your internal tools with Directus',
			content: 'Flows enable custom, event-driven data processing and task automation within Directus.',
		},
	])
);
```

</template>
</SnippetToggler>

## Update an Item

Update an existing item.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /items/:collection/:id`

Provide a partial [item object](#the-item-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql`

```graphql
type Mutation {
	update_<collection>_item(id: ID!, data: update_<collection>_input!): <collection>
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateItem } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateItem(collection_name, item_id, partial_item_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [item object](#the-item-object).

### Response

Returns the [item object](#the-item-object) of the item that was updated.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /items/articles/15`

```json
{
	"title": "An updated title"
}
```

</template>
<template #graphql>

`POST /graphql`

```graphql
mutation {
	update_articles_item(id: 15, data: { title: "An updated title" }) {
		id
		title
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateItem } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateItem('articles', '5', {
		title: 'What is Directus and how it can help you build your next app!?',
	})
);
```

</template>
</SnippetToggler>

## Update Singleton

Update a singleton item.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /items/:collection`

Provide a partial [item object](#the-item-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql`

```graphql
type Mutation {
	update_<collection>_items(data: [update_<collection>_input]): [<collection>]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateSingleton } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateSingleton(collection_name, partial_item_object));
```

</template>
</SnippetToggler>

::: tip Info

The REST and GraphQL requests for singletons are the same as those used to
[Update Multiple Items](#update-multiple-items) but in contrast the request should consist of the plain
[item object](#the-item-object).

:::

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

The name of the collection `collection_name` is required and a partial [item object](#the-item-object).

### Response

Returns the [item object](#the-item-object) of the singleton that was updated.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /items/about`

```json
{
	"content": "Founded in 2023, this website is dedicated to..."
}
```

</template>
<template #graphql>

`POST /graphql`

```graphql
mutation {
	update_articles_items(data: { content: "Founded in 2023, this website is dedicated to..." }) {
		content
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateSingleton } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateSingleton('about', {
		content: 'Founded in 2023, this website is dedicated to...',
	})
);
```

</template>
</SnippetToggler>

## Update Multiple Items

Update multiple items at the same time.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /items/:collection`

Provide a partial [item object](#the-item-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql`

```graphql
type Mutation {
	update_<collection>_items(ids: [ID!]!, data: [update_<collection>_input]): [<collection>]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateItems } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateItems(collection_name, item_id_array, partial_item_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

Object containing `data` for the values to set, and either `keys` or `query` to select what items to update.

### Response

Returns the [item objects](#the-item-object) for the updated items.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /items/articles`

```json
{
	"keys": [1, 2],
	"data": {
		"status": "published"
	}
}
```

</template>
<template #graphql>

`POST /graphql`

```graphql
mutation {
	update_articles_items(ids: [1, 2], data: { status: "published" }) {
		id
		status
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateItems } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateItems('articles', ['5', '6'], {
		status: 'published',
	})
);
```

</template>
</SnippetToggler>

## Delete an Item

Delete an existing item.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /items/:collection/:id`

</template>
<template #graphql>

`POST /graphql`

```graphql
type Mutation {
	delete_<collection>_item(id: ID!): delete_one
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteItem } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteItem(collection_name, item_id));
```

</template>
</SnippetToggler>

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /items/articles/15`

</template>
<template #graphql>

`POST /graphql`

```graphql
mutation {
	delete_articles_item(id: 15) {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteItem } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteItem('articles', '5'));
```

</template>
</SnippetToggler>

## Delete Multiple Items

Delete multiple existing items.

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /items/:collection`

Provide an array of item primary keys or an object containing either `keys` or `query` as your request body.

</template>
<template #graphql>

`POST /graphql`

```graphql
type Mutation {
	delete_<collection>_items(ids: [ID!]!): delete_many
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteItems } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteItems(collection_name, item_id_array));

//or

const result = await client.request(deleteItems(collection_name, query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of item primary keys or an object containing either `keys` or `query` to select what items to update.

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /items/articles`

```json
// Array of primary keys
[15, 16, 21]
```

```json
// Object containing keys
{
	"keys": [15, 16, 21]
}
```

```json
// Object containing query
{
	"query": {
		"filter": {
			"status": {
				"_eq": "draft"
			}
		}
	}
}
```

</template>
<template #graphql>

`POST /graphql`

```graphql
mutation {
	delete_articles_items(ids: [15, 16, 21]) {
		ids
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteItems } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteItems('articles', ['6', '7']));

//or

const result = await client.request(
	deleteItems('articles', {
		filter: {
			status: {
				_eq: 'draft',
			},
		},
	})
);
```

</template>
</SnippetToggler>
