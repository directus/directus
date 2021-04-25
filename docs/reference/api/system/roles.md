---
pageClass: page-reference
---

# Roles

<div class="two-up">
<div class="left">

> Roles define a specific set of access permissions, and are the primary organizational structure for Users within the
> platform. [Learn more about Roles](/concepts/roles/).

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## The Role Object

<div class="two-up">
<div class="left">
<div class="definitions">

`id` **uuid**\
Primary key of the role.

`name` **string**\
Name of the role.

`icon` **string**\
Icon for the role. Displayed in the Admin App.

`description` **string**\
Description for the role. Displayed in the Admin App.

`ip_access` **csv**\
CSV of IP addresses that have access to this role. Allows you to configure an allowlist of IP addresses.

`enforce_tfa` **boolean**\
Whether or not Two-Factor Authentication is required for users in this role.

`module_list` **object**\
Override for the module listing in the left most sidebar of the Admin App.

`collection_list` **object**\
Override for the collection listing in the navigation of the collections module in the Admin App.

`admin_access` **boolean**\
If this role is considered an admin role. This means that users in this role have full permissions to everything.

`app_access` **boolean**\
Whether or not users in this role have access to use the Admin App.

`users` **one-to-many**\
The users in this role. One-to-many to [users](/reference/api/system/users/).

</div>
</div>
<div class="right">

```json
{
	"id": "653925a9-970e-487a-bfc0-ab6c96affcdc",
	"name": "Admin",
	"icon": "supervised_user_circle",
	"description": null,
	"ip_access": null,
	"enforce_tfa": false,
	"module_list": null,
	"collection_list": null,
	"admin_access": true,
	"app_access": true,
	"users": ["0bc7b36a-9ba9-4ce0-83f0-0a526f354e07"]
}
```

</div>
</div>

---

## List Roles

List all roles that exist in Directus.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

An array of up to [limit](/reference/api/query/#limit) [role objects](#the-role-object). If no items are available, data
will be an empty array.

</div>
<div class="right">

### REST API

```
GET /roles
SEARCH /roles
```

[Learn more about SEARCH ->](/reference/api/introduction/#search-http-method)

### GraphQL

```graphql
type Query {
	roles: [directus_roles]
}
```

##### Example

```graphql
query {
	roles {
		id
		name
		users {
			email
		}
	}
}
```

</div>
</div>

---

## Retrieve a Role

List an existing role by primary key.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

Returns the requested [role object](#the-role-object).

</div>
<div class="right">

### REST API

```
GET /roles/:id
```

##### Example

```
GET /roles/b4cb3b64-8580-4ad9-a099-eade6da24302
```

### GraphQL

```graphql
type Query {
	roles_by_id(id: ID!): directus_roles
}
```

##### Example

```graphql
query {
	roles_by_id(id: 2) {
		id
		name
		users {
			email
		}
	}
}
```

</div>
</div>

---

## Create a Role

Create a new role.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [role object](#the-role-object).

### Returns

Returns the [role object](#the-role-object) for the created role.

</div>
<div class="right">

### REST API

```
POST /roles
```

##### Example

```json
// POST /roles

{
	"name": "Interns",
	"icon": "verified_user",
	"description": null,
	"admin_access": false,
	"app_access": true
}
```

### GraphQL

```graphql
type Mutation {
	create_roles_item(data: create_directus_roles_input!): directus_roles
}
```

##### Example

```graphql
mutation {
	create_roles_item(
		data: { name: "Interns", icon: "verified_user", description: null, admin_access: false, app_access: true }
	) {
		id
		name
		users {
			email
		}
	}
}
```

</div>
</div>

---

## Create Multiple Roles

Create multiple new roles.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

An array of partial [role objects](#the-role-object).

### Returns

Returns the [role objects](#the-role-object) for the created roles.

</div>
<div class="right">

### REST API

```
POST /roles
```

##### Example

```json
// POST /roles

[
	{
		"name": "Interns",
		"icon": "verified_user",
		"description": null,
		"admin_access": false,
		"app_access": true
	},
	{
		"name": "Customers",
		"icon": "person",
		"description": null,
		"admin_access": false,
		"app_access": false
	}
]
```

### GraphQL

```graphql
type Mutation {
	create_roles_items(data: [create_directus_roles_input!]!): [directus_roles]
}
```

##### Example

```graphql
mutation {
	create_roles_items(
		data: [
			{ name: "Interns", icon: "verified_user", description: null, admin_access: false, app_access: true }
			{ name: "Customers", icon: "person", description: null, admin_access: false, app_access: false }
		]
	) {
		id
		name
		users {
			email
		}
	}
}
```

</div>
</div>

---

## Update a Role

Update an existing role.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [role object](#the-role-object).

### Returns

Returns the [role object](#the-role-object) for the updated role.

</div>
<div class="right">

### REST API

```
PATCH /roles/:id
```

##### Example

```json
// PATCH /roles/c86c2761-65d3-43c3-897f-6f74ad6a5bd7

{
	"icon": "attractions"
}
```

### GraphQL

```graphql
type Mutation {
	update_roles_item(id: ID!, data: update_directus_roles_input): directus_roles
}
```

##### Example

```graphql
mutation {
	update_roles_item(id: "c86c2761-65d3-43c3-897f-6f74ad6a5bd7", data: { icon: "attractions" }) {
		id
		name
		users {
			email
		}
	}
}
```

</div>
</div>

---

## Update Multiple Roles

Update multiple existing roles.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

<div class="definitions">

`keys` **Required**\
Array of primary keys of the roles you'd like to update.

`data` **Required**\
Any of [the role object](#the-role-object)'s properties.

</div>

### Returns

Returns the [role objects](#the-role-object) for the updated roles.

</div>
<div class="right">

### REST API

```
PATCH /roles
```

##### Example

```json
// PATCH /roles

{
	"keys": ["c86c2761-65d3-43c3-897f-6f74ad6a5bd7", "6fc3d5d3-a37b-4da8-a2f4-ed62ad5abe03"],
	"data": {
		"icon": "attractions"
	}
}
```

### GraphQL

```graphql
type Mutation {
	update_roles_items(ids: [ID!]!, data: update_directus_roles_input): [directus_roles]
}
```

##### Example

```graphql
mutation {
	update_roles_items(
		ids: ["c86c2761-65d3-43c3-897f-6f74ad6a5bd7", "6fc3d5d3-a37b-4da8-a2f4-ed62ad5abe03"]
		data: { icon: "attractions" }
	) {
		id
		name
		users {
			email
		}
	}
}
```

</div>
</div>

---

## Delete a Role

Delete an existing role.

<div class="two-up">
<div class="left">

### Returns

Empty body.

</div>
<div class="right">

### REST API

```
DELETE /roles/:id
```

##### Example

```
DELETE /roles/c86c2761-65d3-43c3-897f-6f74ad6a5bd7
```

### GraphQL

```graphql
type Mutation {
	delete_roles_item(id: ID!): delete_one
}
```

##### Example

```graphql
mutation {
	delete_roles_item(id: "c86c2761-65d3-43c3-897f-6f74ad6a5bd7") {
		id
	}
}
```

</div>
</div>

---

## Delete Multiple Roles

Delete multiple existing roles.

<div class="two-up">
<div class="left">

### Request Body

An array of role primary keys

### Returns

Empty body.

</div>
<div class="right">

### REST API

```
DELETE /roles
```

##### Example

```json
// DELETE /roles
["653925a9-970e-487a-bfc0-ab6c96affcdc", "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"]
```

### GraphQL

```graphql
type Mutation {
	delete_roles_items(ids: [ID!]!): delete_many
}
```

##### Example

```graphql
mutation {
	delete_roles_items(ids: ["653925a9-970e-487a-bfc0-ab6c96affcdc", "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"]) {
		ids
	}
}
```

</div>
</div>

---
