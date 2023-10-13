---
description: REST and GraphQL API documentation on the Branches collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Branches (Versions)

> Branches are part of the Content Versioning feature and serve as a container in which an item can be modified
> independently of its main version.

## The Branch Object

`id` **uuid**\
Primary key of the branch.

`key` **string**\
Key of the branch, used as the value for the `branch` query parameter.

`name` **string**\
Name of the branch.

`collection` **string**\
Name of the collection the branch is created on.

`item` **many-to-one**\
The item the branch is created on.

`date_created` **Date**\
When the branch was created.

`user_created` **many-to-one**\
User that created the branch. Many-to-one to [users](/reference/system/users).

```json
{
	"id": "21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5",
	"key": "my_version",
	"name": "My Version",
	"collection": "my_collection",
	"item": "1",
	"hash": "aaafc0db8fb60e82e634903523e1fa2144c58520",
	"date_created": "2023-08-23T10:38:20.686Z",
	"user_created": "a2dbc923-7c75-4d26-83f4-4674bfa7be81"
}
```

## List Branches

List all existing branches.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /branches`

`SEARCH /branches`

If using SEARCH you can provide a [query object](/reference/query) as the body of your request.

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, readBranches } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readBranches(query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [branch objects](#the-branch-object). If no items are available, data
will be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /branches`

`SEARCH /branches`

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, readBranches } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readBranches({
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Retrieve a Branch

Retrieve an existing branch by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /branches/:id`

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, readBranch } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readBranch(branch_id, query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the requested [branch object](#the-branch-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /branches/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5`

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, readBranch } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readCBranch('dc2ac3f9-2076-4e86-8677-b47643eddacf', {
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Create a Branch

Create a new branch for an item.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /branches`

Provide a [branch object](#the-branch-object) as the body of your request.

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, createBranch } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createBranch(branch_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [branch object](#the-branch-object).

### Response

Returns the [branch object](#the-branch-object) for the created branch.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /branches`

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

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, createBranch } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createBranch({
		key: 'my_version',
		name: 'My Version',
		collection: 'my_collection',
		item: 1,
	})
);
```

</template>
</SnippetToggler>

## Create Multiple Branches

Create multiple new branches.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /branches`

Provide an array of [branch objects](#the-branch-object) as the body of your request.

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, createBranches } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createBranches(branch_object_array));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [branch objects](#the-branch-object).

### Response

Returns an array of [branch objects](#the-branch-object) for the created branches.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /branches`

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

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, createBranches } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createBranches([
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

## Update a Branch

Update an existing branch.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`PATCH /branches/:id`

Provide a partial [branch object](#the-branch-object) as the body of your request.

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, updateBranch } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateBranch(branch_id, partial_branch_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [branch object](#the-branch-object).

### Response

Returns the [branch object](#the-branch-object) for the updated branch.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`PATCH /branches/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5`

```json
{
	"name": "My Updated Version"
}
```

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, updateBranch } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateBranch('21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5', {
		name: 'My Updated Version',
	})
);
```

</template>
</SnippetToggler>

## Update Multiple Branches

Update multiple existing branches.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`PATCH /branches`

```json
{
	"keys": branch_id_array,
	"data": partial_branch_object
}
```

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, updateBranches } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateBranches(branch_id_array, partial_branch_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the branches you'd like to update.

`data` **Required**\
The name property of the [branch object](#the-branch-object).

### Response

Returns the [branch objects](#the-branch-object) for the updated branches.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`PATCH /branches`

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

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, updateBranches } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateBranches(['21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5', '31e1c0c6-b575-47fb-908a-baf81b4e5631'], {
		name: 'My Updated Version',
	})
);
```

</template>
</SnippetToggler>

## Delete a Branch

Delete an existing branch.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`DELETE /branches/:id`

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteBranch } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteBranch(branch_id));
```

</template>
</SnippetToggler>

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`DELETE /branches/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5`

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteBranch } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteBranch('21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5'));
```

</template>
</SnippetToggler>

## Delete Multiple Branches

Delete multiple existing branches.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`DELETE /branches`

Provide an array of branch IDs as the body of your request.

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteBranches } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteBranches(branch_id_array));
```

</template>
</SnippetToggler>

#### Request Body

An array of branch primary keys

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`DELETE /branches`

```json
["21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5", "31e1c0c6-b575-47fb-908a-baf81b4e5631", "5fd4a4be-a3ad-4544-9a27-d62b2c897056"]
```

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteBranches } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	deleteBranches([
		'21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5',
		'31e1c0c6-b575-47fb-908a-baf81b4e5631',
		'5fd4a4be-a3ad-4544-9a27-d62b2c897056',
	])
);
```

</template>
</SnippetToggler>

## Save to a Branch

Save item changes to an existing branch.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /branches/:id/save`

Provide a partial [item object](/reference/items#the-item-object) as the body of your request.

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, saveToBranch } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(saveToBranch(branch_id, partial_item_object));
```

</template>
</SnippetToggler>

### Response

Returns the [item object](/reference/items#the-item-object) of the state after the save.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /branches/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5/save`

```json
{
	"my_field": "Updated value"
}
```

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, saveToBranch } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	saveToBranch('21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5', { my_field: 'Updated value' })
);
```

</template>
</SnippetToggler>

## Compare a Branch

Compare an existing branch with the main version of the item.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /branches/:id/compare`

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, compareBranch } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(compareBranch(branch_id));
```

</template>
</SnippetToggler>

### Response

Returns all fields with different values, along with the hash of the main version of the item and the information
whether the current branch is outdated (main version of the item has been updated since the creation of the branch):

```json
{
	"outdated": false,
	"mainHash": "2ee9c4e33b19d2cdec66a1ff7355e75a331591d9",
	"current": {
		"my_field": "Updated value"
	},
	"main": {
		"my_field": "Main value"
	}
}
```

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /branches/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5/compare`

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, compareBranch } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(compareBranch('21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5'));
```

</template>
</SnippetToggler>

## Promote a Branch

Promote an existing branch as new main version of the item.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /branches/:id/promote`

Pass the current hash of the main version of the item (obtained from the `compare` endpoint) along with an optional
array of field names of which the values are to be promoted.

```json
{
	"mainHash": main_hash,
	"fields": fields_name_array
}
```

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, promoteBranch } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(promoteBranch(branch_id, promote_object));
```

</template>
</SnippetToggler>

### Response

The primary key of the updated item.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /branches/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5/promote`

```json
{
	"mainHash": "2ee9c4e33b19d2cdec66a1ff7355e75a331591d9",
	"fields": ["my_field"]
}
```

</template>
<template #graphql>

TBD

</template>
<template #sdk>

```js
import { createDirectus, rest, promoteBranch } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	promoteBranch('21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5', '2ee9c4e33b19d2cdec66a1ff7355e75a331591d9', [
		'my_field',
	])
);
```

</template>
</SnippetToggler>
