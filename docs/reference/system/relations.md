---
description: REST and GraphQL API documentation on the Relations collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Relations

> What data is linked to what other data. Allows you to assign authors to articles, products to sales, and whatever
> other structures you can think of. [Learn more about Relationships](/getting-started/glossary#relationships).

---

## The Relation Object

`collection` **string**\
Name of the collection. This matches the table name in the database.

`field` **string**\
Name of the field that holds the related primary key. This matches the column name in the database.

`related_collection` **string**\
Name of the related collection. This matches the table name in the database.

#### Meta

Directus metadata. Used to enable non-database relationship types

`id` **integer**\
Primary key of the metadata row in `directus_relations`.

`many_collection` **string**\
Name of the collection. Matches the top level `collection` field.

`many_field` **string**\
Name of the field. Matches the top level `field` field.

`one_collection` **string**\
Name of the related collection. Matches the top level `related_collection` field.

`one_field` **string**\
Name of the one to many field on the other side of the relation.

`one_allowed_collections` **string**\
What collections are allowed to be used in a many-to-any context.

`one_collection_field` **string**\
Field that holds the collection name in a many-to-any context.

`one_deselect_action` **nullify | delete**\
Whether to nullify or delete related one-to-many records.

`sort_field` **string**\
What field is used to hold the sort field.

`junction_field` **string**\
What field connects two relations in a many-to-many (O2M-M2O) context.

#### Schema

"Raw" database information. Based on the database vendor used, different information might be returned. The following
are available for all drivers.

`table` **string**\
The table name.

`column` **string**\
The column name.

`foreign_key_table` **string**\
Related table name.

`foreign_key_column` **string**\
Related column name.

`constraint_name` **string**\
Name for the foreign key constraint.

`on_update` **string**\
Update trigger for the foreign key constraint.

`on_delete` **string**\
Delete trigger for the foreign key constraint.

```json
{
	"collection": "about_us",
	"field": "logo",
	"related_collection": "directus_files",
	"schema": {
		"table": "about_us",
		"column": "logo",
		"foreign_key_table": "directus_files",
		"foreign_key_column": "id",
		"constraint_name": "about_us_logo_foreign",
		"on_update": "NO ACTION",
		"on_delete": "SET NULL"
	},
	"meta": {
		"id": 1,
		"junction_field": null,
		"many_collection": "about_us",
		"many_field": "logo",
		"one_allowed_collections": null,
		"one_collection": "directus_files",
		"one_collection_field": null,
		"one_deselect_action": "nullify",
		"one_field": null,
		"sort_field": null
	}
}
```

---

## List relations

List all relations that exist in Directus.

::: tip Permissions

The data returned in this endpoint will be filtered based on the user's permissions. For example, relations that apply
to a collection that the current user doesn't have access to are stripped out.

:::

### Query Parameters

Doesn't support any query parameters.

### Returns

Array of [relation objects](#the-relation-object). If no items are available, data will be an empty array.

### REST API

```
GET /relations
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	relations: [directus_relations]
}
```

##### Example

```graphql
query {
	relations {
		collection
		field
	}
}
```

---

## List relations in collection

List all relations that exist in a given collection.

::: tip Permissions

The data returned in this endpoint will be filtered based on the user's permissions. For example, relations that apply
to a collection that the current user doesn't have access to are stripped out.

:::

### Query Parameters

Doesn't support any query parameters.

### Returns

Array of [relation objects](#the-relation-object). If no items are available, data will be an empty array.

### REST API

```
GET /relations/:collection
```

##### Example

```
GET /relations/articles
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	relations_in_collection(collection: String!): [directus_relations]
}
```

##### Example

```graphql
query {
	relations_in_collection(collection: "articles") {
		collection
		field
	}
}
```

---

## Retrieve a relation

List an existing relation by collection/field name.

### Query Parameters

Doesn't support any query parameters.

### Returns

Returns the requested [relation object](#the-relation-object).

### REST API

```
GET /relations/:collection/:field
```

##### Example

```
GET /relations/articles/featured_image
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	relations_by_name(collection: String!, field: String!): directus_relations
}
```

##### Example

```graphql
query {
	relations_by_name(collection: "articles", field: "featured_image") {
		collection
		field
		related_collection
	}
}
```

---

## Create a Relation

Create a new relation.

### Query Parameters

Doesn't support any query parameters.

### Request Body

A partial [relation object](#the-relation-object).

### Returns

Returns the [relation object](#the-relation-object) for the created relation.

### REST API

```
POST /relations
```

##### Example

```json
// POST /relations

{
	"collection": "articles",
	"field": "featured_image",
	"related_collection": "directus_files"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	create_relations_item(data: create_directus_relations_input!): directus_relations
}
```

##### Example

```graphql
mutation {
	create_relations_item(
		data: { collection: "articles", field: "featured_image", related_collection: "directus_files" }
	) {
		collection
		field
		related_collection
	}
}
```

---

## Update a Relation

Update an existing relation.

### Query Parameters

Doesn't support any query parameters.

### Request Body

A partial [relation object](#the-relation-object).

### Returns

Returns the [relation object](#the-relation-object) for the created relation.

### REST API

```
PATCH /relations/:collection/:field
```

##### Example

```json
// PATCH /relations/articles/author

{
	"meta": {
		"one_field": "articles"
	}
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_relations_item(collection: String!, field: String!, data: update_directus_relations_input!): directus_relations
}
```

##### Example

```graphql
mutation {
	update_relations_item(collection: "articles", field: "author", data: { meta: { one_field: "articles" } }) {
		collection
		field
		related_collection
	}
}
```

---

## Delete a Relation

Delete an existing relation.

### Returns

Empty body.

### REST API

```
DELETE /relations/:collection/:field
```

##### Example

```
DELETE /relations/articles/author
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_relations_item(collection: String!, field: String!): delete_one
}
```

##### Example

```graphql
mutation {
	delete_relations_item(collection: "articles", field: "author") {
		collection
		field
	}
}
```
