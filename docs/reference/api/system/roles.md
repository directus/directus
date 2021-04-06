---
pageClass: page-reference
---

# Roles

<div class="two-up">
<div class="left">

> Roles define a specific set of access permissions, and are the primary organizational structure for Users within the
> platform. [Learn more about Roles](/concepts/roles/).

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## The Role Object

<div class="two-up">
<div class="left">
<div class="definitions">

`id` **uuid**\
Primary key of the role.

`name` **string**\
Name of the role.

`icon` **string**\
Icon for the role. Displayed in the Admin App.

`description` **string**\
Description for the role. Displayed in the Admin App.

`ip_access` **csv**\
CSV of IP addresses that have access to this role. Allows you to configure an allowlist of IP addresses.

`enforce_tfa` **boolean**\
Whether or not Two-Factor Authentication is required for users in this role.

`module_list` **object**\
Override for the module listing in the left most sidebar of the Admin App.

`collection_list` **object**\
Override for the collection listing in the navigation of the collections module in the Admin App.

`admin_access` **boolean**\
If this role is considered an admin role. This means that users in this role have full permissions to everything.

`app_access` **boolean**\
Whether or not users in this role have access to use the Admin App.

`users` **one-to-many**\
The users in this role. One-to-many to [users](/reference/api/rest/users/).

</div>
</div>
<div class="right">

```json
{
	"id": "653925a9-970e-487a-bfc0-ab6c96affcdc",
	"name": "Admin",
	"icon": "supervised_user_circle",
	"description": null,
	"ip_access": null,
	"enforce_tfa": false,
	"module_list": null,
	"collection_list": null,
	"admin_access": true,
	"app_access": true,
	"users": ["0bc7b36a-9ba9-4ce0-83f0-0a526f354e07"]
}
```

</div>
</div>

---

## List Roles

List all roles that exist in Directus.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

An array of up to [limit](/reference/api/query/#limit) [role objects](#the-role-object). If no items are available, data
will be an empty array.

</div>
<div class="right">

```
GET /roles
```

```json
// Response

{
	"data": [
		{
			"id": "653925a9-970e-487a-bfc0-ab6c96affcdc",
			"name": "Admin",
			"icon": "supervised_user_circle",
			"description": null,
			"ip_access": null,
			"enforce_tfa": false,
			"module_list": null,
			"collection_list": null,
			"admin_access": true,
			"app_access": true,
			"users": ["0bc7b36a-9ba9-4ce0-83f0-0a526f354e07"]
		},
		{...},
		{...}
	]
}
```

</div>
</div>

---

## Retrieve a Role

List an existing role by primary key.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

Returns the requested [role object](#the-role-object).

</div>
<div class="right">

```
GET /roles/:id
```

```json
// Response

{
	"data": {
		"id": "653925a9-970e-487a-bfc0-ab6c96affcdc",
		"name": "Admin",
		"icon": "supervised_user_circle",
		"description": null,
		"ip_access": null,
		"enforce_tfa": false,
		"module_list": null,
		"collection_list": null,
		"admin_access": true,
		"app_access": true,
		"users": ["0bc7b36a-9ba9-4ce0-83f0-0a526f354e07"]
	}
}
```

</div>
</div>

---

## Create a Role

Create one or more new role(s).

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [role object](#the-role-object) or an array of partial [role objects](#the-role-object).

### Returns

Returns the [role object(s)](#the-role-object) for the created role(s).

</div>
<div class="right">

```
POST /roles
```

```json
// Request

{
	"name": "Interns",
	"icon": "verified_user",
	"description": null,
	"admin_access": false,
	"app_access": true
}
```

```json
// Response

{
	"data": {
		"id": "2e6c5fc1-e2bb-4bfc-9f74-8a91604b3b31",
		"name": "Interns",
		"icon": "verified_user",
		"description": null,
		"ip_access": null,
		"enforce_tfa": false,
		"module_list": null,
		"collection_list": null,
		"admin_access": false,
		"app_access": true,
		"users": null
	}
}
```

</div>
</div>

---

## Update a Role

Update an existing role.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [role object](#the-role-object).

### Returns

Returns the [role object](#the-role-object) for the created role.

</div>
<div class="right">

```
PATCH /roles/:id
```

```json
// Request

{
	"icon": "attractions"
}
```

```json
// Response

{
	"data": {
		"id": "2e6c5fc1-e2bb-4bfc-9f74-8a91604b3b31",
		"name": "Interns",
		"icon": "attractions",
		"description": null,
		"ip_access": null,
		"enforce_tfa": false,
		"module_list": null,
		"collection_list": null,
		"admin_access": false,
		"app_access": true,
		"users": null
	}
}
```

</div>
</div>

---

## Delete a Role

Delete an existing role.

<div class="two-up">
<div class="left">

### Returns

Empty body.

</div>
<div class="right">

```
DELETE /roles/:id
```

```json
// Empty Response
```

</div>
</div>

---

## Delete Multiple Roles

Delete multiple existing roles.

<div class="two-up">
<div class="left">

### Request Body

An array of role primary keys

### Returns

Empty body.

</div>
<div class="right">

```
DELETE /roles
```

```json
// Request
["653925a9-970e-487a-bfc0-ab6c96affcdc", "c86c2761-65d3-43c3-897f-6f74ad6a5bd7"]
```

```json
// Empty Response
```

</div>
</div>

---
