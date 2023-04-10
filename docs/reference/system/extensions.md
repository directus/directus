---
description: REST and GraphQL API documentation on the Extensions collection in Directus.
readTime: 1 min read
pageClass: page-reference
---

# Extensions

> The extensions endpoints are used by the Admin App to retrieve what extensions to install.
> [Learn more about Extensions](/getting-started/glossary#extensions).

---

## List Extensions

List the available extensions in the project. The types of extensions that you can list are interfaces, displays,
layouts, modules.

### Query Parameters

This endpoint doesn't currently support any query parameters.

### Returns

An array of interface extension keys.

### REST API

```
GET /extensions/:type
```

##### Example

```
GET /extensions/interfaces
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	extensions: extensions
}
```

##### Example

```graphql
query {
	extensions {
		interfaces
	}
}
```
