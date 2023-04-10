---
description: REST and GraphQL API documentation on the Revisions collection in Directus.
readTime: 2 min read
pageClass: page-reference
---

# Revisions

> Revisions are individual changes to items made. Directus keeps track of changes made, so you're able to revert to a
> previous state at will. [Learn more about Revisions](/getting-started/glossary#revisions).

---

## The Revision Object

`id` **integer**\
Primary key of the revision.

`activity` **many-to-one**\
Related activity record. Many-to-one to [activity](/reference/system/activity).

`collection` **string**\
Collection in which this revision happened.

`item` **string**\
Primary key of the item that was changed.

`data` **object**\
Snapshot of the top-level item data.

`delta` **object**\
Snapshot of the changes made in this revision.

`parent` **many-to-one**\
Parent revision that triggered this revision. Many-to-one to revisions (recursive).

```json
{
	"id": 368,
	"activity": 438,
	"collection": "articles",
	"item": "1",
	"data": {
		"title": "Hello World"
	},
	"delta": {
		"title": "Hello from the Docs!"
	},
	"parent": null
}
```

---

## List revisions

List all revisions that exist in Directus.

::: tip Permissions

The data returned in this endpoint will be filtered based on the user's permissions. For example, revisions that apply
to a collection that the current user doesn't have access to are stripped out.

:::

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

An array of up to [limit](/reference/query#limit) [revision objects](#the-revision-object). If no items are available,
data will be an empty array.

### REST API

```
GET /revisions
SEARCH /revisions
```

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	revisions: [directus_revisions]
}
```

##### Examples

```graphql
query {
	revisions {
		id
		data
		delta
	}
}
```

---

## Retrieve a revision

List an existing revision by primary key.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

Returns the requested [revision object](#the-revision-object).

### REST API

```
GET /revisions/:id
```

##### Example

```
GET /revisions/322
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	revisions_by_id(id: ID!): directus_revisions
}
```

##### Example

```graphql
query {
	revisions_by_id(id: 322) {
		id
		data
		delta
	}
}
```
