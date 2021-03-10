---
pageClass: page-reference
---

# Webhooks

<div class="two-up">
<div class="left">

Ping external service endpoints on events happening in Directus.

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

### `GET /webhooks`

```json
// Response

{
	"data": [
		{
			"id": 1,
			"name": "Build Website",
			"method": "POST",
			"url": "https://example.com/",
			"status": "active",
			"data": true,
			"actions": ["create", "update"],
			"collections": ["articles"]
		},
		{...},
		{...}
	]
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

### `GET /webhooks/:id`

```json
// Response

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

## Create a Webhook

Create one or more new webhook(s).

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [webhook object](#the-webhook-object) or an array of partial [webhook objects](#the-webhook-object).

`name`, `actions`, `collections`, and `url` are required.

### Returns

Returns the [webhook object(s)](#the-webhook-object) for the created webhook(s).

</div>
<div class="right">

### `POST /webhooks`

```json
// Request

{
	"name": "Example",
	"actions": ["create", "update"],
	"collections": ["articles"],
	"url": "https://example.com"
}
```

```json
// Response

{
	"data": {
		"id": 3,
		"name": "Example",
		"method": "POST",
		"url": "https://example.com",
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

## Update a Webhook

Update an existing webhook.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [webhook object](#the-webhook-object).

### Returns

Returns the [webhook object](#the-webhook-object) for the created webhook.

</div>
<div class="right">

### `PATCH /webhooks/:id`

```json
// Request

{
	"name": "Build Website"
}
```

```json
// Response

{
	"data": {
		"id": 3,
		"name": "Build Website",
		"method": "POST",
		"url": "https://example.com",
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

## Delete a Webhook

Delete an existing webhook.

<div class="two-up">
<div class="left">

### Returns

Empty body.

</div>
<div class="right">

### `DELETE /webhooks/:id`

```json
// Empty Response
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

### `DELETE /webhooks`

```json
// Request
[2, 15, 41]
```

```json
// Empty Response
```

</div>
</div>

---
