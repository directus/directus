---
pageClass: page-reference
---

# Folders

<div class="two-up">
<div class="left">

> Folders can be used to organize files within the platform. Folders are virtual, and aren't mirrored within the storage adapter.

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## The Folder Object

<div class="two-up">
<div class="left">
<div class="definitions">

`id` **uuid**\
Primary key of the folder.

`name` **string**\
Name of the folder.

`parent` **many-to-one**\
Parent folder. Many-to-one to folders (recursive).

</div>
</div>
<div class="right">

```json
{
	"data": {
		"id": "fc02d733-95b8-4e27-bd4b-08a32cbe4e66",
		"name": "Test",
		"parent": null
	}
}
```

</div>
</div>

---

## List Folders

List all folders that exist in Directus.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

An array of up to [limit](/reference/api/query/#limit) [folder objects](#the-folder-object). If no items are available,
data will be an empty array.

</div>
<div class="right">

```
GET /folders
```

```json
// Response

{
	"data": [
		{
			"id": "fc02d733-95b8-4e27-bd4b-08a32cbe4e66",
			"name": "Test",
			"parent": null
		},
		{...},
		{...}
	]
}
```

</div>
</div>

---

## Retrieve a Folder

List all folders that exist in Directus.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

Returns a [folder object](#the-folder-object) if a valid primary key was provided.

</div>
<div class="right">

```
GET /folders/:id
```

```json
// Response

{
	"data": {
		"id": "fc02d733-95b8-4e27-bd4b-08a32cbe4e66",
		"name": "Test",
		"parent": null
	}
}
```

</div>
</div>

---

## Create a Folder

Create one or more new virtual folder(s).

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [folder object](#the-folder-object) or an array of partial [folder objects](#the-folder-object). `name` is
required.

### Returns

Returns the [folder object](#the-folder-object) of the folder that was created.

</div>
<div class="right">

```
POST /folders
```

```json
// Request

{
	"name": "Test"
}
```

```json
// Response

{
	"data": {
		"id": "fc02d733-95b8-4e27-bd4b-08a32cbe4e66",
		"name": "Test",
		"parent": null
	}
}
```

</div>
</div>

---

## Update a Folder

Update an existing folder.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [folder object](#the-folder-object).

### Returns

Returns the [folder object](#the-folder-object) of the folder that was updated.

</div>
<div class="right">

```
PATCH /folders/:id
```

```json
// Request

{
	"parent": "d97c2e0e-293d-4eb5-9e1c-27d3460ad29d"
}
```

```json
// Response

{
	"data": {
		"id": "fc02d733-95b8-4e27-bd4b-08a32cbe4e66",
		"name": "Test",
		"parent": "d97c2e0e-293d-4eb5-9e1c-27d3460ad29d"
	}
}
```

</div>
</div>

---

## Delete a Folder

Delete an existing folder.

<div class="two-up">
<div class="left">

::: tip Files

Any files in this folder will be moved to the root folder.

:::

### Returns

Empty body.

</div>
<div class="right">

```
DELETE /folders/:id
```

```json
// Empty Response
```

</div>
</div>

---

## Delete Multiple Folders

Delete multiple existing folders.

<div class="two-up">
<div class="left">

::: tip Files

Any files in these folders will be moved to the root folder.

:::

### Request Body

An array of folder primary keys.

### Returns

Empty body.

</div>
<div class="right">

```
DELETE /folders
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
