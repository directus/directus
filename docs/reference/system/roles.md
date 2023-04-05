---
description: REST and GraphQL API documentation on the Roles collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Roles

> Roles define a specific set of access permissions, and are the primary organizational structure for Users within the
> platform. [Learn more about Roles](/getting-started/glossary#roles).

---

## The Role Object

`id` **uuid**\
Primary key of the role.

`name` **string**\
Name of the role.

`icon` **string**\
Icon for the role. Displayed in the Admin App.

`description` **string**\
Description for the role. Displayed in the Admin App.

`ip_access` **csv**\
A CSV of IP addresses that have access to this role. Allows you to configure an allowlist of IP addresses.

`enforce_tfa` **boolean**\
Whether or not Two-Factor Authentication is required for users in this role.

`admin_access` **boolean**\
If this role is considered an admin role. This means that users in this role have full permissions to everything.

`app_access` **boolean**\
Whether or not users in this role have access to use the Admin App.

`users` **one-to-many**\
The users in this role. One-to-many to [users](/reference/system/users).

```json
{
	"id": "653925a9-970e-487a-bfc0-ab6c96affcdc",
	"name": "Admin",
	"icon": "supervised_user_circle",
	"description": null,
	"ip_access": null,
	"enforce_tfa": false,
	"admin_access": true,
	"app_access": true,
	"users": ["0bc7b36a-9ba9-4ce0-83f0-0a526f354e07"]
}
```

---

## List Roles

List all roles that exist in Directus.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

An array of up to [limit](/reference/query#limit) [role objects](#the-role-object). If no items are available, data will
be an empty array.

### REST API

```
GET /roles
SEARCH /roles
```

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

### GraphQL

```
POST /graphql/system
```

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

---

## Retrieve a Role

List an existing role by primary key.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

Returns the requested [role object](#the-role-object).

### REST API

```
GET /roles/:id
```

##### Example

```
GET /roles/b4cb3b64-8580-4ad9-a099-eade6da24302
```

### GraphQL

```
POST /graphql/system
```

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

---

## Create a Role

Create a new role.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [role object](#the-role-object).

### Returns

Returns the [role object](#the-role-object) for the created role.

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

```
POST /graphql/system
```

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

---

## Create Multiple Roles

Create multiple new roles.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

An array of partial [role objects](#the-role-object).

### Returns

Returns the [role objects](#the-role-object) for the created roles.

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

```
POST /graphql/system
```

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

---

## Update a Role

Update an existing role.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [role object](#the-role-object).

### Returns

Returns the [role object](#the-role-object) for the updated role.

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

```
POST /graphql/system
```

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

---

## Update Multiple Roles

Update multiple existing roles.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

`keys` **Required**\
Array of primary keys of the roles you'd like to update.

`data` **Required**\
Any of [the role object](#the-role-object)'s properties.

### Returns

Returns the [role objects](#the-role-object) for the updated roles.

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

```
POST /graphql/system
```

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

---

## Delete a Role

Delete an existing role.

### Returns

Empty body.

### REST API

```
DELETE /roles/:id
```

##### Example

```
DELETE /roles/c86c2761-65d3-43c3-897f-6f74ad6a5bd7
```

### GraphQL

```
POST /graphql/system
```

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

---

## Delete Multiple Roles

Delete multiple existing roles.

### Request Body

An array of role primary keys

### Returns

Empty body.

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

```
POST /graphql/system
```

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

---
