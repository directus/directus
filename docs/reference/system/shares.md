---
description: REST and GraphQL API documentation on using Shares in Directus
readTime: 5 min read
pageClass: page-reference
---

# Shares

> Shares are a way to publicly share an otherwise private item.

---

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

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

An array of up to [limit](/reference/query#limit) [share objects](#the-share-object). If no items are available, data
will be an empty array.

### REST API

```
GET /shares
SEARCH /shares
```

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	shares: [directus_shares]
}
```

##### Example

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

---

## Retrieve a Share

List an existing share by primary key.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

Returns the requested [share object](#the-share-object).

### REST API

```
GET /shares/:id
```

##### Example

```
GET /shares/b4cb3b64-8580-4ad9-a099-eade6da24302
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	shares_by_id(id: ID!): directus_shares
}
```

##### Example

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

---

## Create a Share

Create a new share.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [share object](#the-share-object).

### Returns

Returns the [share object](#the-share-object) for the created share.

### REST API

```
POST /shares
```

##### Example

```json
// POST /shares

{
	"name": "External Review",
	"collection": "articles",
	"item": "15",
	"max_uses": "5"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	create_shares_item(data: create_directus_shares_input!): directus_shares
}
```

##### Example

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

---

## Create Multiple Shares

Create multiple new shares.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

An array of partial [share objects](#the-share-object).

### Returns

Returns the [share objects](#the-share-object) for the created shares.

### REST API

```
POST /shares
```

##### Example

```json
// POST /shares

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

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	create_shares_items(data: [create_directus_shares_input!]!): [directus_shares]
}
```

##### Example

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

---

## Update a Share

Update an existing share.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [share object](#the-share-object).

### Returns

Returns the [share object](#the-share-object) for the updated share.

### REST API

```
PATCH /shares/:id
```

##### Example

```json
// PATCH /shares/c86c2761-65d3-43c3-897f-6f74ad6a5bd7

{
	"max_uses": "30"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_shares_item(id: ID!, data: update_directus_shares_input): directus_shares
}
```

##### Example

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

---

## Update Multiple Shares

Update multiple existing shares.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

`keys` **Required**\
Array of primary keys of the shares you'd like to update.

`data` **Required**\
Any of [the share object](#the-share-object)'s properties.

### Returns

Returns the [share objects](#the-share-object) for the updated shares.

### REST API

```
PATCH /shares
```

##### Example

```json
// PATCH /shares

{
	"keys": ["c86c2761-65d3-43c3-897f-6f74ad6a5bd7", "6fc3d5d3-a37b-4da8-a2f4-ed62ad5abe03"],
	"data": {
		"date_end": "2023-02-14T17:00:00Z"
	}
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_shares_items(ids: [ID!]!, data: update_directus_shares_input): [directus_shares]
}
```

##### Example

```graphql
mutation {
	update_shares_items(
		ids: ["c86c2761-65d3-43c3-897f-6f74ad6a5bd7", "6fc3d5d3-a37b-4da8-a2f4-ed62ad5abe03"]
		data: { "date_end": "2023-02-14T17:00:00Z" }
	) {
		id
		name
		collection
		item
	}
}
```

---

## Delete a Share

Delete an existing share.

### Returns

Empty body.

### REST API

```
DELETE /shares/:id
```

##### Example

```
DELETE /shares/c86c2761-65d3-43c3-897f-6f74ad6a5bd7
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_shares_item(id: ID!): delete_one
}
```

##### Example

```graphql
mutation {
	delete_shares_item(id: "c86c2761-65d3-43c3-897f-6f74ad6a5bd7") {
		id
	}
}
```

---

## Delete Multiple Shares

Delete multiple existing shares.

### Request Body

An array of share primary keys

### Returns

Empty body.

### REST API

```
DELETE /shares
```

##### Example

```json
// DELETE /shares
["653925a9-970e-487a-bfc0-ab6c96affcdc", "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"]
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_shares_items(ids: [ID!]!): delete_many
}
```

##### Example

```graphql
mutation {
	delete_shares_items(ids: ["653925a9-970e-487a-bfc0-ab6c96affcdc", "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"]) {
		ids
	}
}
```

---

## Authenticate a Share

Shares work by publicly giving you an access/refresh token combination (as you would get with the regular /auth/login
endpoints). These tokens are limited to a permissions set that only allows access to the item that was shared, and any
relationally linked items that that associated role has access to. This means that all regular endpoints can be used
with the credentials set returned by this endpoint.

### Request Body

`share` **Required**\
Primary key of the share you're authenticating against.

`password` **string**\
Password for the share, if one is configured.

### Returns

`access_token` **string**\
Temporary access token to be used in follow-up requests.

`expires` **integer**\
How long before the access token will expire. Value is in milliseconds.

`refresh_token` **string**\
The token that can be used to retrieve a new access token through [`/auth/refresh`](#refresh). Note: if you used `cookie`
as the mode in the request, the refresh token won't be returned in the JSON.

### REST API

```
POST /shares/auth
```

##### Example

```
POST /shares/auth
```

```json
{
	"share": "61e8a1b6-6eba-438c-91e8-8d912ef655d3",
	"password": "d1r3ct5us"
}
```

### GraphQL

```
# Not currently available in GraphQL
```

---

## Send a Share by Email

Sends an email to the provided email addresses with a link to the share.

### Request Body

`share` **Required**\
Primary key of the share you're inviting people to.

`emails` **array**\
Array of email strings to send the share link to.

### Returns

Empty body.

### REST API

```
POST /shares/invite
```

##### Example

```json
// POST /shares/invite
{
	"share": "653925a9-970e-487a-bfc0-ab6c96affcdc",
	"emails": ["allison@example.com", "mike@example.com"]
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
# Not currently available in GraphQL
```

---

## Get Share Public Info

Allows unauthenticated users to retrieve information about the share.

### Returns

The [share objects](#the-share-object) for the given UUID, if it's still valid.

### REST API

```
GET /shares/info/:id
```

##### Example

```json
// GET /shares/info/653925a9-970e-487a-bfc0-ab6c96affcdc
{
	"id": "653925a9-970e-487a-bfc0-ab6c96affcdc",
	"collection": "authors",
	"item": "1",
	"password": "**********",
	"max_uses": 15,
	"times_used": 0,
	"date_start": "2023-01-26T17:00:00.000Z",
	"date_end": "2023-01-28T17:00:00.000Z"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
# Not currently available in GraphQL
```

---
