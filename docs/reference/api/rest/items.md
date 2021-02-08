---
pageClass: page-reference
---

# Items

<div class="two-up">
<div class="left">

> Items are individual pieces of data in your database. They can be anything, from articles, to IoT status checks. [Learn more about Items](/concepts/items/).

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## The Item Object

<div class="two-up">
<div class="left">

Items don't have a pre-defined schema. The format depends completely on how you configured your collections and fields
in Directus. For the sake of documentation, we'll use a fictional articles collection with the following fields: `id`,
`status`, `title`, `body`, `featured_image`, and `author`.

</div>
<div class="right">

```json
{
	"id": 1,
	"status": "published",
	"title": "Hello, world!",
	"body": "This is my first article",
	"featured_image": "768eabec-3c54-4110-a6bb-64b548116661",
	"author": "0bc7b36a-9ba9-4ce0-83f0-0a526f354e07"
}
```

</div>
</div>

---

## List Items

List all items that exist in Directus.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

::: tip Nested Data

The [Field Parameter](/reference/api/query/#fields) is required to return nested relational data!

:::

### Returns

An array of up to [limit](/reference/api/query/#limit) [item objects](#the-item-object). If no items are available, data
will be an empty array.

#### Singleton

If your collection is a singleton, this endpoint will return the item.

</div>
<div class="right">

```
GET /items
```

```json
// Response

{
	"data": [
		{
			"id": 1,
			"status": "published",
			"title": "Hello, world!",
			"body": "This is my first article",
			"featured_image": "768eabec-3c54-4110-a6bb-64b548116661",
			"author": "0bc7b36a-9ba9-4ce0-83f0-0a526f354e07"
		},
		{...},
		{...}
	]
}
```

</div>
</div>

---

## Retrieve an Item

Get an item that exists in Directus.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

Returns a [item object](#the-item-object) if a valid primary key was provided.

</div>
<div class="right">

```
GET /items/:id
```

```json
// Response

{
	"data": {
		"id": 1,
		"status": "published",
		"title": "Hello, world!",
		"body": "This is my first article",
		"featured_image": "768eabec-3c54-4110-a6bb-64b548116661",
		"author": "0bc7b36a-9ba9-4ce0-83f0-0a526f354e07"
	}
}
```

</div>
</div>

---

## Create an Item

Create one or more new item(s).

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [item object](#the-item-object) or an array of partial [item objects](#the-item-object).

### Returns

Returns the [item object](#the-item-object) of the item that was created.

</div>
<div class="right">

```
POST /items
```

```json
// Request

{
	"title": "Hello again, world!",
	"body": "This is our second article"
}
```

```json
// Response

{
	"data": {
		"id": 2,
		"status": "draft",
		"title": "Hello, world!",
		"body": "This is my first article",
		"featured_image": null,
		"author": null
	}
}
```

</div>
</div>

---

## Update an Item

Update an existing item.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [item object](#the-item-object).

### Returns

Returns the [item object](#the-item-object) of the item that was updated.

</div>
<div class="right">

```
PATCH /items/:id
```

```json
// Request

{
	"author": "d97c2e0e-293d-4eb5-9e1c-27d3460ad29d"
}
```

```json
// Response

{
	"data": {
		"id": 2,
		"status": "draft",
		"title": "Hello, world!",
		"body": "This is my first article",
		"featured_image": null,
		"author": "d97c2e0e-293d-4eb5-9e1c-27d3460ad29d"
	}
}
```

</div>
</div>

---

## Update Multiple Items

Update multiple items at the same time.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

There's two ways to update items: Update multiple items to _different_ values, or to update multiple items to _the same_
values.

#### Different Values

Post an array of (partial) [item objects](#the-item-object). Make sure to include `id` for every object in the array in
order for Directus to be able to know what the item is you're updating.

#### Same Value

Alternatively, you can send the following:

<div class="definitions">

`keys` **Required**\
Array of primary keys of the items you'd like to update.

`data` **Required**\
Any of [the item object](#the-item-object)'s properties.

</div>

### Returns

Returns the [item objects](#the-item-object) for the updated items.

#### Singleton

If your collection is a singleton, this endpoint will act the same as the [Update an Item](#update-an-item) endpoint.

</div>
<div class="right">

```
PATCH /items
```

```json
// Request

// Multiple items, different values
[
	{
		"id": 1,
		"featured_image": "d17c10aa-0bad-4864-9296-84f522c753e5"
	},
	{
		"id": 2,
		"featured_image": "b6123925-2fc0-4a30-9d86-863eafc0a6e7"
	}
]

// Multiple items, same value
{
	"keys": [1, 2],
	"data": {
		"status": "published"
	}
}
```

```json
// Response

{
	"data": [
		{
			"id": 2,
			"status": "draft",
			"title": "Hello, world!",
			"body": "This is my first article",
			"featured_image": null,
			"author": null
		},
		{...}
	]
}
```

</div>
</div>

---

## Delete an Item

Delete an existing item.

<div class="two-up">
<div class="left">

### Returns

Empty body.

</div>
<div class="right">

```
DELETE /items/:id
```

```json
// Empty Response
```

</div>
</div>

---

## Delete Multiple Items

Delete multiple existing items.

<div class="two-up">
<div class="left">

### Request Body

An array of item primary keys.

### Returns

Empty body.

</div>
<div class="right">

```
DELETE /items
```

```json
// Request
["d97c2e0e-293d-4eb5-9e1c-27d3460ad29d", "fc02d733-95b8-4e27-bd4b-08a32cbe4e66"]
```

```json
// Empty Response
```

</div>
</div>
