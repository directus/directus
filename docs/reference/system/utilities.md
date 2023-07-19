---
description: REST and GraphQL API documentation on the Utilities collection in Directus.
readTime: 3 min read
pageClass: page-reference
---

# Utilities

> Utilities are the various helper endpoints located within the API.

## Generate a Hash

Generate a hash for a given string.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /utils/hash/generate`

```json

{
	"string": "hash"
}
```

</template>

<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	utils_hash_generate(string: String!): String
}
```

</template>
</SnippetToggler>

#### Request Body

`string` **Required**\
String to hash.

### Response

Hashed string.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /utils/hash/generate`

```json
{
	"string": "Hello World!"
}
```

</template>

<template #graphql>

```graphql
mutation {
	utils_hash_generate(string: "Hello World!")
}
```

</template>
</SnippetToggler>

## Verify a Hash

Verify a string with a hash.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /utils/hash/verify`

```json
{
	"string": "test_string",
	"hash": "hash"
}
```

</template>

<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	utils_hash_verify(hash: String!, string: String!): Boolean
}
```

</template>
</SnippetToggler>

#### Request Body

`string` **Required**\
Source string.

`hash` **Required**\
Hash you want to verify against.

### Response

Boolean.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /utils/hash/verify`

```json
{
	"string": "Hello World!",
	"hash": "$arg...fEfM"
}
```

</template>

<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	utils_hash_verify(hash: "$arg...fEfM", string: "Hello World!")
}
```

</template>
</SnippetToggler>

## Manually Sort Items in Collection

If a collection has a sort field, this util can be used to move items in that manual order.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /utils/sort/articles`

```json
{
	"item": item_to_move,
	"to": item_moving_to
}
```

</template>

<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	utils_sort(collection: String!, item: ID!, to: ID!): Boolean
}
```

</template>
</SnippetToggler>

### Request Body

`item` **Required**\
Primary key of the item you're moving in the collection.

`to` **Required**\
Primary key of the item you're moving the source item too.

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /utils/sort/articles`

```json
{
	"item": 16,
	"to": 51
}
```

</template>

<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	utils_sort(collection: "articles", item: 16, to: 51)
}
```

</template>
</SnippetToggler>

## Import Data from File

Import multiple records from a JSON or CSV file into a collection. Relies on a `multipart/form-data` encoded request,
just like regular file uploads. Check [Upload a File](/reference/files#upload-a-file) for more information.

The import endpoint expects the file structure to match [the export query parameter](/reference/query#export). For JSON,
this is an array of objects, where every object is an item. For CSV, the first line has to be the columns header.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /utils/import/:collection`

```
Content-Type: multipart/form-data; charset=utf-8; boundary=__X_BOUNDARY__
Content-Length: //CONTENT LENGTH

--__X_BOUNDARY__
Content-Disposition: form-data; name="file"; filename="filename"
Content-Type: MIME Content Type

//CONTENT

...
```

</template>

<template #graphql>

`// Not currently available in GraphQL` </template> </SnippetToggler>

#### Request Body

Send the file in a `multipart/form-data` request. See [Upload a File](/reference/files#upload-a-file) for more
information.

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /utils/import/articles`

```
Content-Type: multipart/form-data; charset=utf-8; boundary=__X_BOUNDARY__
Content-Length: 3442422

--__X_BOUNDARY__
Content-Disposition: form-data; name="file"; filename="articles.csv"
Content-Type: text/csv

"id","title","another","created_by"
1,"My First Articled","abc","506385A2-E444-4AE2-A860-F00957A62C8A"
2,"My Second Article","abc","506385A2-E444-4AE2-A860-F00957A62C8A"
3,"My Updated Third Article","abc","506385A2-E444-4AE2-A860-F00957A62C8A"
4,"My Fourth Article","abc","506385A2-E444-4AE2-A860-F00957A62C8A"
5,"My Fifth Article","abc","506385A2-E444-4AE2-A860-F00957A62C8A"
...
```

</template>

<template #graphql>

`// Not currently available in GraphQL` </template> </SnippetToggler>

## Export Data to a File

Export a larger data set to a file in the File Library

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /utils/export/:collection`

```json
{
	"query": {
		"filter": {
			"status": {
				"_eq": "published"
			}
		}
	},
	"file": {
		"folder": "34e95c19-cc50-42f2-83c8-b97616ac2390"
	}
}
```

</template>

<template #graphql>

`// Not currently available in GraphQL` </template> </SnippetToggler>

#### Query Parameters

Doesn't use any query parameters.

#### Request Body

`format` **Required**\
What file format to save the export to. One of `csv`, `json`, `xml`, `yaml`.

`query` **Required**\
The query object to use for the export. Supports the [global query parameters](/reference/query).

`file` **File Object**\
Partial file object to tweak where / how the export file is saved.

### Response

Empty body

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /utils/export/articles`

```json
{
	"query": {
		"filter": {
			"status": {
				"_eq": "published"
			}
		}
	},
	"file": {
		"folder": "34e95c19-cc50-42f2-83c8-b97616ac2390"
	}
}
```

</template>

<template #graphql>

`// Not currently available in GraphQL` </template> </SnippetToggler>

## Clear the Internal Cache

Resets both the data and schema cache of Directus. This endpoint is only available to admin users.

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /utils/cache/clear` </template>

<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	utils_cache_clear
}
```

</template>
</SnippetToggler>

### Returns

Empty body
