---
pageClass: page-reference
---

# Preset

<div class="two-up">
<div class="left">

> Presets hold the preferences of individual users of the platform. This allows Directus to show and maintain custom item
listings and bookmarks for users of the app.  [Learn more about Presets](/concepts/collections/#collection-presets-bookmarks).

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## The Preset Object

<div class="two-up">
<div class="left">
<div class="definitions">

`id` **uuid**\
Primary key of the preset.

`bookmark` **string**\
The title of the bookmark. If this value is `null`, it's considered a preset instead of a bookmark.

`user` **many-to-one**\
User this preset applies to. Many-to-one to [users](/reference/api/rest/users/).

`role` **many-to-one**\
Role this preset applies to. Many-to-one to [users](/reference/api/rest/roles/).

`collection` **string**\
Collection this preset applies to.

`search` **string**\
The search query used in the preset.

`filters` **array**\
The filters used in the preset.

`layout` **string**\
The layout used in this preset.

`layout_query` **object**\
The item query used by the layout. This structure is based on the used layout.

`layout_options` **object**\
The options used by the layout. This structure is based on the used layout.

</div>
</div>
<div class="right">

```json
{
	"id": 39,
	"bookmark": null,
	"user": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
	"role": null,
	"collection": "directus_activity",
	"search": null,
	"filters": [],
	"layout": "tabular",
	"layout_query": {
		"tabular": {
			"sort": "-timestamp",
			"fields": ["action", "collection", "timestamp", "user"],
			"page": 1
		}
	},
	"layout_options": {
		"tabular": {
			"widths": {
				"action": 100,
				"collection": 210,
				"timestamp": 240,
				"user": 240
			}
		}
	}
}
```

</div>
</div>

---

## List Presets

List all presets that exist in Directus.

<div class="two-up">
<div class="left">

::: tip Permissions

The data returned in this endpoint will be filtered based on the user's permissions. For example, presets for a role
other than the current user's role won't be returned.

:::

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

An array of up to [limit](/reference/api/query/#limit) [preset objects](#the-preset-object). If no items are available,
data will be an empty array.

</div>
<div class="right">

```
GET /presets
```

```json
// Response

{
	"data": [
		{
			"id": 39,
			"bookmark": null,
			"user": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
			"role": null,
			"collection": "directus_activity",
			"search": null,
			"filters": [],
			"layout": "tabular",
			"layout_query": {
				"tabular": {
					"sort": "-timestamp",
					"fields": ["action", "collection", "timestamp", "user"],
					"page": 1
				}
			},
			"layout_options": {
				"tabular": {
					"widths": {
						"action": 100,
						"collection": 210,
						"timestamp": 240,
						"user": 240
					}
				}
			}
		},
		{...},
		{...}
	]
}
```

</div>
</div>

---

## Retrieve a preset

List an existing preset by primary key.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

Returns the requested [preset object](#the-preset-object).

</div>
<div class="right">

```
GET /presets/:id
```

```json
// Response

{
	"data": {
		"id": 39,
		"bookmark": null,
		"user": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
		"role": null,
		"collection": "directus_activity",
		"search": null,
		"filters": [],
		"layout": "tabular",
		"layout_query": {
			"tabular": {
				"sort": "-timestamp",
				"fields": ["action", "collection", "timestamp", "user"],
				"page": 1
			}
		},
		"layout_options": {
			"tabular": {
				"widths": {
					"action": 100,
					"collection": 210,
					"timestamp": 240,
					"user": 240
				}
			}
		}
	}
}
```

</div>
</div>

---

## Create Preset

Create one or more new preset(s).

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [preset object](#the-preset-object) or an array of partial [preset objects](#the-preset-object).

### Returns

Returns the [preset object](#the-preset-object) for the created preset.

</div>
<div class="right">

```
POST /presets
```

```json
// Request

{
	"user": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
	"layout": "cards",
	"search": "Directus"
}
```

```json
// Response

{
	"data": {
		"id": 42,
		"bookmark": null,
		"user": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
		"role": null,
		"collection": null,
		"search": "Directus",
		"filters": null,
		"layout": "cards",
		"layout_query": null,
		"layout_options": null
	}
}
```

</div>
</div>

---

## Update Preset

Update an existing preset.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [preset object](#the-preset-object).

### Returns

Returns the [preset object](#the-preset-object) for the created preset.

</div>
<div class="right">

```
PATCH /presets/:id
```

```json
// Request

{
	"layout": "tabular"
}
```

```json
// Response

{
	"data": {
		"id": 42,
		"bookmark": null,
		"user": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
		"role": null,
		"collection": null,
		"search": "Directus",
		"filters": null,
		"layout": "tabular",
		"layout_query": null,
		"layout_options": null
	}
}
```

</div>
</div>

---

## Delete Preset

Delete an existing preset.

<div class="two-up">
<div class="left">

### Returns

Empty body.

</div>
<div class="right">

```
DELETE /presets/:id
```

```json
// Empty Response
```

</div>
</div>

---

## Delete Multiple Presets

Delete multiple existing presets.

<div class="two-up">
<div class="left">

### Request Body

An array of preset primary keys

### Returns

Empty body.

</div>
<div class="right">

```
DELETE /presets
```

```json
// Request
[15, 251, 810]
```

```json
// Empty Response
```

</div>
</div>

---
