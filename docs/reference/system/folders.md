---
description: REST and GraphQL API documentation on the Folders collection in Directus.
readTime: 4 min read
pageClass: page-reference
---

# Folders

> Folders can be used to organize files within the platform. Folders are virtual, and aren't mirrored within the storage
> adapter.

---

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

---

## List Folders

List all folders that exist in Directus.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

An array of up to [limit](/reference/query#limit) [folder objects](#the-folder-object). If no items are available, data
will be an empty array.

### REST API

```
GET /folders
SEARCH /folders
```

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	folders: directus_folders
}
```

##### Example

```graphql
query {
	folders {
		name
	}
}
```

---

## Retrieve a Folder

List all folders that exist in Directus.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

Returns a [folder object](#the-folder-object) if a valid primary key was provided.

### REST API

```
GET /folders/:id
```

##### Example

```
GET /folders/fc02d733-95b8-4e27-bd4b-08a32cbe4e66
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	folders_by_id(id: ID!): directus_folders
}
```

##### Example

```graphql
query {
	folders_by_id(id: "fc02d733-95b8-4e27-bd4b-08a32cbe4e66") {
		name
	}
}
```

---

## Create a Folder

Create a new (virtual) folder.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [folder object](#the-folder-object). `name` is required.

### Returns

Returns the [folder object](#the-folder-object) of the folder that was created.

### REST API

```
POST /folders
```

##### Example

```json
// POST /folders

{
	"name": "Nature"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	create_folders_item(data: create_directus_folders_input): directus_folders
}
```

##### Example

```graphql
mutation {
	create_folders_item(data: { name: "Nature" }) {
		id
		name
	}
}
```

---

## Create Multiple Folders

Create multiple new (virtual) folders.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

An array of partial [folder objects](#the-folder-object). `name` is required.

### Returns

Returns the [folder object](#the-folder-object) of the folder that was created.

### REST API

```
POST /folders
```

##### Example

```json
// POST /folders

[
	{
		"name": "Nature"
	},
	{
		"name": "Cities"
	}
]
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	create_folders_items(data: [create_directus_folders_input]): [directus_folders]
}
```

##### Example

```graphql
mutation {
	create_folders_items(data: [{ name: "Nature" }, { name: "Cities" }]) {
		id
		name
	}
}
```

---

## Update a Folder

Update an existing folder.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [folder object](#the-folder-object).

### Returns

Returns the [folder object](#the-folder-object) of the folder that was updated.

### REST API

```
PATCH /folders/:id
```

##### Example

```json
// PATCH /folders/fac21847-d5ce-4e4b-a288-9abafbdfbc87

{
	"parent": "d97c2e0e-293d-4eb5-9e1c-27d3460ad29d"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_folders_item(id: ID!, data: update_directus_folders_input): directus_folders
}
```

##### Example

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

---

## Update Multiple Folders

Update multiple existing folders.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

`keys` **Required**\
Array of primary keys of the folders you'd like to update.

`data` **Required**\
Any of [the folder object](#the-folder-object)'s properties.

### Returns

Returns the [folder objects](#the-folder-object) of the folders that were updated.

### REST API

```
PATCH /folders
```

##### Example

```json
// PATCH /folders

{
	"keys": ["fac21847-d5ce-4e4b-a288-9abafbdfbc87", "a5bdb793-dd85-4ac9-882a-b42862092983"],
	"data": {
		"parent": "d97c2e0e-293d-4eb5-9e1c-27d3460ad29d"
	}
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_folders_items(ids: [ID!]!, data: update_directus_folders_input): [directus_folders]
}
```

##### Example

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

---

## Delete a Folder

Delete an existing folder.

::: tip Files

Any files in this folder will be moved to the root folder.

:::

### Returns

Empty body.

### REST API

```
DELETE /folders/:id
```

##### Example

```
// DELETE /folders/a5bdb793-dd85-4ac9-882a-b42862092983
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_folders_item(id: ID!): delete_one
}
```

##### Example

```graphql
mutation {
	delete_folders_item(id: "fac21847-d5ce-4e4b-a288-9abafbdfbc87") {
		id
	}
}
```

---

## Delete Multiple Folders

Delete multiple existing folders.

::: tip Files

Any files in these folders will be moved to the root folder.

:::

### Request Body

An array of folder primary keys.

### Returns

Empty body.

### REST API

```
DELETE /folders
```

##### Example

```json
// DELETE /folders

["d97c2e0e-293d-4eb5-9e1c-27d3460ad29d", "fc02d733-95b8-4e27-bd4b-08a32cbe4e66"]
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_folders_items(ids: [ID!]!): delete_many
}
```

##### Example

```graphql
mutation {
	delete_folders_items(ids: ["fac21847-d5ce-4e4b-a288-9abafbdfbc87", "a5bdb793-dd85-4ac9-882a-b42862092983"]) {
		ids
	}
}
```
