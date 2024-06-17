---
description: REST and GraphQL API documentation on the Utilities collection in Directus.
readTime: 3 min read
pageClass: page-reference
---

# Utilities

> Utilities are the various helper endpoints located within the API.

## Generate a Random String

Generate a random string of a given length.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /utils/random/string`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	utils_random_string(length: Int): String
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, randomString } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(randomString(length));
```

</template>
</SnippetToggler>

#### Query Parameters

`length`\
Length of the string to generate.

### Response

Generated string.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /utils/random/string?length=64`

</template>
<template #graphql>

```graphql
mutation {
	utils_random_string(length: 64)
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, randomString } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(randomString(64));
```

</template>
</SnippetToggler>

## Generate a Hash

Generate a hash for a given string.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /utils/hash/generate`

```json
{
	"string": string_to_hash
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
<template #sdk>

```js
import { createDirectus, rest, generateHash } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(generateHash(string_to_hash));
```

</template>
</SnippetToggler>

#### Request Body

`string` **Required**\
String to hash.

### Response

Hashed string.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
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
<template #sdk>

```js
import { createDirectus, rest, generateHash } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(generateHash('test string to hash'));
```

</template>
</SnippetToggler>

## Verify a Hash

Verify a string with a hash.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /utils/hash/verify`

```json
{
	"string": string_to_verify,
	"hash": hash
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
<template #sdk>

```js
import { createDirectus, rest, verifyHash } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(verifyHash(string_to_verify, hash));
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

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
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
mutation {
	utils_hash_verify(hash: "$arg...fEfM", string: "Hello World!")
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, verifyHash } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	verifyHash(
		'test_string',
		'$argon2id$v=19$m=65536,t=3,p=4$c81PPca80cdIbclXlL1PFg$+EKJsuXlkleP2wFGsEmA7Xu56wEqVKHeDXRrTLIAoJg'
	)
);
```

</template>
</SnippetToggler>

## Manually Sort Items in Collection

If a collection has a sort field, this util can be used to move items in that manual order.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /utils/sort/articles`

```json
{
	"item": id_item_to_move,
	"to": id_item_moving_to
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
<template #sdk>

```js
import { createDirectus, rest, utilitySort } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(utilitySort(collection_name, id_item_to_move, id_item_moving_to));
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

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
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
<template #sdk>

```js
import { createDirectus, rest, utilitySort } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(utilitySort('things', '2', '4'));
```

</template>
</SnippetToggler>

## Import Data from File

Import multiple records from a JSON or CSV file into a collection.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /utils/import/:collection`

Body must be formatted as a `multipart/form-data` with a `file` property.

</template>
<template #graphql>

`// Not currently available in GraphQL`

</template>
<template #sdk>

```js
import { createDirectus, rest, utilsImport } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const formData = new FormData();
formData.append('file', raw_file);

const result = await client.request(utilsImport(formData));
```

</template>
</SnippetToggler>

The import endpoint expects the file structure to match [the export query parameter](/reference/query#export). For JSON,
this is an array of objects, where every object is an item. For CSV, the first line has to be the columns header.

#### Request Body

Send the file in a `multipart/form-data` request. See [Upload a File](/reference/files#upload-a-file) for more
information.

### Response

Empty body.

## Export Data to a File

Export a larger data set to a file in the File Library

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
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

`// Not currently available in GraphQL`

</template>
<template #sdk>

```js
import { createDirectus, rest, utilsExport } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(
	utilsExport(
		'collection_name',
		'file_format',
		{
			query_type: {
				field: {
					query_operation: 'value',
				},
			},
		},
		{
			file: {
				file_field: 'value',
			},
		}
	)
);
```

</template>
</SnippetToggler>

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

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
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

`// Not currently available in GraphQL`

</template>
<template #sdk>

```js
import { createDirectus, rest, utilsExport } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	utilsExport(
		'articles',
		'json',
		{
			filter: {
				status: {
					_eq: 'published',
				},
			},
		},
		{
			file: {
				folder: '34e95c19-cc50-42f2-83c8-b97616ac2390',
			},
		}
	)
);
```

</template>
</SnippetToggler>

## Clear the Internal Cache

Resets the data cache of Directus. Optionally, can also clear system cache. This endpoint is only available to admin
users.

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /utils/cache/clear`

`POST /utils/cache/clear?system`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	utils_cache_clear
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, clearCache } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(clearCache());
```

</template>
</SnippetToggler>

### Returns

Empty body
