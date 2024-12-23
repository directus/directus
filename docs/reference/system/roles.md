---
description: REST and GraphQL API documentation on the Roles collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Roles

> Roles are the primary organizational structure for Users within the platform.
> [Learn more about Roles](/user-guide/overview/glossary#roles).

## The Role Object

`id` **uuid**\
Primary key of the role.

`name` **string**\
Name of the role.

`icon` **string**\
Icon for the role. Displayed in the Data Studio.

`description` **string**\
Description for the role. Displayed in the Data Studio.

`users` **one-to-many**\
The users in this role. One-to-many to [users](/reference/system/users).

`policies` **many-to-many**\
The policies in this role. Many-to-many to [policies](/reference/system/policies).

`parent` **many-to-one**\
The parent for this role. Many-to-one to roles.

`children` **one-to-many**\
The roles in this role. One-to-many to roles.

```json
{
	"id": "653925a9-970e-487a-bfc0-ab6c96affcdc",
	"name": "Admin",
	"icon": "supervised_user_circle",
	"description": null,
	"policies": ["3a4b131d-34f8-46e8-b128-5212aa9b7f72"],
	"parent": "7fdbad2a-890d-4d8a-ad1d-97ff86bc254d",
	"children": ["1d5cba05-2d9e-47a2-9594-e00b55ffdb3e"],
	"users": ["0bc7b36a-9ba9-4ce0-83f0-0a526f354e07"]
}
```

## List Roles

List all roles that exist in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /roles`

`SEARCH /roles`

If using SEARCH you can provide a [query object](/reference/query) as the body of your request.

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	roles: [directus_roles]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readRoles } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readRoles(query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [role objects](#the-role-object). If no items are available, data will
be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /roles`

`SEARCH /roles`

</template>
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
<template #sdk>

```js
import { createDirectus, rest, readRoles } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readRoles({
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Retrieve a Role

List an existing role by primary key.

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /roles/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	roles_by_id(id: ID!): directus_roles
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readRole } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readRole(role_id, query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the requested [role object](#the-role-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /roles/b4cb3b64-8580-4ad9-a099-eade6da24302`

</template>
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
<template #sdk>

```js
import { createDirectus, rest, readRole } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readRole('39a178f6-d4d6-40e1-b0e7-ec6daaac8747', {
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Create a Role

Create a new role.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /roles`

Provide a [role object](#the-role-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_roles_item(data: create_directus_roles_input!): directus_roles
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createRole } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createRole(role_object));
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

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /roles`

```json
{
	"name": "Interns",
	"icon": "verified_user",
	"description": null
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_roles_item(
		data: { name: "Interns", icon: "verified_user", description: null }
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
<template #sdk>

```js
import { createDirectus, rest, createRole } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createRole({
		name: 'Interns',
		icon: 'verified_user',
		description: null
	})
);
```

</template>
</SnippetToggler>

## Create Multiple Roles

Create multiple new roles.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /roles`

Provide an array of [role objects](#the-role-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_roles_items(data: [create_directus_roles_input!]!): [directus_roles]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createRoles } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createRoles(role_object_array));
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

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /roles`

```json
[
	{
		"name": "Interns",
		"icon": "verified_user",
		"description": null
	},
	{
		"name": "Customers",
		"icon": "person",
		"description": null
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
			{ name: "Interns", icon: "verified_user", description: null }
			{ name: "Customers", icon: "person", description: null }
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
<template #sdk>

```js
import { createDirectus, rest, createRoles } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createRoles([
		{
			name: 'Interns',
			icon: 'verified_user',
			description: null
		},
		{
			name: 'Customers',
			icon: 'person',
			description: null
		},
	])
);
```

</template>
</SnippetToggler>

## Update a Role

Update an existing role.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /roles/:id`

Provide a partial [role object](#the-role-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_roles_item(id: ID!, data: update_directus_roles_input): directus_roles
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateRole } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateRole(role_id, partial_role_object));
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

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
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
<template #sdk>

```js
import { createDirectus, rest, updateRole } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateRole('a262a7f6-9ed4-423d-8cd2-3ee3b2d2a658', {
		icon: "attractions",
	})
);
```

</template>
</SnippetToggler>

## Update Multiple Roles

Update multiple existing roles.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /roles`

```json
{
	"keys": role_id_array,
	"data": partial_role_object
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
<template #sdk>

```js
import { createDirectus, rest, updateRoles } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateRoles(role_id_array, partial_role_object));
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

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
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
<template #sdk>

```js
import { createDirectus, rest, updateRoles } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateRoles(['a262a7f6-9ed4-423d-8cd2-3ee3b2d2a658', '1792dc2c-6142-4723-ae40-698d082ddc5e'], {
		icon: "attractions"
	})
);
```

</template>
</SnippetToggler>

## Delete a Role

Delete an existing role.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /roles/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_roles_item(id: ID!): delete_one
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteRole } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteRole(role_id));
```

</template>
</SnippetToggler>

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /roles/c86c2761-65d3-43c3-897f-6f74ad6a5bd7`

</template>
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
<template #sdk>

```js
import { createDirectus, rest, deleteRole } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteRole('1792dc2c-6142-4723-ae40-698d082ddc5e'));
```

</template>
</SnippetToggler>

## Delete Multiple Roles

Delete multiple existing roles.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /roles`

Provide an array of role IDs as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_roles_items(ids: [ID!]!): delete_many
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteRoles } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteRoles(role_id_array));
```

</template>
</SnippetToggler>

#### Request Body

An array of role primary keys

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
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
<template #sdk>

```js
import { createDirectus, rest, deleteRoles } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	deleteRoles(['a262a7f6-9ed4-423d-8cd2-3ee3b2d2a658', '1792dc2c-6142-4723-ae40-698d082ddc5e'])
);
```

</template>
</SnippetToggler>
