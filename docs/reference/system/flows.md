---
description: REST and GraphQL API documentation on the Flows collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Flows

> Flows enable custom, event-driven data processing and task automation within Directus.

## The Flow Object

`id` **uuid**\
Primary key of the flow.

`name` **string**\
Name for the flow.

`icon` **string**\
Icon displayed in the Data Studio for the flow.

`color` **string**\
Color of the icon displayed in the Data Studio for the flow.

`description` **text**\
Short description displayed in the Data Studio.

`status` **string**\
Current status of the flow. One of `active`, `inactive`. Defaults to `active` when not specified.

`trigger` **string**\
Type of trigger for the flow. One of `event`, `webhook`, `operation`, `schedule`, `manual`.

`options` **json**\
Options of the selected trigger for the flow.

`accountability` **string**\
The permission used during the flow. One of `$public`, `$trigger`, `$full`, or UUID of a role.

`date_created` **timestamp**\
Timestamp in ISO8601 when the flow was created.

`user_created` **many-to-one**\
The user who created the flow. Many-to-one to [users](/reference/system/users#the-users-object).

`operation` **string**\
UUID of the operation connected to the trigger in the flow.

```json
{
	"id": "2fab3b9d-0543-4b87-8a30-3c5ee66fedf1",
	"name": "My Flow",
	"icon": "bolt",
	"color": "#112233",
	"description": "Description for my flow",
	"status": "active",
	"trigger": "manual",
	"accountability": "$trigger",
	"date_created": "2022-05-11T13:14:52Z",
	"user_created": "12e62fd0-29c7-4fd3-b3d3-c7a39933e8af",
	"operation": "92e82998-e421-412f-a513-13701e83e4ce"
}
```

## List Flows

List all flows that exist in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /flows`

`SEARCH /flows`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	flows: [directus_flows]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readFlows } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(readFlows(query));
```

</template>
</SnippetToggler>

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [flow objects](#the-flow-object). If no items are available, data will
be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /flows`

`SEARCH /flows`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	flows {
		id
		name
		status
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readFlows } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readFlows({
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Retrieve a flow

List an existing flow by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /flows/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	flows_by_id(id: ID!): directus_flows
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readFlow } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readFlow(flow_id, query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the requested [flow object](#the-flow-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /flows/2fc325fb-299b-4d20-a9e7-a34349dee8b2`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	flows_by_id(id: "2fc325fb-299b-4d20-a9e7-a34349dee8b2") {
		id
		name
		status
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readFlow } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readFlow('4c01419e-0797-4f43-b95e-cbaebd2ac118', {
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Create a Flow

Create a new flow.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /flows`

Provide a [flow object](#the-flow-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_flows_item(data: create_directus_flows_input!): directus_flows
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createFlow } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createFlow(flow_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [flow object](#the-flow-object).

### Response

Returns the [flow object](#the-flow-object) for the created flow.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /flows`

```json
{
	"name": "My Flow",
	"status": "active",
	"trigger": "manual"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_flows_item(data: { name: "My Flow", status: "active", trigger: "manual" }) {
		id
		name
		status
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createFlow } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createFlow({
		name: 'Email on article published',
		trigger: 'operation',
	})
);
```

</template>
</SnippetToggler>

## Create Multiple Flows

Create multiple new flows.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /flows`

Provide an array of [flow objects](#the-flow-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_flows_items(data: [create_directus_flows_input!]!): [directus_flows]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createFlows } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createFlows(flow_object_array));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [flow objects](#the-flow-object).

### Response

Returns the [flow object](#the-flow-object) for the created flow.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /flows`

```json
[
	{
		"name": "My Flow",
		"status": "active",
		"trigger": "manual"
	},
	{
		"name": "Another Flow",
		"status": "active",
		"trigger": "webhook"
	}
]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_flows_items(
		data: [
			{ name: "My Flow", status: "active", trigger: "manual" }
			{ name: "Another Flow", status: "active", trigger: "webhook" }
		]
	) {
		id
		name
		status
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createFlows } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createFlows([
		{
			name: 'Email on article published',
			trigger: 'operation',
		},
		{
			name: 'Archive articles after 12 months',
			trigger: 'schedule',
		},
	])
);
```

</template>
</SnippetToggler>

## Update a Flow

Update an existing flow.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /flows/:id`

Provide a partial [flow object](#the-flow-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_flows_item(id: ID!, data: update_directus_flows_input): directus_flows
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateFlow } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateFlow(flow_id, partial_flow_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [flow object](#the-flow-object).

### Response

Returns the [flow object](#the-flow-object) for the updated flow.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /flows/2fc325fb-299b-4d20-a9e7-a34349dee8b2`

```json
{
	"name": "My Updated Flow"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_flows_item(id: "2fc325fb-299b-4d20-a9e7-a34349dee8b2", data: { name: "My Updated Flow" }) {
		id
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateFlow } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateFlow('53e623bd-cbeb-405d-8201-158af7e3ac83', {
		status: 'inactive',
	})
);
```

</template>
</SnippetToggler>

## Update Multiple Flows

Update multiple existing flows.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /flows`

```json
{
	"keys": flow_id_array,
	"data": partial_flow_object
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_flows_items(ids: [ID!]!, data: update_directus_flows_input): [directus_flows]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateFlows } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateFlows(flow_id_array, partial_flow_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the flows you'd like to update.

`data` **Required**\
Any of [the flow object](#the-flow-object)'s properties.

### Response

Returns the [flow objects](#the-flow-object) for the updated flows.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /flows`

```json
{
	"keys": ["3f2facab-7f05-4ee8-a7a3-d8b9c634a1fc", "7259bfa8-3786-45c6-8c08-cc688e7ba229"],
	"data": {
		"status": "inactive"
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_flows_items(
		ids: ["3f2facab-7f05-4ee8-a7a3-d8b9c634a1fc", "7259bfa8-3786-45c6-8c08-cc688e7ba229"]
		data: { status: "inactive" }
	) {
		id
		name
		status
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateFlows } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateFlows(['53e623bd-cbeb-405d-8201-158af7e3ac83', '0ae04fb7-0f4e-4b5d-be2b-a166c4ee16e4'], {
		status: 'inactive',
	})
);
```

</template>
</SnippetToggler>

## Delete a Flow

Delete an existing flow.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /flows/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_flows_item(id: ID!): delete_one
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteFlow } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteFlow(flow_id));
```

</template>
</SnippetToggler>

#### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /flows/12204ee2-2c82-4d9a-b044-2f4842a11dba`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_flows_item(id: "12204ee2-2c82-4d9a-b044-2f4842a11dba") {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteFlow } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteFlow('53e623bd-cbeb-405d-8201-158af7e3ac83'));
```

</template>
</SnippetToggler>

## Delete Multiple Flows

Delete multiple existing flows.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /flows`

Provide an array of flow IDs as your request body.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_flows_items(ids: [ID!]!): delete_many
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteFlows } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteFlows(flow_id_array));
```

</template>
</SnippetToggler>

#### Request Body

An array of flows primary keys

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /flows`

```json
["25821236-8c2a-4f89-8fdc-c7d01f35877d", "02b9486e-4273-4fd5-b94b-e18fd923d1ed", "7d62f1e9-a83f-407b-84f8-1c184f014501"]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_flows_items(
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
import { createDirectus, rest, deleteFlows } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	deleteFlows(['53e623bd-cbeb-405d-8201-158af7e3ac83', '0ae04fb7-0f4e-4b5d-be2b-a166c4ee16e4'])
);
```

</template>
</SnippetToggler>

## Flow with GET webhook trigger

Start a flow with GET webhook trigger.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /flows/trigger/:flow_uuid`

</template>
<template #sdk>

```js
import { createDirectus, rest, triggerFlow } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(triggerFlow('GET', flow_id, query_object));
```

</template>
</SnippetToggler>

### Response

Result of the flow, if any.

### Example

<SnippetToggler :choices="['REST', 'SDK']" group="api">
<template #rest>

`GET /flows/trigger/202a940b-a00b-47df-b832-369c53f13122`

</template>
<template #sdk>

```js
import { createDirectus, rest, triggerFlow } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	triggerFlow('GET', '90a0fdd5-e760-4b4c-ac22-c14d48d44f26', {
		fields: '*',
	})
);
```

</template>
</SnippetToggler>

## Flow with POST webhook trigger

Start a flow with POST webhook trigger.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /flows/trigger/:flow_uuid`

</template>
<template #sdk>

```js
import { createDirectus, rest, triggerFlow } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(triggerFlow('POST', flow_id, webhook_payload));
```

</template>
</SnippetToggler>

#### Request Body

Payload for the POST request.

### Response

Result of the flow, if any.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /flows/trigger/202a940b-a00b-47df-b832-369c53f13122`

```json
// Payload here
```

</template>
<template #sdk>

```js
import { createDirectus, rest, triggerFlow } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	triggerFlow('POST', '90a0fdd5-e760-4b4c-ac22-c14d48d44f26', {
		title: 'Created with flows and webhooks',
	})
);
```

</template>
</SnippetToggler>
