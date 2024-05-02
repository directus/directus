---
description: REST and GraphQL API documentation on using Shares in Directus
readTime: 5 min read
pageClass: page-reference
---

# Shares

> Shares are a way to publicly share an otherwise private item.

## The Share Object

`id` **uuid**\
Primary key of the share.

`name` **string**\
Custom (optional) name for the share.

`collection` **many-to-one**\
Collection in which the current item is shared. Many-to-one to Collections.

`item` **string**\
Primary key of the item that's shared.

`role` **many-to-one**\
Share of which the share will inherit the permissions.

`password` **hash**\
Optional password that's required to view this shared item.

`user_created` **many-to-one**\
Reference to the user who created this share. Many-to-one to Users.

`date_created` **timestamp**\
When the share was created.

`date_start` **timestamp**\
Optional timestamp that controls from what date/time the shared item can be viewed.

`date_end` **timestamp**\
Optional timestamp that controls until what date/time the shared item can be viewed.

`times_used` **number**\
The number of times the shared item has been viewed.

`max_uses` **number**\
The maximum number of times the shared item can be viewed.

```json
{
	"id": "3a606c3e-9d4d-4556-b7bb-f00860613da3",
	"name": "My Share",
	"collection": "articles",
	"item": "1",
	"role": "2b34fba4-a6cb-49f4-a070-2daee7ac44f0",
	"password": "**********",
	"user_created": "b13072b7-73e9-4904-89e0-34aaf4403766",
	"date_created": "2023-01-25T19:16:49.009Z",
	"date_start": "2023-01-26T17:00:00.000Z",
	"date_end": "2023-01-28T17:00:00.000Z",
	"times_used": 0,
	"max_uses": 15
}
```

## List Shares

List all shares that exist in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /shares`

`SEARCH /shares`

If using SEARCH you can provide a [query object](/reference/query) as the body of your request.

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

</template>
<template #graphql>

POST /graphql/system

```graphql
type Query {
	shares: [directus_shares]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readShares } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readShares(query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [share objects](#the-share-object). If no items are available, data
will be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /shares`

`SEARCH /shares`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	shares {
		id
		name
		collection
		item
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readShares } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readShares({
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Retrieve a Share

List an existing share by primary key.

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /shares/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	shares_by_id(id: ID!): directus_shares
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readShare } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readShare(share_id, query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the requested [share object](#the-share-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /shares/b4cb3b64-8580-4ad9-a099-eade6da24302`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	shares_by_id(id: 2) {
		id
		name
		collection
		item
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readShare } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readShare('2f8c03c3-4988-4869-a1b3-318e0a4b9b9d', {
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Create a Share

Create a new share.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /shares`

Provide a [share object](#the-share-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_shares_item(data: create_directus_shares_input!): directus_shares
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createShare } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createShare(share_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [share object](#the-share-object).

### Response

Returns the [share object](#the-share-object) for the created share.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /shares`

```json
{
	"name": "External Review",
	"collection": "articles",
	"item": "15",
	"max_uses": "5"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_shares_item(data: { name: "External Review", collection: "articles", item: "15", max_uses: "5" }) {
		id
		name
		collection
		item
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createShare } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createShare({
		name: 'External Review',
		collection: 'articles',
		item: '22',
		max_uses: '5',
	})
);
```

</template>
</SnippetToggler>

## Create Multiple Shares

Create multiple new shares.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /shares`

Provide an array of [share objects](#the-share-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_shares_items(data: [create_directus_shares_input!]!): [directus_shares]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createShares } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createShares(share_object_array));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [share objects](#the-share-object).

### Response

Returns the [share objects](#the-share-object) for the created shares.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /shares`

```json
[
	{
		"name": "External Review",
		"collection": "articles",
		"item": "15",
		"max_uses": "5"
	},
	{
		"name": "Early Access",
		"collection": "games",
		"item": "d50ffd6a-3b33-44a4-b3e6-1f0d1bca1254",
		"password": "EARLYACCESS2023"
	}
]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_shares_items(
		data: [
			{ name: "External Review", collection: "articles", item: "15", max_uses: "5" }
			{
				name: "Early Access"
				collection: "games"
				item: "d50ffd6a-3b33-44a4-b3e6-1f0d1bca1254"
				password: "EARLYACCESS2023"
			}
		]
	) {
		id
		name
		collection
		item
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createShares } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createShares([
		{
			name: 'External Review',
			collection: 'articles',
			item: '25',
			max_uses: '5',
		},
		{
			name: 'Early Access',
			collection: 'articles',
			item: '26',
			password: 'EARLYACCESS2023',
		},
	])
);
```

</template>
</SnippetToggler>

## Update a Share

Update an existing share.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /shares/:id`

Provide a partial [share objects](#the-share-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_shares_item(id: ID!, data: update_directus_shares_input): directus_shares
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateShare } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateShare(share_id, partial_share_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [share object](#the-share-object).

### Response

Returns the [share object](#the-share-object) for the updated share.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /shares/c86c2761-65d3-43c3-897f-6f74ad6a5bd7`

```json
{
	"max_uses": "30"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_shares_item(id: "c86c2761-65d3-43c3-897f-6f74ad6a5bd7", data: { icon: "attractions" }) {
		id
		name
		collection
		item
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateShare } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateShare('2f8c03c3-4988-4869-a1b3-318e0a4b9b9d', {
		max_uses: 10,
	})
);
```

</template>
</SnippetToggler>

## Update Multiple Shares

Update multiple existing shares.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /shares`

```json
{
	"keys": share_id_array,
	"data": partial_share_object
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_shares_items(ids: [ID!]!, data: update_directus_shares_input): [directus_shares]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateShares } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateShares(share_id_array, partial_share_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the shares you'd like to update.

`data` **Required**\
Any of [the share object](#the-share-object)'s properties.

### Response

Returns the [share objects](#the-share-object) for the updated shares.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /shares`

```json
{
	"keys": ["c86c2761-65d3-43c3-897f-6f74ad6a5bd7", "6fc3d5d3-a37b-4da8-a2f4-ed62ad5abe03"],
	"data": {
		"date_end": "2023-02-14T17:00:00Z"
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_shares_items(
		ids: ["c86c2761-65d3-43c3-897f-6f74ad6a5bd7", "6fc3d5d3-a37b-4da8-a2f4-ed62ad5abe03"]
		data: { date_end: "2023-02-14T17:00:00Z" }
	) {
		id
		name
		collection
		item
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateShare } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateShares(['2f8c03c3-4988-4869-a1b3-318e0a4b9b9d', '153cdb59-7868-4187-8696-372aa07537f4'], {
		max_uses: 10,
	})
);
```

</template>
</SnippetToggler>

## Delete a Share

Delete an existing share.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /shares/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_shares_item(id: ID!): delete_one
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteShare } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteShare(share_id));
```

</template>
</SnippetToggler>

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /shares/c86c2761-65d3-43c3-897f-6f74ad6a5bd7`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_shares_item(id: "c86c2761-65d3-43c3-897f-6f74ad6a5bd7") {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteShare } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(staticToken()).with(rest());

const result = await client.request(deleteShare('0375bb1d-5cbb-48cf-bfac-476a3440a104'));
```

</template>
</SnippetToggler>

## Delete Multiple Shares

Delete multiple existing shares.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /shares`

Provide an array of share IDs as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_shares_items(ids: [ID!]!): delete_many
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteShares } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteShares(share_id_array));
```

</template>
</SnippetToggler>

#### Request Body

An array of share primary keys

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /shares`

```json
["653925a9-970e-487a-bfc0-ab6c96affcdc", "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_shares_items(ids: ["653925a9-970e-487a-bfc0-ab6c96affcdc", "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"]) {
		ids
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteShares } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	deleteShares(['2f8c03c3-4988-4869-a1b3-318e0a4b9b9d', '153cdb59-7868-4187-8696-372aa07537f4'])
);
```

</template>
</SnippetToggler>

## Authenticate a Share

Authenticate as a share user.

> Shares work by returning a token, as it is the case with the regular login endpoint. These tokens are limited to a
> permissions set that only allows access to the item that was shared, and any relationally linked items that that
> associated role has access to. This means that all regular endpoints can be used with the token returned by this
> endpoint.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /shares/auth`

```json
{
	"share": share_id,
	"password": password
}
```

</template>
<template #graphql>

`// Not currently available in GraphQL`

</template>
<template #sdk>

```js
import { createDirectus, rest, authenticateShare } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(authenticateShare('share_key', 'password'));
```

</template>
</SnippetToggler>

#### Request Body

`share` **Required**\
Primary key of the share you're authenticating against.

`password` **string**\
Password for the share, if one is configured.

`mode`\
Whether to retrieve the refresh token in the JSON response, or in a `httpOnly` cookie. One of `json`, `cookie` or `session`.
Defaults to `json`.

### Response

`access_token` **string**\
Temporary access token to be used in follow-up requests. Note: if you used `session` as the mode in the request, the access
token won't be returned in the JSON.

`expires` **integer**\
How long before the access token will expire. Value is in milliseconds.

`refresh_token` **string**\
The token that can be used to retrieve a new access token through [`/auth/refresh`](#refresh). Note: if you used `cookie`
or `session` as the mode in the request, the refresh token won't be returned in the JSON.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /shares/auth`

```json
{
	"share": "61e8a1b6-6eba-438c-91e8-8d912ef655d3",
	"password": "d1r3ct5us"
}
```

</template>
<template #graphql>

`// Not currently available in GraphQL`

</template>
<template #sdk>

```js
import { createDirectus, rest, authenticateShare } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(authenticateShare('61e8a1b6-6eba-438c-91e8-8d912ef655d3', 'd1r3ct5us'));
```

</template>
</SnippetToggler>

## Send a Share by Email

Sends an email to the provided email addresses with a link to the share.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /shares/invite`

```json
{
	"share": share_key,
	"emails": email_address_array
}
```

</template>
<template #graphql>

`// Not currently available in GraphQL`

</template>
<template #sdk>

```js
import { createDirectus, rest, inviteShare } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(inviteShare(share_id, email_address_array));
```

</template>
</SnippetToggler>

#### Request Body

`share` **Required**\
Primary key of the share you're inviting people to.

`emails` **array**\
Array of email strings to send the share link to.

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /shares/invite`

```json
{
	"share": "653925a9-970e-487a-bfc0-ab6c96affcdc",
	"emails": ["allison@example.com", "mike@example.com"]
}
```

</template>
<template #graphql>

`// Not currently available in GraphQL`

</template>
<template #sdk>

```js
import { createDirectus, rest, inviteShare } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	inviteShare('653925a9-970e-487a-bfc0-ab6c96affcdc', ['allison@example.com', 'mike@example.com'])
);
```

</template>
</SnippetToggler>

## Get Share Public Info

Allows unauthenticated users to retrieve information about the share.

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /shares/info/:id`

</template>
<template #graphql>

`// Not currently available in GraphQL`

</template>
<template #sdk>

```js
import { createDirectus, rest, readShareInfo } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readShareInfo(share_id));
```

</template>
</SnippetToggler>

### Response

The [share objects](#the-share-object) for the given UUID, if it's still valid.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /shares/info/653925a9-970e-487a-bfc0-ab6c96affcdc`

</template>
<template #graphql>

`// Not currently available in GraphQL`

</template>
<template #sdk>

```js
import { createDirectus, rest, readShareInfo } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(readShareInfo('653925a9-970e-487a-bfc0-ab6c96affcdc'));
```

</template>
</SnippetToggler>
