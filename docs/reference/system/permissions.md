---
description: REST and GraphQL API documentation on the Permissions collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Permissions

> Permissions are assigned to Roles, and control data access throughout the platform.
> [Learn more about Permissions](/user-guide/overview/glossary#permissions).

## The Permission Object

`id` **uuid**\
Primary key of the permission rule.

`role` **many-to-one**\
Role this permission applies to. Many-to-one to [roles](/reference/system/roles). `null` is used for public permissions.

`collection` **string**\
Collection this permission rule applies to.

`action` **string**\
What CRUD operation this permission rule applies to. One of `create`, `read`, `update`, `delete`.

`permissions` **object**\
What rules the item must pass before the role is allowed to alter it. Follows [the Filter Rules spec](/reference/filter-rules).

`validation` **object**\
What rules the provided values must pass before the role is allowed to submit them for insertion/update. Follows [the Filter Rules spec](/reference/filter-rules).

`presets` **object**\
Additional default values for the role.

`fields` **array**\
What fields the user is allowed to alter.

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
	"fields": ["title", "translations"]
}
```

## List Permissions

List all permissions that exist in Directus.

::: tip Permissions

The data returned in this endpoint will be filtered based on the user's permissions. For example, permissions for a role
other than the current user's role won't be returned.

:::

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /permissions`

`SEARCH /permissions`

If using SEARCH you can provide a [query object](/reference/query) as the body of your request.

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	permissions: directus_permissions
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readPermissions } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readPermissions(query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [permission objects](#the-permission-object). If no items are
available, data will be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /permissions`

`SEARCH /permissions`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	permissions {
		action
		role
		collection
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readPermissions } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readPermissions({
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Retrieve a Permission

List an existing permission by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /permissions/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	permissions_by_id(id: ID!): directus_permissions
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readPermission } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readPermission(permission_id, query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the requested [permission object](#the-permission-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /permissions/34`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	permissions_by_id(id: 34) {
		role
		collection
		action
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readPermission } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readPermission('41', {
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Create a Permission Rule

Create a new permission rule

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /permissions`

Provide a [permission object](#the-permission-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_permissions_item(data: create_directus_permissions_input!): directus_permissions
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createPermission } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createPermission(permission_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [permissions object](#the-permission-object). `action` and `collection` are required.

### Response

Returns the [permission object](#the-permission-object) for the created permission.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /permissions`

```json
{
	"collection": "pages",
	"action": "read",
	"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7",
	"fields": ["id", "title"]
}
```

</template>
<template #graphql>

`POST /graphql/system`

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

</template>
<template #sdk>

```js
import { createDirectus, rest, createPermission } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createPermission({
		role: '39a178f6-d4d6-40e1-b0e7-ec6daaac8747',
		collection: 'articles',
		action: 'delete',
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Create Multiple Permission Rules

Create multiple new permission rules

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /permissions`

Provide an array of [permission objects](#the-permission-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_permissions_items(data: [create_directus_permissions_input!]!): [directus_permissions]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createPermissions } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createPermissions(permission_object_array));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [permissions objects](#the-permission-object). `action` and `collection` are required.

### Response

Returns the [permission objects](#the-permission-object) for the created permissions.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /permissions`

```json
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

</template>
<template #graphql>

`POST /graphql/system`

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

</template>
<template #sdk>

```js
import { createDirectus, rest, createPermissions } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createPermissions([
		{
			role: '39a178f6-d4d6-40e1-b0e7-ec6daaac8747',
			collection: 'articles',
			action: 'delete',
			fields: ['*'],
		},
		{
			role: '39a178f6-d4d6-40e1-b0e7-ec6daaac8747',
			collection: 'articles',
			action: 'update',
			fields: ['*'],
		},
	])
);
```

</template>
</SnippetToggler>

## Update Permissions

Update an existing permissions rule.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /permissions/:id`

Provide a partial [permissions object](#the-permissions-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_permissions_item(id: ID!, data: update_directus_permissions_input!): directus_permissions
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updatePermission } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updatePermission(permission_id, partial_permission_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [permissions object](#the-permission-object).

### Response

Returns the [permission object](#the-permission-object) for the updated permission.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /permissions/34`

```json
{
	"fields": ["id", "title", "body"]
}
```

</template>
<template #graphql>

```graphql
mutation {
	update_permissions_item(id: 34, data: { fields: ["id", "title", "body"] }) {
		id
		action
		collection
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updatePermission } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updatePermission('57', {
		fields: ['title', 'body'],
	})
);
```

</template>
</SnippetToggler>

## Update Multiple Permissions

Update multiple existing permissions rules.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /permissions`

```json
{
	"keys": permission_id_array,
	"data": partial_permission_object
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_permissions_items(id: [ID!]!, data: update_directus_permissions_input!): [directus_permissions]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updatePermissions } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updatePermissions(permission_id_array, permission_object_panel));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the permissions you'd like to update.

`data` **Required**\
Any of [the permission object](#the-permission-object)'s properties.

### Returns

Returns the [permission object](#the-permission-object) for the updated permissions.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /permissions`

```json
{
	"keys": [34, 65],
	"data": {
		"fields": ["id", "title", "body"]
	}
}
```

</template>
<template #graphql>

```graphql
mutation {
	update_permissions_items(ids: [34, 64], data: { fields: ["id", "title", "body"] }) {
		id
		action
		collection
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updatePermissions } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updatePermissions(['56', '57'], {
		fields: ['title', 'body'],
	})
);
```

</template>
</SnippetToggler>

## Delete Permissions

Delete an existing permissions rule

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /permissions/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_permissions_item(id: ID!): delete_one
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deletePermission } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deletePermission(permission_id));
```

</template>
</SnippetToggler>

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /permissions/34`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_permissions_item(id: 34) {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deletePermission } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deletePermissions('56'));
```

</template>
</SnippetToggler>

## Delete Multiple Permissions

Delete multiple existing permissions rules

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /permissions`

Provide an array of permissions IDs as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_permissions_items(ids: [ID!]!): delete_many
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deletePermissions } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deletePermissions(permission_id_array));
```

</template>
</SnippetToggler>

#### Request Body

An array of permission primary keys

### Response

Empty body.

##### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /permissions`

```json
[34, 64]
```

</template>
<template #graphql>

```graphql
mutation {
	delete_permissions_items(ids: [34, 64]) {
		ids
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deletePermissions } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deletePermissions(['56', '57']));
```

</template>
</SnippetToggler>
