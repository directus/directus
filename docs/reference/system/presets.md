---
description: REST and GraphQL API documentation on the Presets collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Preset

> Presets hold the preferences of individual users of the platform. This allows Directus to show and maintain custom
> item listings and bookmarks for users of the app. [Learn more about Presets](/getting-started/glossary#presets).

---

## The Preset Object

`id` **uuid**\
Primary key of the preset.

`bookmark` **string**\
The title of the bookmark. If this value is `null`, it's considered a preset instead of a bookmark.

`user` **many-to-one**\
User this preset applies to. Many-to-one to [users](/reference/system/users).

`role` **many-to-one**\
Role this preset applies to. Many-to-one to [users](/reference/system/users).

`collection` **string**\
Collection this preset applies to.

`search` **string**\
The search query used in the preset.

`filters` **array**\
The filters used in the preset.

`layout` **string**\
The layout used in this preset.

`layout_query` **object**\
The item query used by the layout. This structure is based on the used layout.

`layout_options` **object**\
The options used by the layout. This structure is based on the used layout.

```json
{
	"id": 39,
	"bookmark": null,
	"user": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
	"role": null,
	"collection": "directus_activity",
	"search": null,
	"filters": [],
	"layout": "tabular",
	"layout_query": {
		"tabular": {
			"sort": "-timestamp",
			"fields": ["action", "collection", "timestamp", "user"],
			"page": 1
		}
	},
	"layout_options": {
		"tabular": {
			"widths": {
				"action": 100,
				"collection": 210,
				"timestamp": 240,
				"user": 240
			}
		}
	}
}
```

---

## List Presets

List all presets that exist in Directus.

::: tip Permissions

The data returned in this endpoint will be filtered based on the user's permissions. For example, presets for a role
other than the current user's role won't be returned.

:::

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

An array of up to [limit](/reference/query#limit) [preset objects](#the-preset-object). If no items are available, data
will be an empty array.

### REST API

```
GET /presets
SEARCH /presets
```

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	presets: [directus_presets]
}
```

##### Example

```graphql
query {
	presets {
		id
		user
	}
}
```

---

## Retrieve a preset

List an existing preset by primary key.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

Returns the requested [preset object](#the-preset-object).

### REST API

```
GET /presets/:id
```

##### Example

```
GET /presets/42
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	presets_by_id(id: ID!): directus_presets
}
```

##### Example

```graphql
query {
	presets_by_id(id: 42) {
		id
		user
	}
}
```

---

## Create a Preset

Create a new preset.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [preset object](#the-preset-object).

### Returns

Returns the [preset object](#the-preset-object) for the created preset.

### REST API

```
POST /presets
```

##### Example

```json
// POST /presets

{
	"user": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
	"layout": "cards",
	"search": "Directus"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	create_presets_item(data: create_directus_presets_input!): directus_presets
}
```

##### Example

```graphql
mutation {
	create_presets_item(data: { user: "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca", layout: "cards", search: "Directus" }) {
		id
		user
	}
}
```

---

## Create Multiple Presets

Create multiple new presets.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

An array of partial [preset objects](#the-preset-object).

### Returns

Returns the [preset object](#the-preset-object) for the created preset.

### REST API

```
POST /presets
```

##### Example

```json
// POST /presets

[
	{
		"collection": "directus_files",
		"user": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
		"layout": "cards",
		"search": "Directus"
	},
	{
		"collection": "articles",
		"user": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
		"layout": "tabular"
	}
]
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	create_presets_items(data: [create_directus_presets_input!]!): [directus_presets]
}
```

##### Example

```graphql
mutation {
	create_presets_items(
		data: [
			{
				collection: "directus_files"
				user: "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca"
				layout: "cards"
				search: "Directus"
			}
			{ collection: "articles", user: "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca", layout: "tabular" }
		]
	) {
		id
		user
	}
}
```

---

## Update a Preset

Update an existing preset.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [preset object](#the-preset-object).

### Returns

Returns the [preset object](#the-preset-object) for the updated preset.

### REST API

```
PATCH /presets/:id
```

##### Example

```json
// PATCH /presets/34

{
	"layout": "tabular"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_presets_item(id: ID!, data: update_directus_presets_input): directus_presets
}
```

##### Example

```graphql
mutation {
	update_presets_item(id: 32, data: { layout: "tabular" }) {
		id
		user
	}
}
```

---

## Update Multiple Presets

Update multiple existing presets.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

`keys` **Required**\
Array of primary keys of the presets you'd like to update.

`data` **Required**\
Any of [the preset object](#the-preset-object)'s properties.

### Returns

Returns the [preset objects](#the-preset-object) for the updated presets.

### REST API

```
PATCH /presets
```

##### Example

```json
// PATCH /presets

{
	"keys": [15, 64],
	"data": {
		"layout": "tabular"
	}
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_presets_items(ids: [ID!]!, data: update_directus_presets_input): [directus_presets]
}
```

##### Example

```graphql
mutation {
	update_presets_items(ids: [15, 64], data: { layout: "tabular" }) {
		id
		user
	}
}
```

---

## Delete a Preset

Delete an existing preset.

### Returns

Empty body.

### REST API

```
DELETE /presets/:id
```

##### Example

```
DELETE /presets/34
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_presets_item(id: ID!): delete_one
}
```

##### Example

```graphql
mutation {
	delete_presets_item(id: 32) {
		id
	}
}
```

---

## Delete Multiple Presets

Delete multiple existing presets.

### Request Body

An array of preset primary keys

### Returns

Empty body.

### REST API

```
DELETE /presets
```

##### Example

```json
// DELETE /presets
[15, 251, 810]
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_presets_items(ids: [ID!]!): delete_many
}
```

##### Example

```graphql
mutation {
	delete_presets_items(ids: [15, 251, 810]) {
		ids
	}
}
```
