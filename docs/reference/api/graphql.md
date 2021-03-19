# GraphQL API

> Directus offers a GraphQL endpoint out-of-the-box. It has the same functionality as the REST API, and can be accessed through `/graphql`.

::: warning Mutations

The Directus GraphQL endpoint does not yet support mutations.

:::

[[toc]]

## GraphiQL

By default, Directus will render GraphiQL when opening the `/graphql` endpoint in the browser. This'll allow you to
experiment with GraphQL, and explore the data within.

Like, where to post, where to enter the token, some basic queries, disclaimer that there are no mutations yet, how to do
system tables vs custom tables, etc


## Schema

In order to use the GraphQL schema on a external GraphQL explorer the `content-type` header needs to be set to `application/json`, otherwise it will not load the schema correctly.

## Authentication

By default, the GraphQL endpoint will access data as the public role. If you feel like collections or fields are
missing, make sure you're authenticated as a user that has access to those fields. See
[Authentication](/reference/api/authentication).

## Querying Data

All data in the user-created collections can be accessed through the root `items` property:

```graphql
query {
	items {
		articles {
			id
		}
	}
}
```

All system data can be accessed through the root as well, by using the system collection name without the `directus_`
prefix:

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
	items {
		articles(sort: "published_on", limit: 15, filter: { status: { _eq: "published" } }) {
			id
			title
			body
		}
	}
}
```

## Many-to-Any / Union Types

Many-to-Any fields can be queried using GraphQL Union Types:

```graphql
query {
	items {
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
}
```
