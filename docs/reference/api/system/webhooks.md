---
pageClass: page-reference
---

# Webhooks

<div class="two-up">
<div class="left">

> Webhooks are configured within the App (no code required) and send HTTP requests to an external service when a
> specific event is triggered.

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## The Webhook Object

<div class="two-up">
<div class="left">
<div class="definitions">

`id` **integer**\
Primary key of the webhook.

`name` **string**\
Name for the webhook. Shown in the Admin App.

`method` **string**\
HTTP method to use. One of `GET`, `POST`.

`url` **string**\
Where to send the request too.

`status` **string**\
Status of the webhook. One of `active`, `inactive`.

`data` **boolean**\
Whether or not to send the event data to the external endpoint.

`actions` **csv**\
When to fire the webhook. Can contain `create`, `update`, `delete`.

`collections` **csv**\
What collections to fire this webhook on.

</div>
</div>
<div class="right">

```json
{
	"data": {
		"id": 1,
		"name": "Build Website",
		"method": "POST",
		"url": "https://example.com/",
		"status": "active",
		"data": true,
		"actions": ["create", "update"],
		"collections": ["articles"]
	}
}
```

</div>
</div>

---

## List Webhooks

List all webhooks that exist in Directus.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

An array of up to [limit](/reference/api/query/#limit) [webhook objects](#the-webhook-object). If no items are
available, data will be an empty array.

</div>
<div class="right">

### REST API

```
GET /webhooks
SEARCH /webhooks
```

[Learn more about SEARCH ->](/reference/api/introduction/#search-http-method)

### GraphQL

```graphql
type Query {
	webhooks: [directus_webhooks]
}
```

##### Example

```graphql
query {
	webhooks {
		url
		method
	}
}
```

</div>
</div>

---

## Retrieve a Webhook

List an existing webhook by primary key.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

Returns the requested [webhook object](#the-webhook-object).

</div>
<div class="right">

### REST API

```
GET /webhooks/:id
```

### GraphQL

```graphql
type Query {
	webhooks_by_id(id: ID!): directus_webhooks
}
```

##### Examples

```graphql
query {
	webhooks_by_id(id: 15) {
		url
		actions
		method
	}
}
```

</div>
</div>

---

## Create a Webhook

Create a new webhook.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [webhook object](#the-webhook-object).

`name`, `actions`, `collections`, and `url` are required.

### Returns

Returns the [webhook object](#the-webhook-object) for the created webhook.

</div>
<div class="right">

### REST API

```
POST /webhooks
```

##### Example

```json
// POST /webhooks

{
	"name": "Example",
	"actions": ["create", "update"],
	"collections": ["articles"],
	"url": "https://example.com"
}
```

### GraphQL

```graphql
type Mutation {
	create_webhooks_item(data: create_directus_webhooks_input!): directus_webhooks
}
```

##### Example

```graphql
mutation {
	create_webhooks_item(
		data: { name: "Example", actions: ["create", "update"], collections: ["articles"], url: "https://example.com" }
	) {
		id
		name
	}
}
```

</div>
</div>

---

## Create Multiple Webhook

Create multiple new webhooks.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

An array of partial [webhook object](#the-webhook-object).

`name`, `actions`, `collections`, and `url` are required.

### Returns

Returns the [webhook objects](#the-webhook-object) for the created webhooks.

</div>
<div class="right">

### REST API

```
POST /webhooks
```

##### Example

```json
// POST /webhooks

[
	{
		"name": "Example",
		"actions": ["create", "update"],
		"collections": ["articles"],
		"url": "https://example.com"
	},
	{
		"name": "Second Example",
		"actions": ["delete"],
		"collections": ["articles"],
		"url": "https://example.com/on-delete"
	}
]
```

### GraphQL

```graphql
type Mutation {
	create_webhooks_items(data: [create_directus_webhooks_input!]!): [directus_webhooks]
}
```

##### Example

```graphql
mutation {
	create_webhooks_items(
		data: [
			{ name: "Example", actions: ["create", "update"], collections: ["articles"], url: "https://example.com" }
			{ name: "Second Example", actions: ["delete"], collections: ["articles"], url: "https://example.com/on-delete" }
		]
	) {
		id
		name
	}
}
```

</div>
</div>

---

## Update a Webhook

Update an existing webhook.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [webhook object](#the-webhook-object).

### Returns

Returns the [webhook object](#the-webhook-object) for the updated webhook.

</div>
<div class="right">

### REST API

```
PATCH /webhooks/:id
```

##### Example

```json
// PATCH /webhooks/15

{
	"name": "Build Website"
}
```

### GraphQL

```graphql
type Mutation {
	update_webhooks_item(id: ID!, data: update_directus_webhooks_input!): directus_webhooks
}
```

##### Example

```graphql
mutation {
	update_webhooks_item(id: 15, data: { name: "Build Website" }) {
		name
	}
}
```

</div>
</div>

---

## Update Multiple Webhooks

Update multiple existing webhooks.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

<div class="definitions">

`keys` **Required**\
Array of primary keys of the webhooks you'd like to update.

`data` **Required**\
Any of [the webhook object](#the-webhook-object)'s properties.

</div>

### Returns

Returns the [webhook objects](#the-webhook-object) for the updated webhooks.

</div>
<div class="right">

### REST API

```
PATCH /webhooks
```

##### Example

```json
// PATCH /webhooks

{
	"keys": [15, 41],
	"data": {
		"name": "Build Website"
	}
}
```

### GraphQL

```graphql
type Mutation {
	update_webhooks_items(ids: [ID!]!, data: update_directus_webhooks_input!): [directus_webhooks]
}
```

##### Example

```graphql
mutation {
	update_webhooks_items(ids: [15, 41], data: { name: "Build Website" }) {
		name
	}
}
```

</div>
</div>

---

## Delete a Webhook

Delete an existing webhook.

<div class="two-up">
<div class="left">

### Returns

Empty body.

</div>
<div class="right">

### REST API

```
DELETE /webhooks/:id
```

##### Example

```
DELETE /webhooks/15
```

### GraphQL

```graphql
type Mutation {
	delete_webhooks_item(id: ID!): delete_one
}
```

##### Example

```graphql
mutation {
	delete_webhooks_item(id: 15) {
		id
	}
}
```

</div>
</div>

---

## Delete Multiple Webhooks

Delete multiple existing webhooks.

<div class="two-up">
<div class="left">

### Request Body

An array of webhook primary keys

### Returns

Empty body.

</div>
<div class="right">

### REST API

```
DELETE /webhooks
```

##### Example

```json
// DELETE /webhooks

[2, 15, 41]
```

### GraphQL

```graphql
type Mutation {
	delete_webhooks_items(ids: [ID!]!): delete_many
}
```

##### Example

```graphql
mutation {
	delete_webhooks_items(ids: [2, 15, 41]) {
		ids
	}
}
```

</div>
</div>

---
