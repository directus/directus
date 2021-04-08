---
pageClass: page-reference
---

# Extensions

<div class="two-up">
<div class="left">

> The extensions endpoints are used by the Admin App to retrieve what extensions to install.
> [Learn more about Extensions](/concepts/extensions/).

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## List Extensions

List the available extensions in the project. The types of extensions that you can list are interfaces, displays,
layouts, modules.

<div class="two-up">
<div class="left">

### Query Parameters

This endpoint doesn't currently support any query parameters.

### Returns

An array of interface extension keys.

</div>
<div class="right">

### REST API

```
GET /extensions/:type
```

##### Example

```
GET /extensions/interfaces
```

### GraphQL

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

</div>
</div>
