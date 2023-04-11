---
description: REST and GraphQL API documentation on the Flows collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Flows

> Flows enable custom, event-driven data processing and task automation within Directus.

---

## The Flow Object

`id` **uuid**\
Primary key of the flow.

`name` **string**\
Name for the flow.

`icon` **string**\
Icon displayed in the Admin App for the flow.

`color` **string**\
Color of the icon displayed in the Admin App for the flow.

`note` **text**\
Short description displayed in the Admin App.

`status` **string**\
Current status of the flow. One of `active`, `inactive`. Defaults to `active` when not specified.

`trigger` **string**\
Type of trigger for the flow. One of `hook`, `webhook`, `operation`, `schedule`, `manual`.

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
	"note": "Note for my flow",
	"status": "active",
	"trigger": "manual",
	"accountability": "$trigger",
	"date_created": "2022-05-11T13:14:52Z",
	"user_created": "12e62fd0-29c7-4fd3-b3d3-c7a39933e8af",
	"operation": "92e82998-e421-412f-a513-13701e83e4ce"
}
```

---

## List Flows

List all flows that exist in Directus.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

An array of up to [limit](/reference/query#limit) [flow objects](#the-flow-object). If no items are available, data will
be an empty array.

### REST API

```
GET /flows
SEARCH /flows
```

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	flows: [directus_flows]
}
```

##### Example

```graphql
query {
	flows {
		id
		name
		status
	}
}
```

---

## Retrieve a flow

List an existing flow by primary key.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

Returns the requested [flow object](#the-flow-object).

### REST API

```
GET /flows/:id
```

##### Example

```
GET /flows/2fc325fb-299b-4d20-a9e7-a34349dee8b2
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	flows_by_id(id: ID!): directus_flows
}
```

##### Example

```graphql
query {
	flows_by_id(id: "2fc325fb-299b-4d20-a9e7-a34349dee8b2") {
		id
		name
		status
	}
}
```

---

## Create a Flow

Create a new flow.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [flow object](#the-flow-object).

### Returns

Returns the [flow object](#the-flow-object) for the created flow.

### REST API

```
POST /flows
```

##### Example

```json
// POST /flows

{
	"name": "My Flow",
	"status": "active",
	"trigger": "manual"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	create_flows_item(data: create_directus_flows_input!): directus_flows
}
```

##### Example

```graphql
mutation {
	create_flows_item(data: { name: "My Flow", status: "active", trigger: "manual" }) {
		id
		name
		status
	}
}
```

---

## Create Multiple Flows

Create multiple new flows.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

An array of partial [flow objects](#the-flow-object).

### Returns

Returns the [flow object](#the-flow-object) for the created flow.

### REST API

```
POST /flows
```

##### Example

```json
// POST /flows

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

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	create_flows_items(data: [create_directus_flows_input!]!): [directus_flows]
}
```

##### Example

```graphql
mutation {
	create_flows_items(
		data: [
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
	) {
		id
		name
		status
	}
}
```

---

## Update a Flow

Update an existing flow.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [flow object](#the-flow-object).

### Returns

Returns the [flow object](#the-flow-object) for the updated flow.

### REST API

```
PATCH /flows/:id
```

##### Example

```json
// PATCH /flows/2fc325fb-299b-4d20-a9e7-a34349dee8b2

{
	"name": "My Updated Flow"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_flows_item(id: ID!, data: update_directus_flows_input): directus_flows
}
```

##### Example

```graphql
mutation {
	update_flows_item(id: "2fc325fb-299b-4d20-a9e7-a34349dee8b2", data: { name: "My Updated Flow" }) {
		id
		name
	}
}
```

---

## Update Multiple Flows

Update multiple existing flows.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

`keys` **Required**\
Array of primary keys of the flows you'd like to update.

`data` **Required**\
Any of [the flow object](#the-flow-object)'s properties.

### Returns

Returns the [flow objects](#the-flow-object) for the updated flows.

### REST API

```
PATCH /flows
```

##### Example

```json
// PATCH /flows

{
	"keys": ["3f2facab-7f05-4ee8-a7a3-d8b9c634a1fc", "7259bfa8-3786-45c6-8c08-cc688e7ba229"],
	"data": {
		"status": "inactive"
	}
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_flows_items(ids: [ID!]!, data: update_directus_flows_input): [directus_flows]
}
```

##### Example

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

---

## Delete a Flow

Delete an existing flow.

### Returns

Empty body.

### REST API

```
DELETE /flows/:id
```

##### Example

```
DELETE /flows/12204ee2-2c82-4d9a-b044-2f4842a11dba
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_flows_item(id: ID!): delete_one
}
```

##### Example

```graphql
mutation {
	delete_flows_item(id: "12204ee2-2c82-4d9a-b044-2f4842a11dba") {
		id
	}
}
```

---

## Delete Multiple Flows

Delete multiple existing flows.

### Request Body

An array of flows primary keys

### Returns

Empty body.

### REST API

```
DELETE /flows
```

##### Example

```json
// DELETE /flows
["25821236-8c2a-4f89-8fdc-c7d01f35877d", "02b9486e-4273-4fd5-b94b-e18fd923d1ed", "7d62f1e9-a83f-407b-84f8-1c184f014501"]
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_flows_items(ids: [ID!]!): delete_many
}
```

##### Example

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

## Flow with GET webhook trigger

Start a flow with GET webhook trigger.

### Returns

Result of the flow, if any.

### REST API

```
GET /flows/trigger/:flow_uuid
```

##### Example

```json
// GET /flows/trigger/202a940b-a00b-47df-b832-369c53f13122
// Payload here
```

## Flow with POST webhook trigger

Start a flow with POST webhook trigger.

### Request Body

Payload for the POST request.

### Returns

Result of the flow, if any.

### REST API

```
POST /flows/trigger/:flow_uuid
```

##### Example

```json
// POST /flows/trigger/202a940b-a00b-47df-b832-369c53f13122
// Payload here
```
