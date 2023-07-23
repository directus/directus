---
description: REST and GraphQL API documentation on the Operations collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Operations

> Operations are the building blocks of Data Flows within Directus.

## The Operation Object

`id` **uuid**\
Primary key of the operation.

`name` **string**\
Name for the operation.

`key` **string**\
Key for the operation. Must be unique within a given flow.

`type` **string**\
Type of operation. One of `log`, `mail`, `notification`, `create`, `read`, `request`, `sleep`, `transform`, `trigger`, `condition`,
or any type of custom operation extensions.

`options` **json**\
Options depending on the type of the operation.

`position_x` **integer**\
Position of the operation on the X axis within the flow workspace.

`position_y` **integer**\
Position of the operation on the Y axis within the flow workspace.

`date_created` **timestamp**\
Timestamp in ISO8601 when the operation was created.

`user_created` **many-to-one**\
The user who created the operation. Many-to-one to [users](/reference/system/users#the-users-object).

`resolve` **uuid**\
The operation triggered when the current operation succeeds (or `then` logic of a condition operation). Primary key of an
[operation](#the-operation-object).

`reject` **uuid**\
The operation triggered when the current operation fails (or `otherwise` logic of a condition operation). Primary key of
an [operation](#the-operation-object).

`flow` **many-to-one**\
The flow containing this operation. Many-to-one to [flows](/reference/system/flows#the-flow-object).

```json
{
	"id": "585b04cd-2821-4dcc-a563-ae5d29ecace2",
	"name": "Log a Message",
	"key": "log_message",
	"type": "log",
	"position_x": 12,
	"position_y": 24,
	"date_created": "2022-05-11T13:14:52Z",
	"user_created": "12e62fd0-29c7-4fd3-b3d3-c7a39933e8af",
	"resolve": "bf4099c0-c54c-4736-ab4e-95e2487595e4",
	"reject": null,
	"flow": "22544db5-93f7-48e2-a028-7ae02c8fe49a"
}
```

## List Operations

List all operations that exist in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /operations`

`SEARCH /operations`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	operations: [directus_operations]
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, readOperations } from '@directus/sdk/rest';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(
	readOperations({
		query,
	})
);

console.log(result);
```

</template>
</SnippetToggler>

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [operation objects](#the-operation-object). If no items are available,
data will be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /operations`

`SEARCH /operations`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	operations {
		id
		name
		key
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, readOperations } from '@directus/sdk/rest';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readOperations({
		fields: ['*'],
	})
);

console.log(result);
```

</template>

</SnippetToggler>

## Retrieve an operation

List an existing operation by primary key.

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /operations/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	operations_by_id(id: ID!): directus_operations
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, readOperation } from '@directus/sdk/rest';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(
	readOperation('operation_id', {
		query,
	})
);

console.log(result);
```

</template>

</SnippetToggler>

### Request

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the requested [operation object](#the-operation-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`GET /operations/3c636d1c-4eb2-49cd-8a6d-3ec571ab3390`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	operations_by_id(id: 42) {
		id
		name
		key
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, readOperation } from '@directus/sdk/rest';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readOperation('0691f58d-ed72-40ea-81b4-81c0f1e83262', {
		fields: ['*'],
	})
);

console.log(result);
```

</template>

</SnippetToggler>

## Create an Operation

Create a new operation.

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /operations`

```json
{
	"operations_field_1": "value_1",
	"operations_field_2": "value_2",
	"operations_field_3": "value_3"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_operations_item(data: create_directus_operations_input!): directus_operations
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, createOperation } from '@directus/sdk/rest';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(
	createOperation({
		key: 'operation_key',
		type: 'operation_log',
		position_x: 'operation_x_pos',
		position_y: 'operation_y_pos',
		flow: '9flow_id',
	})
);

console.log(result);
```

</template>
</SnippetToggler>

### Request

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [operation object](#the-operation-object).

### Response

Returns the [operation object](#the-operation-object) for the created operation.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /operations`

```json
{
	"name": "My Log",
	"key": "my_log",
	"type": "log"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_operations_item(data: { name: "My Log", key: "my_log", type: "log" }) {
		id
		name
		key
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, createOperation } from '@directus/sdk/rest';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createOperation({
		key: 'my_log',
		type: 'log',
		position_x: '25',
		position_y: '25',
		flow: '90a0fdd5-e760-4b4c-ac22-c14d48d44f26',
	})
);

console.log(result);
```

</template>

</SnippetToggler>

## Create Multiple Operations

Create multiple new operations.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /operations`

```json
[
	{
		"operations_1_field_1": "value_1",
		"operations_1_field_2": "value_2",
		"operations_1_field_3": "value_3"
	},
	{
		"operations_2_field_1": "value_4",
		"operations_2_field_2": "value_5",
		"operations_2_field_3": "value_6"
	}
]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_operations_items(data: [create_directus_operations_input!]!): [directus_operations]
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, createOperations } from '@directus/sdk/rest';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createOperations([
		{
			key: 'operation_key',
			type: 'operation_log',
			position_x: 'operation_x_pos',
			position_y: 'operation_y_pos',
			flow: 'flow_id',
		},
		{
			key: 'operation_2_key',
			type: 'operation_2_log',
			position_x: 'operation_2_x_pos',
			position_y: 'operation_2_y_pos',
			flow: 'flow_id',
		},
	])
);

console.log(result);
```

</template>

</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [operation objects](#the-operation-object).

### Response

Returns the [operation object](#the-operation-object) for the created operation.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`POST /operations`

```json
[
	{
		"name": "My Log",
		"key": "my_log",
		"type": "log"
	},
	{
		"name": "Send Notification",
		"key": "send_notification",
		"type": "notification"
	}
]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_operations_items(
		data: [
			{ name: "My Log", key: "my_log", type: "log" }
			{ name: "Send Notification", key: "send_notification", type: "notification" }
		]
	) {
		id
		name
		key
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, createOperations } from '@directus/sdk/rest';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createOperations([
		{
			key: 'my_log',
			type: 'log',
			position_x: '40',
			position_y: '40',
			flow: '90a0fdd5-e760-4b4c-ac22-c14d48d44f26',
		},
		{
			key: 'my_other_log',
			type: 'log',
			position_x: '20',
			position_y: '40',
			flow: '90a0fdd5-e760-4b4c-ac22-c14d48d44f26',
		},
	])
);

console.log(result);
```

</template>

</SnippetToggler>

## Update an Operation

Update an existing operation.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`PATCH /operation/:id`

```json
{
	"operation_object_field": "value_1"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_operations_item(id: ID!, data: update_directus_operations_input): directus_operations
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, updateOperation } from '@directus/sdk/rest';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(
	updateOperation('operation_id', {
		operation_field: 'value',
	})
);

console.log(result);
```

</template>

</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [operation object](#the-operation-object).

### Response

Returns the [operation object](#the-operation-object) for the updated operation.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`PATCH /operation/7d62f1e9-a83f-407b-84f8-1c184f014501`

```json
{
	"name": "My Updated Operation"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_operations_item(id: "7d62f1e9-a83f-407b-84f8-1c184f014501", data: { name: "My Updated Operation" }) {
		id
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, updateOperation } from '@directus/sdk/rest';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateOperation('4b220e51-5e2b-48b5-a988-0a6451624d0c', {
		position_x: '5',
	})
);

console.log(result);
```

</template>

</SnippetToggler>

## Update Multiple Operations

Update multiple existing operations.

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`PATCH /operations`

```json
{
	"keys": ["operation_1_key", "operation_2_key"],
	"data": {
		"operation_object_field": "value_1"
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_operations_items(ids: [ID!]!, data: update_directus_operations_input): [directus_operations]
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, updateOperations } from '@directus/sdk/rest';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(
	updateOperations(['operation_1_id', 'operation_2_id'], {
		field: 'value',
	})
);

console.log(result);
```

</template>

</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the operations you'd like to update.

`data` **Required**\
Any of [the operation object](#the-operation-object)'s properties.

### Response

Returns the [operation objects](#the-operation-object) for the updated operations.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`PATCH /operations`

```json
{
	"keys": ["6a25fb7c-26a4-4dcb-a474-d47b6a203a38", "07ac467e-1900-4c62-9637-8dac2ab97f71"],
	"data": {
		"name": "Updated Operations"
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_operations_items(
		ids: ["6a25fb7c-26a4-4dcb-a474-d47b6a203a38", "07ac467e-1900-4c62-9637-8dac2ab97f71"]
		data: { name: "Updated Operations" }
	) {
		id
		name
		key
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, updateOperations } from '@directus/sdk/rest';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateOperations(['263b18e6-7297-4a9f-af88-15af7317d4ef', '4b220e51-5e2b-48b5-a988-0a6451624d0c'], {
		position_y: '50',
	})
);

console.log(result);
```

</template>

</SnippetToggler>

## Delete an Operation

Delete an existing operation.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`DELETE /operations/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_operations_item(id: ID!): delete_one
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, deleteOperation } from '@directus/sdk/rest';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteOperation('operation_id'));

console.log(result);
```

</template>
</SnippetToggler>

### Returns

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`DELETE /operations/07ac467e-1900-4c62-9637-8dac2ab97f71`

</template>
<template #graphql>

```graphql
mutation {
	delete_operations_item(id: "07ac467e-1900-4c62-9637-8dac2ab97f71") {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, deleteOperation } from '@directus/sdk/rest';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteOperation('263b18e6-7297-4a9f-af88-15af7317d4ef'));

console.log(result);
```

</template>

</SnippetToggler>

## Delete Multiple Operations

Delete multiple existing operations.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`DELETE /operations`

```json
["operation_1_id", "operation_2_id", "operation_2_id"]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_operations_items(ids: [ID!]!): delete_many
}
```

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, deleteOperations } from '@directus/sdk/rest';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(
	deleteOperations(['263b18e6-7297-4a9f-af88-15af7317d4ef', '4b220e51-5e2b-48b5-a988-0a6451624d0c'])
);

console.log(result);
```

</template>
</SnippetToggler>

#### Request Body

An array of operations primary keys

### Returns

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

`DELETE /operations`

```json
["a791ce73-41a2-4fb7-8f67-c7ba176cc719", "4e57ab0e-f4ec-47b5-9dad-e36f08a25642", "5fe0a6f6-18ad-4bb3-94c6-2e033246c784"]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_operations_items(
		ids: [
			"a791ce73-41a2-4fb7-8f67-c7ba176cc719"
			"4e57ab0e-f4ec-47b5-9dad-e36f08a25642"
			"5fe0a6f6-18ad-4bb3-94c6-2e033246c784"
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
import { rest, deleteOperations } from '@directus/sdk/rest';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	deleteOperations(['263b18e6-7297-4a9f-af88-15af7317d4ef', '4b220e51-5e2b-48b5-a988-0a6451624d0c'])
);

console.log(result);
```

</template>

</SnippetToggler>

## Triggering an operation

Trigger an operation based on primary key.

### Request

<SnippetToggler :choices="['REST', 'SDK']" label="API">
<template #rest>

`POST /operations/trigger/:operation_uuid`

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, triggerOperation } from '@directus/sdk/rest';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(
	triggerOperation('operation_id', {
		// Payload
	})
);

console.log(result);
```

</template>

</SnippetToggler>

#### Request Body

Payload for the operation, if needed.

### Returns

Result of the operation, if any.

### Example

<SnippetToggler :choices="['REST', 'SDK']" label="API">
<template #rest>

`// POST /flows/trigger/202a940b-a00b-47df-b832-369c53f13122` `// Payload here`

</template>
<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, triggerOperation } from '@directus/sdk/rest';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	triggerOperation('0691f58d-ed72-40ea-81b4-81c0f1e83262', {
		// Payload
	})
);

console.log(result);
```

</template>

</SnippetToggler>
