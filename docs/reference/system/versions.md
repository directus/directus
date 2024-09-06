---
description: REST and GraphQL API documentation on the Versions collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Content Versions

> Content Versioning enables users to create unpublished copies of an item (called "Content Versions"), modify them
> independently from the main version, and promote them to become the new main version when ready.

## The Content Version Object

`id` **uuid**\
Primary key of the Content Version.

`key` **string**\
Key of the Content Version, used as the value for the [`version`](/reference/items#query-parameters-1) query parameter.

`name` **string**\
Descriptive name of the Content Version.

`collection` **string**\
Name of the collection the Content Version is created on.

`item` **many-to-one**\
The item the Content Version is created on.

`date_created` **Date**\
When the Content Version was created.

`date_updated` **Date**\
When the Content Version was last updated.

`user_created` **many-to-one**\
User that created the Content Version. Many-to-one to [users](/reference/system/users).

`user_updated` **many-to-one**\
User that last updated the Content Version. Many-to-one to [users](/reference/system/users).

`delta` **json**\
The current changes compared to the main version of the item.

```json
{
	"id": "21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5",
	"key": "my_version",
	"name": "My Version",
	"collection": "my_collection",
	"item": "1",
	"hash": "aaafc0db8fb60e82e634903523e1fa2144c58520",
	"date_created": "2024-07-22T10:33:02.542Z",
	"date_updated": "2024-07-22T10:33:14.324Z",
	"user_created": "a2dbc923-7c75-4d26-83f4-4674bfa7be81",
	"user_updated": "a2dbc923-7c75-4d26-83f4-4674bfa7be81",
	"delta": {
		"my_field": "Updated Value"
	}
}
```

## List Content Versions

List all Content Versions that exist in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /versions`

`SEARCH /versions`

If using SEARCH you can provide a [query object](/reference/query) as the body of your request.

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	versions: [directus_versions]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readContentVersions } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readContentVersions(query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [Content Version objects](#the-content-version-object). If no items
are available, data will be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /versions`

`SEARCH /versions`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	versions {
		id
		key
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readContentVersions } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readContentVersions({
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Retrieve a Content Version

List an existing Content Version by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /versions/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	versions_by_id(id: ID!): directus_versions
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readContentVersion } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readContentVersion(content_version_id, query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the requested [Content Version object](#the-content-version-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /versions/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	versions_by_id(id: "e35f7b9a-aabe-4a41-92b4-2bed97fd49ef") {
		id
		key
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readContentVersion } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readContentVersion('dc2ac3f9-2076-4e86-8677-b47643eddacf', {
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Create a Content Version

Create a new Content Version for an item.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /versions`

Provide a [Content Version object](#the-content-version-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_versions_item(data: create_directus_versions_input!): directus_versions
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createContentVersion } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createContentVersion(content_version_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [Content Version object](#the-content-version-object).

### Response

Returns the [Content Version object](#the-content-version-object) for the created version.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /versions`

```json
{
	"key": "my_version",
	"name": "My Version",
	"collection": "my_collection",
	"item": "1"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_versions_item(data: { key: "my_version", name: "My Version", collection: "my_collection", item: "1" }) {
		id
		key
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createContentVersion } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createContentVersion({
		key: 'my_version',
		name: 'My Version',
		collection: 'my_collection',
		item: 1,
	})
);
```

</template>
</SnippetToggler>

## Create Multiple Content Versions

Create multiple new Content Versions.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /versions`

Provide an array of [Content Version objects](#the-content-version-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_versions_items(data: [create_directus_versions_input!]!): [directus_versions]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createContentVersions } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createContentVersions(content_version_object_array));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [Content Version objects](#the-content-version-object).

### Response

Returns an array of [Content Version objects](#the-content-version-object) for the created versions.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /versions`

```json
[
	{
		"key": "my_version",
		"name": "My Version",
		"collection": "my_collection",
		"item": 1
	},
	{
		"key": "another_version",
		"name": "Another Version",
		"collection": "another_collection",
		"item": 2
	}
]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_versions_items(
		data: [
			{ key: "my_version", name: "My Version", collection: "my_collection", item: "1" }
			{ key: "another_version", name: "Another Version", collection: "another_collection", item: "2" }
		]
	) {
		id
		key
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createContentVersions } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createContentVersions([
		{
			key: 'my_version',
			name: 'My Version',
			collection: 'my_collection',
			item: 1,
		},
		{
			key: 'another_version',
			name: 'Another Version',
			collection: 'another_collection',
			item: 2,
		},
	])
);
```

</template>
</SnippetToggler>

## Update a Content Version

Update an existing Content Version.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /versions/:id`

Provide a partial [Content Version object](#the-content-version-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_versions_item(id: ID!, data: update_directus_versions_input!): directus_versions
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateContentVersion } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateContentVersion(content_version_id, partial_content_version_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [Content Version object](#the-content-version-object).

### Response

Returns the [Content Version object](#the-content-version-object) for the updated version.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /versions/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5`

```json
{
	"name": "My Updated Version"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_versions_item(id: "21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5", data: { name: "My Updated Version" }) {
		id
		key
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateContentVersion } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateContentVersion('21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5', {
		name: 'My Updated Version',
	})
);
```

</template>
</SnippetToggler>

## Update Multiple Content Versions

Update multiple existing Content Versions.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /versions`

```json
{
	"keys": content_version_id_array,
	"data": partial_content_version_object
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_versions_items(ids: [ID!]!, data: update_directus_versions_input!): [directus_versions]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateContentVersions } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateContentVersions(content_version_id_array, partial_content_version_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the Content Versions you'd like to update.

`data` **Required**\
The name property of the [Content Version object](#the-content-version-object).

### Response

Returns the [Content Version objects](#the-content-version-object) for the updated versions.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /versions`

```json
{
	"keys": ["21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5", "31e1c0c6-b575-47fb-908a-baf81b4e5631"],
	"data": {
		"name": "My Updated Version"
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_versions_items(
		ids: ["21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5", "31e1c0c6-b575-47fb-908a-baf81b4e5631"]
		data: { name: "My Updated Version" }
	) {
		id
		key
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateContentVersions } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateContentVersions(['21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5', '31e1c0c6-b575-47fb-908a-baf81b4e5631'], {
		name: 'My Updated Version',
	})
);
```

</template>
</SnippetToggler>

## Delete a Content Version

Delete an existing Content Version.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /versions/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_versions_item(id: ID!): delete_one
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteContentVersion } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteContentVersion(content_version_id));
```

</template>
</SnippetToggler>

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /versions/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_versions_item(id: "21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5") {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteContentVersion } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteContentVersion('21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5'));
```

</template>
</SnippetToggler>

## Delete Multiple Content Versions

Delete multiple existing Content Versions.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /versions`

Provide an array of Content Version IDs as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_versions_items(ids: [ID!]!): delete_many
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteContentVersions } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteContentVersions(content_version_id_array));
```

</template>
</SnippetToggler>

#### Request Body

An array of Content Version primary keys

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /versions`

```json
["21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5", "31e1c0c6-b575-47fb-908a-baf81b4e5631"]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_versions_items(ids: ["21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5", "31e1c0c6-b575-47fb-908a-baf81b4e5631"]) {
		ids
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteContentVersions } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	deleteContentVersions(['21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5', '31e1c0c6-b575-47fb-908a-baf81b4e5631'])
);
```

</template>
</SnippetToggler>

## Save to a Content Version

Save item changes to an existing Content Version.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /versions/:id/save`

Provide a partial [item object](/reference/items#the-item-object) as the body of your request.

</template>
<template #graphql>

```
// Not supported in GraphQL
```

</template>
<template #sdk>

```js
import { createDirectus, rest, saveToContentVersion } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(saveToContentVersion(content_version_id, partial_item_object));
```

</template>
</SnippetToggler>

### Response

Returns the [item object](/reference/items#the-item-object) with the new state after save.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /versions/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5/save`

```json
{
	"my_field": "Updated Value"
}
```

</template>
<template #graphql>

```
// Not supported in GraphQL
```

</template>
<template #sdk>

```js
import { createDirectus, rest, saveContentVersion } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	saveContentVersion('21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5', { my_field: 'Updated Value' })
);
```

</template>
</SnippetToggler>

## Compare a Content Version

Compare an existing Content Version with the main version of the item.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /versions/:id/compare`

</template>
<template #graphql>

```
// Not supported in GraphQL
```

</template>
<template #sdk>

```js
import { createDirectus, rest, compareContentVersion } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(compareContentVersion(content_version_id));
```

</template>
</SnippetToggler>

### Response

Returns all fields with different values, along with the hash of the main version of the item and the information
whether the Content Version is outdated (i.e. main version of the item has been updated since the creation of the
Content Version):

```json
{
	"outdated": false,
	"mainHash": "2ee9c4e33b19d2cdec66a1ff7355e75a331591d9",
	"current": {
		"my_field": "Updated Value"
	},
	"main": {
		"my_field": "Main Value"
	}
}
```

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /versions/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5/compare`

</template>
<template #graphql>

```
// Not supported in GraphQL
```

</template>
<template #sdk>

```js
import { createDirectus, rest, compareContentVersion } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(compareContentVersion('21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5'));
```

</template>
</SnippetToggler>

## Promote a Content Version

Promote an existing Content Version to become the new main version of the item.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /versions/:id/promote`

Pass the current hash of the main version of the item (obtained from the `compare` endpoint) along with an optional
array of field names of which the values are to be promoted (by default, all fields are selected).

```json
{
	"mainHash": main_hash,
	"fields": fields_name_array
}
```

</template>
<template #graphql>

```
// Not supported in GraphQL
```

</template>
<template #sdk>

```js
import { createDirectus, rest, promoteContentVersion } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(promoteContentVersion(content_version_id, promote_object));
```

</template>
</SnippetToggler>

### Response

The primary key of the promoted item.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /versions/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5/promote`

```json
{
	"mainHash": "2ee9c4e33b19d2cdec66a1ff7355e75a331591d9",
	"fields": ["my_field"]
}
```

</template>
<template #graphql>

```
// Not supported in GraphQL
```

</template>
<template #sdk>

```js
import { createDirectus, rest, promoteContentVersion } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	promoteContentVersion('21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5', '2ee9c4e33b19d2cdec66a1ff7355e75a331591d9', [
		'my_field',
	])
);
```

</template>
</SnippetToggler>
