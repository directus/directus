---
description: REST and GraphQL API documentation on the Dashboards collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Dashboards

> Dashboards within the Insights module organize different Panels into an at-a-glance view. They can be used to group
> data based on department, objective, business process or anything you choose.
> [Learn more about Dashboards](/user-guide/insights/dashboards).

---

## The Dashboard Object

`id` **uuid**\
Primary key of the dashboard.

`name` **string**\
Name of the dashboard.

`icon` **string**\
Material icon for dashboard.

`note` **string**\
Descriptive text about the dashboard.

`date_created` **Date**\
When the dashboard was created

`user_created` **many-to-one**\
User that created the dashboard. Many-to-one to [users](/reference/system/users).

`color` **string**\
Accent color for the dashboard.

`panels` **one-to-many**\
Panels that are in this dashboard. One-to-may to [panels](/reference/system/panels).

```json
{
	"id": "a79bd1b2-beb2-49fc-8a26-0b3eec0e2697",
	"name": "My Dashboard",
	"icon": "dashboard",
	"note": "Test",
	"date_created": "2023-01-05T19:03:15.051Z",
	"user_created": "fd066644-c8e5-499d-947b-fe6c6e1a1473",
	"color": "#6644FF",
	"panels": ["22640672-eef0-4ee9-ab04-591f3afb2883"]
}
```

---

## List Dashboards

List all dashboards that exist in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`GET /dashboards`

`SEARCH /dashboards`

</template>

<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	dashboards: [directus_dashboards]
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, readDashboards} from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(
    readDashboards({
        fields : ['*']
    })
)

console.log(result);
```
</template>
</SnippetToggler>

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [dashboard objects](#the-dashboard-object). If no items are available,
data will be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`GET /dashboards`

`SEARCH /dashboards`

</template>

<template #graphql>

`POST /graphql/system`
```graphql
query {
	dashboards {
		id
		name
	}
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, readDashboards} from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(
    readDashboards({
        fields : ['*']
    })
)

console.log(result);
```
</template>
</SnippetToggler>

---

## Retrieve a Dashboard

List an existing dashboard by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`GET /dashboards/:id`

</template>

<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	dashboards_by_id(id: ID!): directus_dashboards
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, readDashboard} from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(
    readDashboard('dashboard_id', {
        fields : ['*']
    })
)

console.log(result);
```
</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the requested [dashboard object](#the-dashboard-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`GET /dashboards/2fc325fb-299b-4d20-a9e7-a34349dee8b2`
</template>

<template #graphql>

```graphql
query {
	dashboards_by_id(id: "2fc325fb-299b-4d20-a9e7-a34349dee8b2") {
		id
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, readDashboard} from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(
    readDashboard('751a81de-9e00-4ffe-a2c1-6e04619b859f', {
        fields : ['*']
    })
)

console.log(result);
```
</template>
</SnippetToggler>

---

## Create a Dashboard

Create a new dashboard.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /dashboards`
```json

{
	"dashboard_field": "value_1",
	"dashboard_field": "value_2"
}
```
</template>

<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_dashboards_item(data: create_directus_dashboards_input!): directus_dashboards
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, createDashboard} from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(
    createDashboard(
        {
            'dashboard_field' : 'value_1',
            'dashboard_field' : 'value_2'
        }
    )
)

console.log(result);
```
</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [dashboard object](#the-dashboard-object).

### Response

Returns the [dashboard object](#the-dashboard-object) for the created dashboard.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /dashboards`
```json
{
	"name": "My Dashboard",
	"icon": "dashboard"
}
```
</template>

<template #graphql>

`POST /graphql/system`
```graphql
mutation {
	create_dashboards_item(data: { name: "My Dashboard", icon: "dashboards" }) {
		id
		name
	}
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, createDashboard} from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(
    createDashboard(
        {
            'name' : 'User Retention',
            'note' : 'Some insights on our users activity'
        }
    )
)

console.log(result);
```
</template>
</SnippetToggler>

---

## Create Multiple Dashboards

Create multiple new dashboards.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`// POST /dashboards`
```json
[
	{
		"dashboard_1_object_field": "value_1",
		"dashboard_1_object_field": "value_2"
	},
	{
		"dashboard_2_object_field": "value_3",
		"dashboard_2_object_field": "value_4",
	}
]
```
</template>

<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_dashboards_items(data: [create_directus_dashboards_input!]!): [directus_dashboards]
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, createDashboards} from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(
    createDashboards(
    [
        {
            'dashboard_1_field' : 'value_1',
            'dashboard_1_field' : 'value_2'
        },
        {
            'dashboard_2_field' : 'value_3',
            'dashboard_2_field' : 'value_4'
        }
    ])
)

console.log(result);
```
</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [dashboard objects](#the-dashboard-object).

### Response

Returns the [dashboard object](#the-dashboard-object) for the created dashboard.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`// POST /dashboards`
```json
[
	{
		"name": "My Dashboard",
		"icon": "dashboard"
	},
	{
		"name": "Another Dashboard",
		"icon": "person"
	}
]
```
</template>

<template #graphql>

`POST /graphql/system`
```graphql
mutation {
	create_dashboards_items(
		data: [{ name: "My Dashboard", icon: "dashboard" }, { name: "Another Dashboard", icon: "person" }]
	) {
		id
		name
	}
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, createDashboards} from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(
    createDashboards(
    [
        {
            'name' : 'User Retention',
            'note' : 'Some insights on our users activity'
        },
        {
            'name' : 'Publishing report',
            'note' : 'Some charts to track our outputs'
        }
    ])
)

console.log(result);
```
</template>
</SnippetToggler>

---

## Update a Dashboard

Update an existing dashboard.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`PATCH /dashboards/:id`
```json
{
	"dashboard_object_field": "value_1"
}
```
</template>

<template #graphql>

`POST /graphql/system`
```graphql
type Mutation {
	update_dashboards_item(id: ID!, data: update_directus_dashboards_input): directus_dashboards
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, updateDashboard} from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(
    updateDashboard('dashboard_id',{
        'dashboard_field' : 'value'
    })
)

console.log(result);
```
</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [dashboard object](#the-dashboard-object).

### Response

Returns the [dashboard object](#the-dashboard-object) for the updated dashboard.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`PATCH /dashboards/2fc325fb-299b-4d20-a9e7-a34349dee8b2`
```json
{
	"name": "My Updated Dashboard"
}
```
</template>

<template #graphql>

`POST /graphql/system`
```graphql
mutation {
	update_dashboards_item(id: "2fc325fb-299b-4d20-a9e7-a34349dee8b2", data: { name: "My Updated Dashboard" }) {
		id
		name
	}
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, updateDashboard} from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(
    updateDashboard('cfcc3702-33bd-4616-865c-99b59dc1cdc9',{
        'color' : '#6644FF'
    })
)

console.log(result);
```
</template>
</SnippetToggler>

---

## Update Multiple Dashboards

Update multiple existing dashboards.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`PATCH /dashboards`
```json
{
	"keys": ["dashboard_key_1", "dashboard_key_2"],
	"data": {
		"dashboard_object_field": "value_1"
	}
}
```
</template>

<template #graphql>

`POST /graphql/system`
```graphql
type Mutation {
	update_dashboards_items(ids: [ID!]!, data: update_directus_dashboards_input): [directus_dashboards]
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, updatedDashboards} from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(
    updatedDashboards(['dashboard_2_id','dashboard_2_id'],{
        'dashboard_field' : 'value'
    })
)

console.log(result);
```
</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the dashboards you'd like to update.

`data` **Required**\
Any of [the dashboard](#the-dashboard-object)'s properties.

### Response

Returns the [dashboard objects](#the-dashboard-object) for the updated dashboards.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`PATCH /dashboards`
```json

{
	"keys": ["3f2facab-7f05-4ee8-a7a3-d8b9c634a1fc", "7259bfa8-3786-45c6-8c08-cc688e7ba229"],
	"data": {
		"color": "#6644FF"
	}
}
```

</template>

<template #graphql>

`POST /graphql/system`
```graphql
mutation {
	update_dashboards_items(
		ids: ["3f2facab-7f05-4ee8-a7a3-d8b9c634a1fc", "7259bfa8-3786-45c6-8c08-cc688e7ba229"]
		data: { color: "#6644FF" }
	) {
		id
		name
	}
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, updatedDashboards} from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(
    updatedDashboards(['cfcc3702-33bd-4616-865c-99b59dc1cdc9','782c80a0-ad61-488d-b9e2-7d688f029421'],{
        'color' : '#81D4FA'
    })
)

console.log(result);
```
</template>
</SnippetToggler>

---

## Delete a Dashboard

Delete an existing dashboard.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`DELETE /dashboards/:id`

</template>

<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_dashboards_item(id: ID!): delete_one
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, deleteDashboard} from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(deleteDashboard('dashboard_id'))

console.log(result);
```
</template>
</SnippetToggler>

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`DELETE /dashboards/12204ee2-2c82-4d9a-b044-2f4842a11dba`

</template>

<template #graphql>

`POST /graphql/system`
```graphql
mutation {
	delete_dashboards_item(id: "12204ee2-2c82-4d9a-b044-2f4842a11dba") {
		id
	}
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, deleteDashboard} from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(deleteDashboard('cfcc3702-33bd-4616-865c-99b59dc1cdc9'))

console.log(result);
```
</template>
</SnippetToggler>

---

## Delete Multiple Dashboards

Delete multiple existing dashboards.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`DELETE /dashboards`
```json
["dashboard_key_1", "dashboard_key_2", "dashboard_key_3"]
```
</template>

<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_dashboards_items(ids: [ID!]!): delete_many
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, deleteDashboards} from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(
    deleteDashboards(
        [
        'dashboard_id',
        'dashboard_id'
        ]
    )
)

console.log(result);
```
</template>
</SnippetToggler>

#### Request Body

An array of dashboards primary keys

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`DELETE /dashboards`
```json
["25821236-8c2a-4f89-8fdc-c7d01f35877d", "02b9486e-4273-4fd5-b94b-e18fd923d1ed", "7d62f1e9-a83f-407b-84f8-1c184f014501"]
```
</template>

<template #graphql>

`POST /graphql/system`
```graphql
mutation {
	delete_dashboards_items(
		ids: [
			"25821236-8c2a-4f89-8fdc-c7d01f35877d"
			"02b9486e-4273-4fd5-b94b-e18fd923d1ed"
			"7d62f1e9-a83f-407b-84f8-1c184f014501"
		]
	) {
		ids
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, deleteDashboards} from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(
    deleteDashboards(
        [
        '751a81de-9e00-4ffe-a2c1-6e04619b859f',
        '782c80a0-ad61-488d-b9e2-7d688f029421'
        ]
    )
)

console.log(result);
```
</template>
</SnippetToggler>