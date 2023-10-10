---
description: REST and GraphQL API documentation on the Versions collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Versions

> TBD

## The Version Object

`id` **uuid**\
Primary key of the version.

`key` **string**\
Key of the version, used as the value for the `version` query parameter.

`name` **string**\
Name of the version.

`collection` **string**\
Name of the collection the version is created on.

`item` **many-to-one**\
The item the version is created on.

`date_created` **Date**\
When the version was created.

`user_created` **many-to-one**\
User that created the version. Many-to-one to [users](/reference/system/users).

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

## List Versions

List all versions that exist in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /versions`

`SEARCH /versions`

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

An array of up to [limit](/reference/query#limit) [version objects](#the-version-object). If no items are available,
data will be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /versions`

`SEARCH /versions`

</template>
<template #graphql>

TBD

</template>
<template #sdk>

TBD

</template>
</SnippetToggler>

## Retrieve a Version

List an existing version by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /versions/:id`

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

Returns the requested [version object](#the-version-object).

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

## Create a Version

Create a new version.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /version`

Provide a [version object](#the-version-object) as the body of your request.

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

A partial [version object](#the-version-object).

### Response

Returns the [version object](#the-version-object) for the created version.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /versions`

```json
{
	"name": "My Version",
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

## Create Multiple Versions

Create multiple new versions.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /versions`

Provide an array of [version objects](#the-version-object) as the body of your request.

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

An array of partial [version objects](#the-version-object).

### Response

Returns an array of [version objects](#the-version-object) for the created versions.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /dashboards`

```json
[
	{
		"name": "My Version",
		"collection": "my-collection",
		"item": "1"
	},
	{
		"name": "Another Version",
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

## Rename a Version

Rename an existing version.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`PATCH /versions/:id`

Provide a partial [version object](#the-version-object) as the body of your request.

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

A partial [version object](#the-version-object).

### Response

Returns the [version object](#the-version-object) for the updated version.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`PATCH /versions/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5`

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

TBD

</template>
</SnippetToggler>

## Rename Multiple Versions

Rename multiple existing versions.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`PATCH /versions`

```json
{
	"keys": version_id_array,
	"data": partial_version_object
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
Array of primary keys of the versions you'd like to update.

`data` **Required**\
The name property of the [version object](#the-version-object).

### Response

Returns the [version objects](#the-version-object) for the updated versions.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
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

TBD

</template>
<template #sdk>

TBD

</template>
</SnippetToggler>

## Delete a Version

Delete an existing version.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`DELETE /versions/:id`

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

`DELETE /versions/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5`

</template>
<template #graphql>

TBD

</template>
<template #sdk>

TBD

</template>
</SnippetToggler>

## Delete Multiple Versions

Delete multiple existing versions.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`DELETE /versions`

Provide an array of version IDs as the body of your request.

</template>
<template #graphql>

TBD

</template>
<template #sdk>

TBD

</template>
</SnippetToggler>

#### Request Body

An array of version primary keys

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`DELETE /versions`

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

## Save to a Version

Save changes to an existing version.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /versions/:id/save`

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

Returns the [item object](/reference/items#the-item-object) of the item state after the save.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /versions/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5/save`

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

## Compare a Version

Compare an existing version with the main item.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /versions/:id/compare`

</template>
<template #graphql>

TBD

</template>
<template #sdk>

TBD

</template>
</SnippetToggler>

### Response

Returns all fields with different values, along with the hash of the main item and the information whether the current
version is outdated (main item has been updated since the creation of the current version):

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

`GET /versions/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5/compare`

</template>
<template #graphql>

TBD

</template>
<template #sdk>

TBD

</template>
</SnippetToggler>

## Promote a Version

Promote an existing version into the main item.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /versions/:id/promote`

Pass the current hash of the main item (usually obtained from the `compare` endpoint) along with an array of field names
of which the values are to be promoted from the current version into the main item.

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

`POST /versions/21a7ed5f-eb19-42ae-8ee2-61f25b8c4eb5/promote`

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
