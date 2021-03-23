# GraphQL API

> Directus offers a GraphQL endpoint out-of-the-box. It has the same functionality as the REST API, and can be accessed
> through `/graphql` and `/graphql/system`.

::: warning Mutations

The Directus GraphQL endpoint does not yet support mutations.

:::

[[toc]]

## Authentication

By default, the GraphQL endpoint will access data as the public role. If you feel like collections or fields are
missing, make sure you're authenticated as a user that has access to those fields. See
[Authentication](/reference/api/authentication).

## Items vs System

All non-system data is available through `/graphql`. All the system data can be accessed in `/graphql/system`.

Items in collections can be queried on the root:

```graphql
query {
	articles {
		id
	}
}
```

System data can be queried by using the collection name without the `directus_` prefix:

```graphql
query {
	files {
		id
	}

	users {
		id
	}

	// etc
}
```

## Query Parameters

All [global query parameters](/reference/api/query/) are available as Arguments in GraphQL, for example:

```graphql
query {
	articles(sort: ["published_on"], limit: 15, filter: { status: { _eq: "published" } }) {
		id
		title
		body
	}
}
```

## Many-to-Any / Union Types

Many-to-Any fields can be queried using GraphQL Union Types:

```graphql
query {
	pages {
		sections {
			item {
				__typename

				... on headings {
					title
					level
				}

				... on paragraphs {
					body
				}

				... on videos {
					source
				}
			}
		}
	}
}
```

## Mutations

Directus' GraphQL endpoint supports creating, updating, and deleting items through the GraphQL endpoint.

### Create

Prefix the collection name with `create_`, and add a `data` attribute with an array of objects with the item payloads:

```graphql
mutation {
	create_articles(data: [{ title: "Hello World!" }]) {
		id
		title
		created_by
	}
}
```

### Update

Prefix the collection name with `update_`, add a `data` attribute with the changes, and an array of `keys` to update:

```graphql
mutation {
	update_articles(data: { title: "Hello World!" }, keys: [15, 21, 42]) {
		id
		title
		modified_on
	}
}
```

### Delete

Prefix the collection name with `delete_`, and add an array of `keys` to delete:

```graphql
mutation {
	delete_articles(keys: [15, 21, 42]) {
		keys
	}
}
```
