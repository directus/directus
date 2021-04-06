---
pageClass: page-reference
---

# Relations

<div class="two-up">
<div class="left">

> What data is linked to what other data. Allows you to assign authors to articles, products to sales, and whatever
> other structures you can think of. [Learn more about Relationships](/concepts/relationships/).

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## The Relation Object

<div class="two-up">
<div class="left">
<div class="definitions">

`id` **integer**\
Primary key of the relation.

`many_collection` **string**\
Collection on the "many" side of the relation.

`many_field` **string**\
Field on the "many" side of the relation.

`one_collection` **string**\
Collection on the "one" side of the relation.

`one_field` **string**\
Field on the "one" side of the relation.

`one_collection_field` **string**\
In Many-to-Any type fields, this holds the field in the many collection that holds the name of the "one" collection.

`one_allowed_collections` **string**\
In Many-to-Any type fields, this holds a csv of collection names the user is allowed to use through the m2a relation.

`junction_field` **string**\
For Many-to-Many type fields, this holds the name of the field that "links" a many-to-one to a one-to-many, creating a many-to-many.

</div>
</div>
<div class="right">

```json
{
	"id": 13,
	"many_collection": "articles",
	"many_field": "featured_image",
	"one_collection": "directus_files",
	"one_field": null,
	"one_collection_field": null,
	"one_allowed_collections": null,
	"junction_field": null
}
```

</div>
</div>

---

## List relations

List all relations that exist in Directus.

<div class="two-up">
<div class="left">

::: tip Permissions

The data returned in this endpoint will be filtered based on the user's permissions. For example, relations that apply
to a collection that the current user doesn't have access to are stripped out.

:::

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

An array of up to [limit](/reference/api/query/#limit) [relation objects](#the-relation-object). If no items are
available, data will be an empty array.

</div>
<div class="right">

```
GET /relations
```

```json
// Response

{
	"data": [
		{
			"id": 13,
			"many_collection": "articles",
			"many_field": "featured_image",
			"one_collection": "directus_files",
			"one_field": null,
			"one_collection_field": null,
			"one_allowed_collections": null,
			"junction_field": null
		},
		{...},
		{...}
	]
}
```

</div>
</div>

---

## Retrieve a relation

List an existing relation by primary key.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Returns

Returns the requested [relation object](#the-relation-object).

</div>
<div class="right">

```
GET /relations/:id
```

```json
// Response

{
	"data": {
		"id": 13,
		"many_collection": "articles",
		"many_field": "featured_image",
		"one_collection": "directus_files",
		"one_field": null,
		"one_collection_field": null,
		"one_allowed_collections": null,
		"junction_field": null
	}
}
```

</div>
</div>

---

## Create relation

Create one or more new relation(s).

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [relation object](#the-relation-object) or an array of partial [relation objects](#the-relation-object).

### Returns

Returns the [relation object](#the-relation-object) for the created relation.

</div>
<div class="right">

```
POST /relations
```

```json
// Request

{
	"many_collection": "articles",
	"many_field": "featured_image",
	"one_collection": "directus_files"
}
```

```json
// Response

{
	"data": {
		"id": 13,
		"many_collection": "articles",
		"many_field": "featured_image",
		"one_collection": "directus_files",
		"one_field": null,
		"one_collection_field": null,
		"one_allowed_collections": null,
		"junction_field": null
	}
}
```

</div>
</div>

---

## Update relation

Update an existing relation.

<div class="two-up">
<div class="left">

### Query Parameters

Supports all [global query parameters](/reference/api/query).

### Request Body

A partial [relation object](#the-relation-object).

### Returns

Returns the [relation object](#the-relation-object) for the created relation.

</div>
<div class="right">

```
PATCH /relations/:id
```

```json
// Request

{
	"one_field": "articles"
}
```

```json
// Response

{
	"data": {
		"id": 13,
		"many_collection": "articles",
		"many_field": "featured_image",
		"one_collection": "directus_files",
		"one_field": "articles",
		"one_collection_field": null,
		"one_allowed_collections": null,
		"junction_field": null
	}
}
```

</div>
</div>

---

## Delete relation

Delete an existing relation.

<div class="two-up">
<div class="left">

### Returns

Empty body.

</div>
<div class="right">

```
DELETE /relations/:id
```

```json
// Empty Response
```

</div>
</div>

---

## Delete Multiple relations

Delete multiple existing relations.

<div class="two-up">
<div class="left">

### Request Body

An array of relation primary keys

### Returns

Empty body.

</div>
<div class="right">

```
DELETE /relations
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
