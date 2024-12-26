---
description: REST and GraphQL API documentation on the Policies collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Policies

> Policies define a specific set of access permissions, and are a composable unit that can be assigned to both roles and
> users. [Learn more about Policies](/user-guide/overview/glossary#policies).

## The Policy Object

`id` **uuid**\
Primary key of the policy.

`name` **string**\
Name of the policy.

`icon` **string**\
Icon for the policy. Displayed in the Data Studio.

`description` **string**\
Description for the policy. Displayed in the Data Studio.

`ip_access` **csv**\
A CSV of IP addresses that this policy applies to. Allows you to configure an allowlist of IP addresses. If empty, no IP
restrictions are applied.

`enforce_tfa` **boolean**\
Whether or not Two-Factor Authentication is required for users that have this policy.

`admin_access` **boolean**\
If this policy grants the user admin access. This means that users with this policy have full permissions to everything.

`app_access` **boolean**\
Whether or not users with this policy have access to use the Data Studio.

`users` **many-to-many**\
The users this policy is assigned to directly, this does not include users which receive this policy through a role. It expects
and returns data from the `directus_access` collection. [Many-to-many](/app/data-model/relationships#many-to-many-m2m) to
[users](/reference/system/users) via the `directus_access` junction collection.

`roles` **many-to-many**\
The roles this policy is assigned to. It expects and returns data from the `directus_access` collection. [Many-to-many](/app/data-model/relationships#many-to-many-m2m)
to [roles](/reference/system/roles) via the `directus_access` junction collection.

`permissions` **one-to-many**\
The permissions assigned to this policy. One-to-many to [permissions](/reference/system/permissions).

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
	"users": ["0bc7b36a-9ba9-4ce0-83f0-0a526f354e07"],
	"roles": ["8b4474c0-288d-4bb8-b62e-8330646bb6aa"],
	"permissions": ["5c74c86f-cab0-4b14-a3c4-cd4f2363e826"]
}
```

## List Policies

List all policies that exist in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /policies`

`SEARCH /policies`

If using SEARCH you can provide a [query object](/reference/query) as the body of your request.

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	policies: [directus_policies]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readPolicies } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readPolicies(query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [policy objects](#the-policy-object). If no items are available, data
will be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /policies`

`SEARCH /policies`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	policies {
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
import { createDirectus, rest, readPolicies } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readPolicies({
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Retrieve a Policy

List an existing policy by primary key.

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /policies/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	policies_by_id(id: ID!): directus_policies
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readPolicy } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readPolicy(policy_id, query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the requested [policy object](#the-policy-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /policies/b4cb3b64-8580-4ad9-a099-eade6da24302`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	policies_by_id(id: 2) {
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
import { createDirectus, rest, readPolicy } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readPolicy('39a178f6-d4d6-40e1-b0e7-ec6daaac8747', {
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Create a Policy

Create a new policy.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /policies`

Provide a [policy object](#the-policy-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_policies_item(data: create_directus_policies_input!): directus_policies
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createPolicy } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createPolicy(policy_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [policy object](#the-policy-object).

### Response

Returns the [policy object](#the-policy-object) for the created policy.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /policies`

```json
{
	"name": "Intern Policy",
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
	create_policies_item(
		data: { name: "Intern Policy", icon: "verified_user", description: null, admin_access: false, app_access: true }
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
import { createDirectus, rest, createPolicy } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createPolicy({
		name: 'Intern Policy',
		icon: 'verified_user',
		description: null,
		admin_access: false,
		app_access: true,
	})
);
```

</template>
</SnippetToggler>

## Create Multiple Policies

Create multiple new policies.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /policies`

Provide an array of [policy objects](#the-policy-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_policies_items(data: [create_directus_policies_input!]!): [directus_policies]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createPolicies } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createPolicies(policy_object_array));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [policy objects](#the-policy-object).

### Response

Returns the [policy objects](#the-policy-object) for the created policies.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /policies`

```json
[
	{
		"name": "Intern Access",
		"icon": "verified_user",
		"description": null,
		"admin_access": false,
		"app_access": true
	},
	{
		"name": "Customer Access",
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
	create_policies_items(
		data: [
			{ name: "Intern Access", icon: "verified_user", description: null, admin_access: false, app_access: true }
			{ name: "Customer Access", icon: "person", description: null, admin_access: false, app_access: false }
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
import { createDirectus, rest, createPolicies } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createPolicies([
		{
			name: 'Intern Access',
			icon: 'verified_user',
			description: null,
			admin_access: false,
			app_access: true,
		},
		{
			name: 'Customer Access',
			icon: 'person',
			description: null,
			admin_access: false,
			app_access: false,
		},
	])
);
```

</template>
</SnippetToggler>

## Update a Policy

Update an existing policy.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /policies/:id`

Provide a partial [policy object](#the-policy-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_policies_item(id: ID!, data: update_directus_policies_input): directus_policies
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updatePolicy } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updatePolicy(policy_id, partial_policy_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [policy object](#the-policy-object).

### Response

Returns the [policy object](#the-policy-object) for the updated policy.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /policies/c86c2761-65d3-43c3-897f-6f74ad6a5bd7`

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
	update_policies_item(id: "c86c2761-65d3-43c3-897f-6f74ad6a5bd7", data: { icon: "attractions" }) {
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
import { createDirectus, rest, updatePolicy } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updatePolicy('a262a7f6-9ed4-423d-8cd2-3ee3b2d2a658', {
		admin_access: true,
	})
);
```

</template>
</SnippetToggler>

## Update Multiple Policies

Update multiple existing policies.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /policies`

```json
{
	"keys": policy_id_array,
	"data": partial_policy_object
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_policies_items(ids: [ID!]!, data: update_directus_policies_input): [directus_policies]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updatePolicies } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updatePolicies(policy_id_array, partial_policy_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the policies you'd like to update.

`data` **Required**\
Any of [the policy object](#the-policy-object)'s properties.

### Response

Returns the [policy objects](#the-policy-object) for the updated policies.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /policies`

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
	update_policies_items(
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
import { createDirectus, rest, updatePolicies } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updatePolicies(['a262a7f6-9ed4-423d-8cd2-3ee3b2d2a658', '1792dc2c-6142-4723-ae40-698d082ddc5e'], {
		admin_access: true,
	})
);
```

</template>
</SnippetToggler>

## Delete a Policy

Delete an existing policy.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /policies/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_policies_item(id: ID!): delete_one
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deletePolicy } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deletePolicy(policy_id));
```

</template>
</SnippetToggler>

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /policies/c86c2761-65d3-43c3-897f-6f74ad6a5bd7`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_policies_item(id: "c86c2761-65d3-43c3-897f-6f74ad6a5bd7") {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deletePolicy } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deletePolicy('1792dc2c-6142-4723-ae40-698d082ddc5e'));
```

</template>
</SnippetToggler>

## Delete Multiple Policies

Delete multiple existing policies.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /policies`

Provide an array of policy IDs as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_policies_items(ids: [ID!]!): delete_many
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deletePolicies } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deletePolicies(policy_id_array));
```

</template>
</SnippetToggler>

#### Request Body

An array of policy primary keys

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /policies`

```json
["653925a9-970e-487a-bfc0-ab6c96affcdc", "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_policies_items(ids: ["653925a9-970e-487a-bfc0-ab6c96affcdc", "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"]) {
		ids
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deletePolicies } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	deletePolicies(['a262a7f6-9ed4-423d-8cd2-3ee3b2d2a658', '1792dc2c-6142-4723-ae40-698d082ddc5e'])
);
```

</template>
</SnippetToggler>
