---
description: REST and GraphQL API documentation on the Webhooks collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Webhooks

> Webhooks are configured within the App (no code required) and send HTTP requests to an external service when a
> specific event is triggered.

::: warning

Webhooks are a deprecated feature and will be removed from the platform. This functionality has been fully replaced by
[Flows](/app/flows).

:::

## The Webhook Object

`id` **integer**\
Primary key of the webhook.

`name` **string**\
Name for the webhook. Shown in the Data Studio.

`method` **string**\
HTTP method to use. One of `GET`, `POST`.

`url` **string**\
Where to send the request too.

`status` **string**\
Status of the webhook. One of `active`, `inactive`.

`data` **boolean**\
Whether or not to send the event data to the external endpoint.

`actions` **csv**\
When to fire the webhook. Can contain `create`, `update`, `delete`.

`collections` **csv**\
What collections to fire this webhook on.

```json
{
	"data": {
		"id": 1,
		"name": "Build Website",
		"method": "POST",
		"url": "https://example.com/",
		"status": "active",
		"data": true,
		"actions": ["create", "update"],
		"collections": ["articles"]
	}
}
```

## List Webhooks

List all webhooks that exist in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /webhooks`

`SEARCH /webhooks`

If using SEARCH you can provide a [query object](/reference/query) as the body of your request.

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	webhooks: [directus_webhooks]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readWebhooks } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readWebhooks(query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [webhook objects](#the-webhook-object). If no items are available,
data will be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /webhooks`

`SEARCH /webhooks`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	webhooks {
		url
		method
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readWebhooks } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readWebhooks({
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Retrieve a Webhook

List an existing webhook by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /webhooks/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	webhooks_by_id(id: ID!): directus_webhooks
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readWebhook } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readWebhook(webhook_id, query_object));
```

</template>
</SnippetToggler>

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

Returns the requested [webhook object](#the-webhook-object).

### Examples

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /webhooks/15`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	webhooks_by_id(id: 15) {
		url
		actions
		method
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readWebhook } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readWebhook('2', {
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Create a Webhook

Create a new webhook.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /webhooks`

Provide a [webhook object](#the-webhook-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_webhooks_item(data: create_directus_webhooks_input!): directus_webhooks
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createWebhook } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createWebhook(webhook_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [webhook object](#the-webhook-object).

`name`, `actions`, `collections`, and `url` are required.

### Response

Returns the [webhook object](#the-webhook-object) for the created webhook.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /webhooks`

```json
{
	"name": "Example",
	"actions": ["create", "update"],
	"collections": ["articles"],
	"url": "https://example.com"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_webhooks_item(
		data: { name: "Example", actions: ["create", "update"], collections: ["articles"], url: "https://example.com" }
	) {
		id
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createWebhook } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createWebhook({
		name: 'Articles Activity',
		method: 'POST',
		collections: 'articles',
		actions: ['create', 'update', 'delete'],
		url: 'https://directus.example.com/articles_activity',
	})
);
```

</template>
</SnippetToggler>

## Create Multiple Webhook

Create multiple new webhooks.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /webhooks`

Provide an array of [webhook objects](#the-webhook-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_webhooks_items(data: [create_directus_webhooks_input!]!): [directus_webhooks]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createWebhooks } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createWebhooks(webhook_object_array));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [webhook object](#the-webhook-object).

`name`, `actions`, `collections`, and `url` are required.

### Response

Returns the [webhook objects](#the-webhook-object) for the created webhooks.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /webhooks`

```json
[
	{
		"name": "Example",
		"actions": ["create", "update"],
		"collections": ["articles"],
		"url": "https://example.com"
	},
	{
		"name": "Second Example",
		"actions": ["delete"],
		"collections": ["articles"],
		"url": "https://example.com/on-delete"
	}
]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_webhooks_items(
		data: [
			{ name: "Example", actions: ["create", "update"], collections: ["articles"], url: "https://example.com" }
			{ name: "Second Example", actions: ["delete"], collections: ["articles"], url: "https://example.com/on-delete" }
		]
	) {
		id
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createWebhooks } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createWebhooks([
		{
			name: 'Articles Activity',
			method: 'POST',
			collections: 'articles',
			actions: ['create', 'update', 'delete'],
			url: 'https://directus.example.com/articles_activity',
		},
		{
			name: 'Author Changes',
			method: 'POST',
			collections: 'authors',
			actions: ['update'],
			url: 'https://directus.example.com/authors_changes',
		},
	])
);
```

</template>
</SnippetToggler>

## Update a Webhook

Update an existing webhook.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /webhooks/:id`

Provide a partial [webhook object](#the-webhook-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_webhooks_item(id: ID!, data: update_directus_webhooks_input!): directus_webhooks
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateWebhook } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateWebhook(webhook_id, partal_webhook_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [webhook object](#the-webhook-object).

### Response

Returns the [webhook object](#the-webhook-object) for the updated webhook.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /webhooks/15`

```json
{
	"name": "Build Website"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_webhooks_item(id: 15, data: { name: "Build Website" }) {
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateWebhook } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateWebhook('6', {
		actions: ['update', 'delete'],
	})
);
```

</template>
</SnippetToggler>

## Update Multiple Webhooks

Update multiple existing webhooks.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /webhooks`

```json
{
	"keys": webhook_id_array,
	"data": partial_webhook_object
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_webhooks_items(ids: [ID!]!, data: update_directus_webhooks_input!): [directus_webhooks]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateWebhooks } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateWebhooks(webhook_id_array, partial_webhook_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the webhooks you'd like to update.

`data` **Required**\
Any of [the webhook object](#the-webhook-object)'s properties.

### Response

Returns the [webhook objects](#the-webhook-object) for the updated webhooks.

### REST API

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /webhooks`

```json
{
	"keys": [15, 41],
	"data": {
		"name": "Build Website"
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_webhooks_items(ids: [15, 41], data: { name: "Build Website" }) {
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateWebhooks } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateWebhooks(['5', '6'], {
		status: 'inactive',
	})
);
```

</template>
</SnippetToggler>

## Delete a Webhook

Delete an existing webhook.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /webhooks/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_webhooks_item(id: ID!): delete_one
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteWebhook } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteWebhook(webhook_id));
```

</template>
</SnippetToggler>

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /webhooks/15`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_webhooks_item(id: 15) {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteWebhook } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteWebhook('1'));
```

</template>
</SnippetToggler>

## Delete Multiple Webhooks

Delete multiple existing webhooks.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /webhooks`

Provide an array of webhook IDs as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_webhooks_items(ids: [ID!]!): delete_many
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteWebhooks } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteWebhooks(webhook_id_array));
```

</template>
</SnippetToggler>

#### Request Body

An array of webhook primary keys

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /webhooks`

```json
[2, 15, 41]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_webhooks_items(ids: [2, 15, 41]) {
		ids
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteWebhooks } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteWebhooks(['2', '3']));
```

</template>
</SnippetToggler>
