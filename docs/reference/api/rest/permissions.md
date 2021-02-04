---
pageClass: page-reference
---

# Permissions

<div class="two-up">
<div class="left">

Permissions control who has access to what, when.

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## The Permission Object

<div class="two-up">
<div class="left">
<div class="definitions">

`id` **uuid**\
Primary key of the permission rule.

`role` **many-to-one**\
Role this permission applies to. Many-to-one to [roles](/reference/api/rest/roles/). `null` is used for public permissions.

`collection` **string**\
Collection this permission rule applies to.

`action` **string**\
What CRUD operation this permission rule applies to. One of `create`, `read`, `update`, `delete`.

`permissions` **object**\
What rules the item must pass before the role is allowed to alter it. Follows [the Filter Rules spec](/reference/filter-rules/).

`validation` **object**\
What rules the provided values must pass before the role is allowed to submit them for insertion/update. Follows [the Filter Rules spec](/reference/filter-rules/).

`preset` **object**\
Additional default values for the role.

`fields` **array**\
What fields the user is allowed to alter.

`limit` **integer**\
How many items the user is able to alter at once in batch operations.

</div>
</div>
<div class="right">

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
	"fields": ["title", "translations"],
	"limit": null
}
```

</div>
</div>

---

## List Permissions

List all permissions that exist in Directus.

<div class="two-up">
<div class="left">

::: tip Permissions

The data returned in this endpoint will be filtered based on the user's permissions. For example, permissions for a role
other than the current user's role won't be returned.

:::

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

An array of up to [limit](/reference/api/query/#limit) [permission objects](#the-permission-object). If no items are
available, data will be an empty array.

</div>
<div class="right">

### `GET /permissions`

```json
// Response

{
	"data": [
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
			"fields": ["title", "translations"],
			"limit": null
		},
		{...},
		{...}
	]
}
```

</div>
</div>

---

## Retrieve a Permission

List an existing permission by primary key.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

Returns the requested [permission object](#the-permission-object).

</div>
<div class="right">

### `GET /permissions/:id`

```json
// Response

{
	"data": {
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
		"fields": ["title", "translations"],
		"limit": null
	}
}
```

</div>
</div>

---

## Create Permissions

Create one or more new permission rule(s)

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [permissions object](#the-permission-object) or an array of partial
[permissions objects](#the-permission-object). `action` and `collection` are required.

### Returns

Returns the [permission object](#the-permission-object) for the created permission.

</div>
<div class="right">

### `POST /permissions`

```json
// Request

{
	"collection": "pages",
	"action": "read",
	"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7",
	"fields": ["id", "title"]
}
```

```json
// Response

{
	"data": {
		"id": 36,
		"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7",
		"collection": "pages",
		"action": "read",
		"permissions": null,
		"validation": null,
		"presets": null,
		"fields": ["id", "title"],
		"limit": null
	}
}
```

</div>
</div>

---

## Update Permissions

Update an existing permissions rule.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [permissions object](#the-permission-object).

### Returns

Returns the [permission object](#the-permission-object) for the created permission.

</div>
<div class="right">

### `PATCH /permissions/:id`

```json
// Request

{
	"fields": ["id", "title", "body"]
}
```

```json
// Response

{
	"data": {
		"id": 36,
		"role": "c86c2761-65d3-43c3-897f-6f74ad6a5bd7",
		"collection": "pages",
		"action": "read",
		"permissions": null,
		"validation": null,
		"presets": null,
		"fields": ["id", "title", "body"],
		"limit": null
	}
}
```

</div>
</div>

---

## Delete Permissions

Delete an existing permissions rule

<div class="two-up">
<div class="left">

### Returns

Empty body.

</div>
<div class="right">

### `DELETE /permissions/:id`

```json
// Empty Response
```

</div>
</div>

---

## Delete Multiple Permissions

Delete multiple existing permissions rules

<div class="two-up">
<div class="left">

### Request Body

An array of permission primary keys

### Returns

Empty body.

</div>
<div class="right">

### `DELETE /permissions`

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
