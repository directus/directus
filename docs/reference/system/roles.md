---
description: REST and GraphQL API documentation on the Roles collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Roles

> Roles define a specific set of access permissions, and are the primary organizational structure for Users within the
> platform. [Learn more about Roles](/user-guide/overview/glossary#roles).

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

## List Roles

List all roles that exist in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`GET /roles`

`SEARCH /roles` </template>

<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	roles: [directus_roles]
}
```

</template>
</SnippetToggler>

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [role objects](#the-role-object). If no items are available, data will
be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`GET /roles`

`SEARCH /roles` </template>

<template #graphql>

`POST /graphql/system`

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

</template>
</SnippetToggler>

## Retrieve a Role

List an existing role by primary key.

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`GET /roles/:id` </template>

<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	roles_by_id(id: ID!): directus_roles
}
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the requested [role object](#the-role-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`GET /roles/b4cb3b64-8580-4ad9-a099-eade6da24302` </template>

<template #graphql>

`POST /graphql/system`

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

</template>
</SnippetToggler>

## Create a Role

Create a new role.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /roles`

```json
{
	"role_object_field_1": "value_1",
	"role_object_field_2": "value_2",
	"role_object_field_3": value_3,
	"role_object_field_4": value_4,
	"role_object_field_5": value_5,
}
```

</template>

<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_roles_item(data: create_directus_roles_input!): directus_roles
}
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [role object](#the-role-object).

### Response

Returns the [role object](#the-role-object) for the created role.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /roles`

```json
{
	"name": "Interns",
	"icon": "verified_user",
	"description": null,
	"admin_access": false,
	"app_access": true
}
```

</template>

<template #graphql>

`POST /graphql/system`

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

</template>
</SnippetToggler>

## Create Multiple Roles

Create multiple new roles.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /roles`

```json
[
{
	"role_object_1_field_1": "value_1",
	"role_object_1_field_2": "value_2",
	"role_object_1_field_3": value_3,
	"role_object_1_field_4": value_4,
	"role_object_1_field_5": value_5,
},
{
	"role_object_2_field_1": "value_6",
	"role_object_2_field_2": "value_7",
	"role_object_2_field_3": value_8,
	"role_object_2_field_4": value_9,
	"role_object_2_field_5": value_10,
},
]
```

</template>

<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_roles_items(data: [create_directus_roles_input!]!): [directus_roles]
}
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [role objects](#the-role-object).

### Response

Returns the [role objects](#the-role-object) for the created roles.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /roles`

```json

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

</template>

<template #graphql>

`POST /graphql/system`

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

</template>
</SnippetToggler>

## Update a Role

Update an existing role.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`PATCH /roles/:id`

```json
{
	"roles_object_field": "value_1"
}
```

</template>

<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_roles_item(id: ID!, data: update_directus_roles_input): directus_roles
}
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [role object](#the-role-object).

### Response

Returns the [role object](#the-role-object) for the updated role.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`PATCH /roles/c86c2761-65d3-43c3-897f-6f74ad6a5bd7`

```json
{
	"icon": "attractions"
}
```

</template>

<template #graphql>

`POST /graphql/system`

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

</template>
</SnippetToggler>

## Update Multiple Roles

Update multiple existing roles.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`PATCH /roles`

```json
{
	"keys": ["role_1_key", "role_2_key"],
	"data": {
		"role_object_field": "value_1"
	}
}
```

</template>

<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
    update_roles_items(ids: [ID!]!, data: update_directus_roles_input): [directus_roles]
}
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the roles you'd like to update.

`data` **Required**\
Any of [the role object](#the-role-object)'s properties.

### Response

Returns the [role objects](#the-role-object) for the updated roles.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`PATCH /roles`

```json
{
	"keys": ["c86c2761-65d3-43c3-897f-6f74ad6a5bd7", "6fc3d5d3-a37b-4da8-a2f4-ed62ad5abe03"],
	"data": {
		"icon": "attractions"
	}
}
```

</template>

<template #graphql>

`POST /graphql/system`

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

</template>
</SnippetToggler>

## Delete a Role

Delete an existing role.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`DELETE /roles/:id` </template>

<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_roles_item(id: ID!): delete_one
}
```

</template>
</SnippetToggler>

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`DELETE /roles/c86c2761-65d3-43c3-897f-6f74ad6a5bd7` </template>

<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_roles_item(id: "c86c2761-65d3-43c3-897f-6f74ad6a5bd7") {
		id
	}
}
```

</template>
</SnippetToggler>

## Delete Multiple Roles

Delete multiple existing roles.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`DELETE /roles`

```json
["role_1_key", "role_2_key"]
```

</template>

<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_roles_items(ids: [ID!]!): delete_many
}
```

</template>
</SnippetToggler>

#### Request Body

An array of role primary keys

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`DELETE /roles`

```json
["653925a9-970e-487a-bfc0-ab6c96affcdc", "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"]
```

</template>

<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_roles_items(ids: ["653925a9-970e-487a-bfc0-ab6c96affcdc", "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"]) {
		ids
	}
}
```

</template>
</SnippetToggler>
