---
description: REST and GraphQL API documentation on the Folders collection in Directus.
readTime: 4 min read
pageClass: page-reference
---

# Folders

> Folders can be used to organize files within the platform. Folders are virtual, and aren't mirrored within the storage
> adapter.

## The Folder Object

`id` **uuid**\
Primary key of the folder.

`name` **string**\
Name of the folder.

`parent` **many-to-one**\
Parent folder. Many-to-one to folders (recursive).

```json
{
	"data": {
		"id": "fc02d733-95b8-4e27-bd4b-08a32cbe4e66",
		"name": "Test",
		"parent": null
	}
}
```

## List Folders

List all folders that exist in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /folders`

`SEARCH /folders`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	folders: directus_folders
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, readFolders } from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(readFolders({
    'fields' : ['*']
    })
);

console.log(result);
```
</template>
</SnippetToggler>

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [folder objects](#the-folder-object). If no items are available, data
will be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /folders`

`SEARCH /folders`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	folders {
		name
	}
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, readFolders } from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(readFolders({
    'fields' : ['*']
    })
);

console.log(result);
```
</template>
</SnippetToggler>

## Retrieve a Folder

List an existing folder by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /folders/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	folders_by_id(id: ID!): directus_folders
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, readFolder } from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(readFolder('folder_id',{
    'fields' : ['*']
    })
);

console.log(result);
```
</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns a [folder object](#the-folder-object) if a valid primary key was provided.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /folders/fc02d733-95b8-4e27-bd4b-08a32cbe4e66`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	folders_by_id(id: "fc02d733-95b8-4e27-bd4b-08a32cbe4e66") {
		name
	}
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, readFolder } from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(readFolder('a141336b-398a-44d0-ad1b-4e31b09219a1',{
    'fields' : ['*']
    })
);

console.log(result);
```
</template>
</SnippetToggler>

## Create a Folder

Create a new (virtual) folder.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /folders`

```json
{
	"name": "value_1"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_folders_item(data: create_directus_folders_input): directus_folders
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, createFolder } from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(createFolder({
    'name' : 'value'
    })
);

console.log(result);
```
</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [folder object](#the-folder-object). `name` is required.

### Response

Returns the [folder object](#the-folder-object) of the folder that was created.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /folders`

```json
{
	"name": "Nature"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_folders_item(data: { name: "Nature" }) {
		id
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, createFolder } from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(createFolder({
    'name' : 'banner images'
    })
);

console.log(result);
```
</template>
</SnippetToggler>

## Create Multiple Folders

Create multiple new (virtual) folders.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /folders`

```json
[
	{
		"name": "value_1"
	},
	{
		"name": "value_2"
	}
]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_folders_items(data: [create_directus_folders_input]): [directus_folders]
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, createFolders } from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(createFolders(
    [
        {
        'name' : 'value_1'
        },
        {
        'name' : 'value_2'
        }
    ])
);

console.log(result);
```
</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [folder objects](#the-folder-object). `name` is required.

### Response

Returns the [folder object](#the-folder-object) of the folder that was created.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /folders`

```json
[
	{
		"name": "Nature"
	},
	{
		"name": "Cities"
	}
]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_folders_items(data: [{ name: "Nature" }, { name: "Cities" }]) {
		id
		name
	}
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, createFolders } from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(createFolders(
    [
        {
        'name' : 'hero images'
        },
        {
        'name' : 'transcript pdfs'
        }
    ])
);

console.log(result);
```
</template>
</SnippetToggler>

## Update a Folder

Update an existing folder.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`PATCH /folders/:id`

```json
{
	"folder_object_field": "value_1"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_folders_item(id: ID!, data: update_directus_folders_input): directus_folders
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, updateFolder } from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(updateFolder('folder_id',{
        'field' : 'value'
    })
);

console.log(result);
```
</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [folder object](#the-folder-object).

### Response

Returns the [folder object](#the-folder-object) of the folder that was updated.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`PATCH /folders/fac21847-d5ce-4e4b-a288-9abafbdfbc87`

```json
{
	"parent": "d97c2e0e-293d-4eb5-9e1c-27d3460ad29d"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_folders_item(
		id: "fac21847-d5ce-4e4b-a288-9abafbdfbc87"
		data: { parent: "d97c2e0e-293d-4eb5-9e1c-27d3460ad29d" }
	) {
		id
		name
	}
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, updateFolder } from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(updateFolder('a3c77ec8-35f0-467b-9dc5-5195c4cfdae0',{
        'parent' : 'a151aa85-4784-44cb-8ee8-c568e45e00fd'
    })
);

console.log(result);
```
</template>
</SnippetToggler>

## Update Multiple Folders

Update multiple existing folders.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`PATCH /folders`

```json
{
	"keys": ["folder_1_key", "folder_2_key"],
	"data": {
		"folder_object_field": "value_1"
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_folders_items(ids: [ID!]!, data: update_directus_folders_input): [directus_folders]
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, updatedFolders } from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(updatedFolders(
        ['folder_1_id','folder_2_id'],
        {'field' : 'value'})
);

console.log(result);
```
</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the folders you'd like to update.

`data` **Required**\
Any of [the folder object](#the-folder-object)'s properties.

### Response

Returns the [folder objects](#the-folder-object) of the folders that were updated.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`PATCH /folders`

```json
{
	"keys": ["fac21847-d5ce-4e4b-a288-9abafbdfbc87", "a5bdb793-dd85-4ac9-882a-b42862092983"],
	"data": {
		"parent": "d97c2e0e-293d-4eb5-9e1c-27d3460ad29d"
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_folders_items(
		ids: ["fac21847-d5ce-4e4b-a288-9abafbdfbc87", "a5bdb793-dd85-4ac9-882a-b42862092983"]
		data: { parent: "d97c2e0e-293d-4eb5-9e1c-27d3460ad29d" }
	) {
		id
		name
	}
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, updatedFolders } from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(updatedFolders(
        ['a3c77ec8-35f0-467b-9dc5-5195c4cfdae0','1d8428f9-c437-4d4e-b3df-d276c605f454'],
        {'parent' : 'a151aa85-4784-44cb-8ee8-c568e45e00fd'})
);

console.log(result);
```
</template>
</SnippetToggler>

## Delete a Folder

Delete an existing folder.

::: tip Files

Any files in this folder will be moved to the root folder.

:::

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`DELETE /folders/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_folders_item(id: ID!): delete_one
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, deleteFolder } from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(deleteFolder('folder_id'));

console.log(result);
```
</template>
</SnippetToggler>

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`DELETE /folders/a5bdb793-dd85-4ac9-882a-b42862092983`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_folders_item(id: "fac21847-d5ce-4e4b-a288-9abafbdfbc87") {
		id
	}
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, deleteFolder } from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(deleteFolder('a3c77ec8-35f0-467b-9dc5-5195c4cfdae0'));

console.log(result);
```
</template>
</SnippetToggler>

## Delete Multiple Folders

Delete multiple existing folders.

::: tip Files

Any files in these folders will be moved to the root folder.

:::

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`DELETE /folders`

```json
["folder_1_key", "folder_2_key"]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_folders_items(ids: [ID!]!): delete_many
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, deleteFolders } from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(
    deleteFolders(
        ['folder_1_id','folder_2_id']
    ));

console.log(result);
```

</template>
</SnippetToggler>

#### Request Body

An array of folder primary keys.

### Returns

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`DELETE /folders`

```json
["d97c2e0e-293d-4eb5-9e1c-27d3460ad29d", "fc02d733-95b8-4e27-bd4b-08a32cbe4e66"]
```

</template>
<template #graphql>

```graphql
mutation {
	delete_folders_items(ids: ["fac21847-d5ce-4e4b-a288-9abafbdfbc87", "a5bdb793-dd85-4ac9-882a-b42862092983"]) {
		ids
	}
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, deleteFolders } from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(
    deleteFolders(
        ['1d8428f9-c437-4d4e-b3df-d276c605f454','a151aa85-4784-44cb-8ee8-c568e45e00f']
    ));

console.log(result);
```

</template>
</SnippetToggler>
