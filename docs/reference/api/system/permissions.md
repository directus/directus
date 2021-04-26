---
pageClass: page-reference
---

# Permissions

<div class="two-up">
<div class="left">

> Permissions are assigned to Roles, and control data access throughout the platform.
> [Learn more about Permissions](/concepts/permissions/).

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## The Permission Object

<div class="two-up">
<div class="left">
<div class="definitions">

`id` **uuid**\
Primary key of the permission rule.

`role` **many-to-one**\
Role this permission applies to. Many-to-one to [roles](/reference/api/system/roles/). `null` is used for public permissions.

`collection` **string**\
Collection this permission rule applies to.

`action` **string**\
What CRUD operation this permission rule applies to. One of `create`, `read`, `update`, `delete`.

`permissions` **object**\
What rules the item must pass before the role is allowed to alter it. Follows [the Filter Rules spec](/reference/filter-rules/).

`validation` **object**\
What rules the provided values must pass before the role is allowed to submit them for insertion/update. Follows [the Filter Rules spec](/reference/filter-rules/).

`preset` **object**\
Additional default values for the role.

`fields` **array**\
What fields the user is allowed to alter.

`limit` **integer**\
How many items the user is able to alter at once in batch operations.

</div>
</div>
<div class="right">

```json
{
	"id": 34,
	"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7",
	"collection": "pages",
	"action": "create",
	"permissions": null,
	"validation": {
		"title": {
			"_contains": "Directus"
		}
	},
	"presets": {
		"published": false
	},
	"fields": ["title", "translations"],
	"limit": null
}
```

</div>
</div>

---

## List Permissions

List all permissions that exist in Directus.

<div class="two-up">
<div class="left">

::: tip Permissions

The data returned in this endpoint will be filtered based on the user's permissions. For example, permissions for a role
other than the current user's role won't be returned.

:::

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

An array of up to [limit](/reference/api/query/#limit) [permission objects](#the-permission-object). If no items are
available, data will be an empty array.

</div>
<div class="right">

### REST API

```
GET /permissions
SEARCH /permissions
```

[Learn more about SEARCH ->](/reference/api/introduction/#search-http-method)

### GraphQL

```graphql
type Query {
	permissions: directus_permissions
}
```

##### Example

```graphql
query {
	permissions {
		action
		role
		collection
	}
}
```

</div>
</div>

---

## Retrieve a Permission

List an existing permission by primary key.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

Returns the requested [permission object](#the-permission-object).

</div>
<div class="right">

### REST API

```
GET /permissions/:id
```

##### Example

```json
// GET /permissions/34

{
	"data": {
		"id": 34,
		"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7",
		"collection": "pages",
		"action": "create",
		"permissions": null,
		"validation": {
			"title": {
				"_contains": "Directus"
			}
		},
		"presets": {
			"published": false
		},
		"fields": ["title", "translations"],
		"limit": null
	}
}
```

### GraphQL

```graphql
type Query {
	permissions_by_id(id: ID!): directus_permissions
}
```

##### Example

```graphql
query {
	permissions_by_id(id: 34) {
		role
		collection
		action
	}
}
```

</div>
</div>

---

## Create a Permission Rule

Create a new permission rule

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [permissions object](#the-permission-object). `action` and `collection` are required.

### Returns

Returns the [permission object](#the-permission-object) for the created permission.

</div>
<div class="right">

### REST API

```
POST /permissions
```

##### Example

```json
// Request

{
	"collection": "pages",
	"action": "read",
	"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7",
	"fields": ["id", "title"]
}
```

### GraphQL

```graphql
type Mutation {
	create_permissions_item(data: create_directus_permissions_input!): directus_permissions
}
```

##### Example

```graphql
mutation {
	create_permissions_item(
		data: { collection: "pages", action: "read", role: "c86c2761-65d3-43c3-897f-6f74ad6a5bd7", fields: ["id", "title"] }
	) {
		id
		collection
		action
	}
}
```

</div>
</div>

---

## Create Multiple Permission Rules

Create multiple new permission rules

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

An array of partial [permissions objects](#the-permission-object). `action` and `collection` are required.

### Returns

Returns the [permission objects](#the-permission-object) for the created permissions.

</div>
<div class="right">

### REST API

```
POST /permissions
```

##### Example

```json
// Request

[
	{
		"collection": "pages",
		"action": "read",
		"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7",
		"fields": ["id", "title"]
	},
	{
		"collection": "pages",
		"action": "create",
		"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7",
		"fields": ["id", "title"]
	}
]
```

### GraphQL

```graphql
type Mutation {
	create_permissions_itemss(data: [create_directus_permissions_input!]!): [directus_permissions]
}
```

##### Example

```graphql
mutation {
	create_permissions_items(
		data: [
			{ collection: "pages", action: "read", role: "c86c2761-65d3-43c3-897f-6f74ad6a5bd7", fields: ["id", "title"] }
			{ collection: "pages", action: "create", role: "c86c2761-65d3-43c3-897f-6f74ad6a5bd7", fields: ["id", "title"] }
		]
	) {
		id
		collection
		action
	}
}
```

</div>
</div>

---

## Update Permissions

Update an existing permissions rule.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [permissions object](#the-permission-object).

### Returns

Returns the [permission object](#the-permission-object) for the updated permission.

</div>
<div class="right">

### REST API

```
PATCH /permissions/:id
```

##### Example

```json
// PATCH /permissions/34

{
	"fields": ["id", "title", "body"]
}
```

### GraphQL

```graphql
type Mutation {
	update_permissions_item(id: ID!, data: update_directus_permissions_input!): directus_permissions
}
```

##### Example

```graphql
mutation {
	update_permissions_item(id: 34, data: { fields: ["id", "title", "body"] }) {
		id
		action
		collection
	}
}
```

</div>
</div>

---

## Update Multiple Permissions

Update multiple existing permissions rules.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

### Request Body

<div class="definitions">

`keys` **Required**\
Array of primary keys of the permissions you'd like to update.

`data` **Required**\
Any of [the permission object](#the-permission-object)'s properties.

</div>

### Returns

Returns the [permission object](#the-permission-object) for the updated permissions.

</div>
<div class="right">

### REST API

```
PATCH /permissions
```

##### Example

```json
// PATCH /permissions

{
	"keys": [34, 65],
	"data": {
		"fields": ["id", "title", "body"]
	}
}
```

### GraphQL

```graphql
type Mutation {
	update_permissions_items(id: [ID!]!, data: update_directus_permissions_input!): [directus_permissions]
}
```

##### Example

```graphql
mutation {
	update_permissions_items(ids: [34, 64], data: { fields: ["id", "title", "body"] }) {
		id
		action
		collection
	}
}
```

</div>
</div>

---

## Delete Permissions

Delete an existing permissions rule

<div class="two-up">
<div class="left">

### Returns

Empty body.

</div>
<div class="right">

### REST API

```
DELETE /permissions/:id
```

##### Example

```
DELETE /permissions/34
```

### GraphQL

```graphql
type Mutation {
	delete_permissions_item(id: ID!): delete_one
}
```

##### Example

```graphql
mutation {
	delete_permissions_item(id: 34) {
		id
	}
}
```

</div>
</div>

---

## Delete Multiple Permissions

Delete multiple existing permissions rules

<div class="two-up">
<div class="left">

### Request Body

An array of permission primary keys

### Returns

Empty body.

</div>
<div class="right">

### REST API

```
DELETE /permissions
```

##### Example

```json
// DELETE /permissions

[34, 64]
```

### GraphQL

```graphql
type Mutation {
	delete_permissions_items(ids: [ID!]!): delete_many
}
```

##### Example

```graphql
mutation {
	delete_permissions_items(ids: [34, 64]) {
		ids
	}
}
```

</div>
</div>

---
