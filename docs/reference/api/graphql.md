# GraphQL API

> Directus offers a GraphQL endpoint out-of-the-box. It can be accessed through `/graphql` and `/graphql/system`.

[[toc]]

::: tip Authentication

By default, the GraphQL endpoint will access data as the public role. If you feel like collections or fields are
missing, make sure you're authenticated as a user that has access to those fields or that your public role has the
correct permissions. See [Authentication](/reference/api/authentication).

:::

::: tip User- vs System-Data

To avoid naming conflicts between user-created collections and Directus' system data, the two have been split up into
two endpoints: `/graphql` and `/graphql/system` respectively.

:::

## Query

Basic queries are done by using the collection name as the query field, for example:

```graphql
query {
	articles {
		id
		title
	}
}
```

This will fetch the `id`, and `title` fields in the `articles` collection using the default [arguments](#arguments).

### Arguments

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

### Fetching a Single Item

To fetch a single item by ID, append `_by_id` to the collection name in the query, and provide the `id` attribute, for
example:

```graphql
query {
	# Fetch article with ID 5
	articles_by_id(id: 5) {
		id
		title
	}
}
```

### Variables

Variables can be used to dynamically insert/override parts of the query, for example:

```graphql
query($id: ID) {
	articles_by_id(id: $id) {
		id
		title
	}
}
```

```json
// Variables
{
	"id": 5
}
```

### Fragments & Many-to-Any / Union Types

Fragments can be used to reuse selection sets between multiple queries, for example:

```graphql
fragment article_content on articles {
	id
	title
}

query {
	rijksArticles: articles(filter: { author: { first_name: { _eq: "Rijk" } } }) {
		...article_content
	}

	bensArticles: articles(filter: { author: { first_name: { _eq: "Ben" } } }) {
		...article_content
	}
}
```

Fragments are also used to dynamically query the correct fields in nested Many-to-Any fields:

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

## Mutation

Directus' GraphQL endpoint supports creating, updating, and deleting items through the GraphQL endpoint.

All mutations follow the `<action>_<collection>_<items | item>` format where `_item` operates on a single item, and
`_items` on a set of items, for example:

```
create_articles_items(data: [{}])
update_services_item(id: 1, data: {})
delete_likes_items(ids: [1, 5])
```

Singletons don't have this item vs items delineation, as they're only a single record at all times.

### Create

```graphql
mutation {
	# Multiple
	create_articles_items(data: [{ title: "Hello World!" }, { title: "Hello Again!" }]) {
		id
		title
		created_by
	}

	# Single
	create_articles_item(data: { title: "Hello World!" }) {
		id
		title
		created_by
	}
}
```

### Update

```graphql
mutation {
	# Multiple
	update_articles_items(ids: [15, 21, 42], data: { title: "Hello World!" }) {
		id
		title
		modified_on
	}

	# Single
	update_articles_item(id: 15, data: { title: "Hello World!" }) {
		id
		title
		modified_on
	}
}
```

### Delete

Delete mutations will only return the affected row IDs.

```graphql
mutation {
	# Multiple
	delete_articles_items(ids: [15, 21, 42]) {
		ids
	}

	# Single
	delete_articles_item(id: 15) {
		id
	}
}
```

## SDL Spec

You can download the SDL for the current project / user by opening `/server/specs/graphql` (or
`/server/specs/graphql/system`) in the browser. See [Get GraphQL SDL](/reference/api/rest/server/#get-graphql-sdl) for
more information.
