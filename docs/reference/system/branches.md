---
description: REST and GraphQL API documentation on the Branches collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Branches

> TBD

## The Branch Object

`id` **uuid**\
Primary key of the branch.

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
	"name": "My Branch",
	"collection": "my-collection",
	"item": "1",
	"hash": "aaafc0db8fb60e82e634903523e1fa2144c58520",
	"date_created": "2023-08-23T10:38:20.686Z",
	"user_created": "a2dbc923-7c75-4d26-83f4-4674bfa7be81"
}
```

## List Branches

List all branches that exist in Directus.

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

TBD

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

TBD

</template>
</SnippetToggler>

## Retrieve a Branch

List an existing branch by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /branches/:id`

</template>
<template #graphql>

TBD

</template>
<template #sdk>

TBD

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the requested [branch object](#the-branch-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /dashboards/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5`

</template>
<template #graphql>

TBD

</template>
<template #sdk>

TBD

</template>
</SnippetToggler>

## Create a Branch

Create a new branch.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /branch`

Provide a [branch object](#the-branch-object) as the body of your request.

</template>
<template #graphql>

TBD

</template>
<template #sdk>

TBD

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
	"name": "My Branch",
	"collection": "my-collection",
	"item": "1"
}
```

</template>
<template #graphql>

TBD

</template>
<template #sdk>

TBD

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

TBD

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

`POST /dashboards`

```json
[
	{
		"name": "My Branch",
		"collection": "my-collection",
		"item": "1"
	},
	{
		"name": "Another Branch",
		"collection": "another-collection",
		"item": "2"
	}
]
```

</template>
<template #graphql>

TBD

</template>
<template #sdk>

TBD

</template>
</SnippetToggler>

## Rename a Branch

Rename an existing branch.

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

TBD

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
	"name": "My Updated Branch"
}
```

</template>
<template #graphql>

TBD

</template>
<template #sdk>

TBD

</template>
</SnippetToggler>

## Rename Multiple Branches

Rename multiple existing branches.

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

TBD

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
		"name": "My Updated Branch"
	}
}
```

</template>
<template #graphql>

TBD

</template>
<template #sdk>

TBD

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

TBD

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

TBD

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

TBD

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

TBD

</template>
</SnippetToggler>

## Commit to a Branch

Commit changes to an existing branch.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /branches/:id/commit`

Provide a partial [item object](/reference/items#the-item-object) as the body of your request.

</template>
<template #graphql>

TBD

</template>
<template #sdk>

TBD

</template>
</SnippetToggler>

### Response

Returns the [item object](/reference/items#the-item-object) of the item state after the commit.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /branches/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5/commit`

```json
{
	"my_field": "updated value"
}
```

</template>
<template #graphql>

TBD

</template>
<template #sdk>

TBD

</template>
</SnippetToggler>

## Compare a Branch

Compare an existing branch with the main item.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /branches/:id/compare`

</template>
<template #graphql>

TBD

</template>
<template #sdk>

TBD

</template>
</SnippetToggler>

### Response

Returns all fields with different values, along with the hash of the main branch and the information whether the current
branch is outdated (main branch has been updated since the creation of the current branch):

```json
{
    "outdated": false,
    "mainHash": "2ee9c4e33b19d2cdec66a1ff7355e75a331591d9",
    "current": {
      "my_field": "updated value"
    },
    "main": {
      "my_field": "main value"
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

TBD

</template>
</SnippetToggler>

## Merge a Branch

Merge an existing branch into the item's main branch.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /branches/:id/merge`

Pass the current hash of the main branch (usually obtained from the `compare` endpoint) along with an array of field
names of which the values are to be merged from the current branch into the main branch.

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

TBD

</template>
</SnippetToggler>

### Response

The primary key of the updated item.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /branches/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5/merge`

```json
{
	"mainHash": "2ee9c4e33b19d2cdec66a1ff7355e75a331591d9",
	"fields": [
		"my_field"
	]
}
```

</template>
<template #graphql>

TBD

</template>
<template #sdk>

TBD

</template>
</SnippetToggler>
