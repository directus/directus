---
pageClass: page-reference
---

# Collections

<div class="two-up">
<div class="left">

> Collections are the individual collections of items, similar to tables in a database. Changes to collections will
> alter the schema of the database. [Learn more about Collections](/concepts/collections/).

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## The Collection Object

<div class="two-up">
<div class="left">
<div class="definitions">

`collection` **string**\
Name of the collection. This matches the table name in the database.

</div>

#### Meta

Directus metadata, primarily used in the Admin App.

<div class="definitions">

`collection` **string**\
Name of the collection. This matches the table name in the database.

`icon` **string**\
Icon displayed in the Admin App when working with this collection.

`note` **string**\
Short description displayed in the Admin App.

`display_template` **string**\
How items in this collection should be displayed when viewed relationally in the Admin App.

`hidden` **boolean**\
Whether or not this collection is hidden in the Admin App.

`singleton` **boolean**\
Whether or not this collection is treated as a singleton.

`translations` **array**\
How this collection's name is displayed in the different languages in the Admin App.

`archive_field` **string**\
What field in the collection holds the archived state.

`archive_value` **string**\
What value the archive field should be set to when archiving an item.

`unarchive_value` **string**\
What value the archive field should be set to when unarchiving an item.

`archive_app_filter` **boolean**\
Whether or not the Admin App should allow the user to view archived items.

`sort_field` **boolean**\
What field holds the sort value on the collection. The Admin App uses this to allow drag-and-drop manual sorting.

</div>

#### Schema

"Raw" database information. Based on the database vendor used, different information might be returned. The following
are available for all drivers.

<div class="definitions">

`name` **string**\
The table name.

`comment` **string**\
The table comment.

</div>
</div>
<div class="right">

```json
{
	"collection": "articles",
	"meta": {
		"collection": "articles",
		"icon": "article",
		"note": "Blog posts",
		"display_template": "{{ title }}",
		"hidden": false,
		"singleton": false,
		"translations": [
			{
				"language": "en-US",
				"translation": "Articles"
			},
			{
				"language": "nl-NL",
				"translation": "Artikelen"
			}
		],
		"archive_field": "status",
		"archive_value": "archived",
		"unarchive_value": "draft",
		"archive_app_filter": true,
		"sort_field": "sort"
	},
	"schema": {
		"name": "pages",
		"comment": null
	}
}
```

</div>
</div>

---

## List Collections

List the available collections.

<div class="two-up">
<div class="left">

### Query Parameters

This endpoint doesn't currently support any query parameters.

### Returns

An array of [collection objects](#the-collection-object).

</div>
<div class="right">

### REST API

```
GET /collections
SEARCH /collections
```

[Learn more about SEARCH ->](/reference/api/introduction/#search-http-method)

### GraphQL

```graphql
type Query {
	collections: [directus_collections]
}
```

##### Example

```graphql
query {
	collections {
		...
	}
}
```

</div>
</div>

---

## Retrieve a Collection

Retrieve a single collection by table name.

<div class="two-up">
<div class="left">

### Query Parameters

This endpoint doesn't currently support any query parameters.

### Returns

A [collection object](#the-collection-object).

</div>
<div class="right">

### REST API

```
GET /collections/:collection
```

##### Example

```
GET /collections/articles
```

### GraphQL

```graphql
type Query {
	collections_by_name(name: String!): directus_collections
}
```

##### Example

```graphql
query {
	collections_by_name(name: "articles") {
		...
	}
}
```

</div>
</div>

---

## Create a Collection

Create a new Collection. This will create a new table in the database as well.

<div class="two-up">
<div class="left">

### Query Parameters

This endpoint doesn't currently support any query parameters.

### Request Body

The `collection` property is required, all other properties of the [collection object](#the-collection-object) are
optional.

You are able to provide an array of `fields` to be created during the creation of the collection. See the
[fields object](/reference/api/system/fields/#the-fields-object) for more information on what properties are available
in a field.

### Returns

The [collection object](#the-collection-object) for the collection created in this request.

</div>
<div class="right">

### REST API

```
POST /collections
```

##### Example

```json
// POST /collections

{
	"collection": "testimonials",
	"meta": {
		"icon": "format_quote"
	}
}
```

### GraphQL

```graphql
type Mutation {
	create_collections_item(data: directus_collections): directus_collections
}
```

##### Example

```graphql
mutation {
	create_collections_item(data: {
		collection: "testimonials",
		meta: {
			icon: "format_quote"
		}
	}) {
		...
	}
}
```

</div>
</div>

---

## Update a Collection

Update the metadata for an existing collection.

<div class="two-up">
<div class="left">

### Query Parameters

This endpoint doesn't currently support any query parameters.

### Request Body

You can only update the `meta` values of the the [collection object](#the-collection-object). Updating the collection
name is not supported at this time.

### Returns

The [collection object](#the-collection-object) for the updated collection in this request.

</div>
<div class="right">

### REST API

```
PATCH /collections/:collection
```

##### Example

```json
// PATCH /collections/testimonials

{
	"meta": {
		"note": "Short quotes from happy customers."
	}
}
```

### GraphQL

```graphql
type Mutation {
	update_collections_item(collection: String!, data: update_directus_collections_input!): directus_collections
}
```

##### Example

```graphql
mutation {
	update_collections_item(collection: "testimonials", data: { meta: { note: "Short quotes from happy customers." } }) {
		collection
	}
}
```

</div>
</div>

---

## Delete a Collection

Delete a collection.

<div class="two-up">
<div class="left">

::: danger Destructive

Be aware, this will delete the table from the database, including all items in it. This action can't be undone.

:::

</div>
<div class="right">

### REST API

```
DELETE /collections/:collection
```

##### Example

```
DELETE /collections/articles
```

### GraphQL

```graphql
type Mutation {
	delete_collections_item(collection: String!): delete_collection
}
```

##### Example

```graphql
mutation {
	delete_collections_item(collection: "articles") {
		collection
	}
}
```

</div>
</div>

---
