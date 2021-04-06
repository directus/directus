---
pageClass: page-reference
---

# Fields

<div class="two-up">
<div class="left">

> Fields are individual pieces of content within an item. They are mapped to columns in the database.
> [Learn more about Fields](/concepts/fields/).

</div>
<div class="right">

[[toc]]

</div>
</div>

---

## The Field Object

<div class="two-up">
<div class="left">
<div class="definitions">

`collection` **string**\
Name of the collection the field resides in.

`field` **string**\
The identifier of the field. This matches the table column name.

`type` **string**\
The Directus data type of the field. See [/concepts/platform-overview/#types] for possible options.

</div>

#### Meta

Directus metadata, primarily used in the Admin App. Meta is optional.

<div class="definitions">

`id` **integer**\
Primary key of the metadata row in `directus_fields`.

`collection` **string**\
The name of the collection this field resides in.

`field` **string**\
Identifier of the field. Matches the column name in the database.

`special` **string**\
Any special transform flags that apply to this field. See [/reference/field-transforms/] for more information.

`interface` **string**\
The interface used for this field.

`options` **object**\
The interface options configured for this field. The structure is based on the interface used.

`display` **string**\
The display used for this field.

`display_options` **string**\
The configured options for the used display.

`readonly` **boolean**\
If the field is considered readonly in the Admin App.

`hidden` **boolean**\
If the field is hidden from the edit page in the Admin App.

`sort` **integer**\
Where this field is shown on the edit page in the Admin App.

`width` **string**\
How wide the interface is rendered on the edit page in the Admin App. One of `half`, `half-left`, `half-right`, `half-space`,
`full`, `fill`.

`translations` **array**\
How this field's name is displayed in the different languages in the Admin App.

`note` **string**\
Short description displayed in the Admin App.

</div>

#### Schema

"Raw" database information. Based on the database vendor used, different information might be returned. The following
are available for all drivers. Note: schema is optional. If a field exist in directus_fields, but not in the database,
it's an alias commonly used for relational (o2m) or presentation purposes in the Admin App.

<div class="definitions">

`name` **string**\
Identifier of the field. Matches the column name in the database.

`table` **string**\
Name of the table the column resides in.

`data_type` **string**\
The datatype as used in the database. Note: this value is database vendor specific.

`default_value` **any**\
The configured default value for the column.

`max_length` **integer**\
Configured length for varchar-type columns.

`numeric_precision` **integer**\
Precision for integer/float/decimal type fields.

`numeric_scale` **integer**\
Scale for integer/float/decimal type fields.

`is_nullable` **boolean**\
Whether or not the column is nullable. This is what is used as the "required" state in Directus.

`is_primary_key` **boolean**\
Whether or not the field is the primary key of the table.

`foreign_key_column` **string**\
If the current column has a foreign key constraint, this points to the related column.

`foreign_key_table` **string**\
If the current column has a foreign key constraint, this points to the related table.

`comment` **string**\
Comment as stored in the database.

</div>
</div>
<div class="right">

```json
{
	"collection": "articles",
	"field": "id",
	"type": "integer",
	"meta": {
		"id": 16,
		"collection": "articles",
		"field": "id",
		"special": null,
		"interface": "numeric",
		"options": null,
		"display": null,
		"display_options": null,
		"readonly": true,
		"hidden": true,
		"sort": 1,
		"width": "full",
		"translations": null,
		"note": "The unique identifier of the article"
	},
	"schema": {
		"name": "id",
		"table": "articles",
		"data_type": "integer",
		"default_value": null,
		"max_length": null,
		"numeric_precision": 32,
		"numeric_scale": 0,
		"is_nullable": false,
		"is_primary_key": true,
		"has_auto_increment": true,
		"foreign_key_column": null,
		"foreign_key_table": null,
		"comment": null
	}
}
```

</div>
</div>

---

## List All Fields

List the available fields.

<div class="two-up">
<div class="left">

### Query Parameters

This endpoint doesn't currently support any query parameters.

### Returns

An array of [field objects](#the-field-object).

</div>
<div class="right">

```
GET /fields
```

```json
{
	"data": [
		{
			"collection": "articles",
			"field": "id",
			"type": "integer",
			"meta": {
				"id": 16,
				"collection": "articles",
				"field": "id",
				"special": null,
				"interface": "numeric",
				"options": null,
				"display": null,
				"display_options": null,
				"readonly": true,
				"hidden": true,
				"sort": 1,
				"width": "full",
				"translations": null,
				"note": "The unique identifier of the article"
			},
			"schema": {
				"name": "id",
				"table": "articles",
				"data_type": "integer",
				"default_value": null,
				"max_length": null,
				"numeric_precision": 32,
				"numeric_scale": 0,
				"is_nullable": false,
				"is_primary_key": true,
				"has_auto_increment": true,
				"foreign_key_column": null,
				"foreign_key_table": null,
				"comment": null
			}
		},
		{ ... },
		{ ... }
	]
}
```

</div>
</div>

---

## List Fields in Collection

List the available fields in a given collection.

<div class="two-up">
<div class="left">

### Query Parameters

This endpoint doesn't currently support any query parameters.

### Returns

An array of [field objects](#the-field-object).

</div>
<div class="right">

```
GET /fields/:collection
```

```json
{
	"data": [
		{
			"collection": "articles",
			"field": "id",
			"type": "integer",
			"meta": {
				"id": 16,
				"collection": "articles",
				"field": "id",
				"special": null,
				"interface": "numeric",
				"options": null,
				"display": null,
				"display_options": null,
				"readonly": true,
				"hidden": true,
				"sort": 1,
				"width": "full",
				"translations": null,
				"note": "The unique identifier of the article"
			},
			"schema": {
				"name": "id",
				"table": "articles",
				"data_type": "integer",
				"default_value": null,
				"max_length": null,
				"numeric_precision": 32,
				"numeric_scale": 0,
				"is_nullable": false,
				"is_primary_key": true,
				"has_auto_increment": true,
				"foreign_key_column": null,
				"foreign_key_table": null,
				"comment": null
			}
		},
		{ ... },
		{ ... }
	]
}
```

</div>
</div>

---

## Retrieve a Field

Get a single field in a given collection.

<div class="two-up">
<div class="left">

### Query Parameters

This endpoint doesn't currently support any query parameters.

### Returns

A [field object](#the-field-object).

</div>
<div class="right">

```
GET /fields/:collection/:field
```

```json
{
	"data": {
		"collection": "articles",
		"field": "id",
		"type": "integer",
		"meta": {
			"id": 16,
			"collection": "articles",
			"field": "id",
			"special": null,
			"interface": "numeric",
			"options": null,
			"display": null,
			"display_options": null,
			"readonly": true,
			"hidden": true,
			"sort": 1,
			"width": "full",
			"translations": null,
			"note": "The unique identifier of the article"
		},
		"schema": {
			"name": "id",
			"table": "articles",
			"data_type": "integer",
			"default_value": null,
			"max_length": null,
			"numeric_precision": 32,
			"numeric_scale": 0,
			"is_nullable": false,
			"is_primary_key": true,
			"has_auto_increment": true,
			"foreign_key_column": null,
			"foreign_key_table": null,
			"comment": null
		}
	}
}
```

</div>
</div>

---

## Create a Field

Create a new field in the given collection.

<div class="two-up">
<div class="left">

### Query Parameters

This endpoint doesn't currently support any query parameters.

### Request Body

<div class="definitions">

`field` **Required**\
Field key, also used as the column name.

`type` **Required**\
One of the Directus types. This in turn controls what datatype is used for the column in the database. Setting the type to
`alias` prevents a column from being created in the database.

`meta`\
Any of the optional meta values in the [field object](#the-field-object).

`schema`\
Any of the optional schema values in the [field object](#the-field-object).

</div>

### Returns

The [field object](#the-field-object) for the created field.

</div>
<div class="right">

```
POST /fields/:collection
```

```json
// Request

{
	"field": "title",
	"type": "string",
	"meta": {
		"icon": "title"
	},
	"schema": {
		"default_value": "Hello World"
	}
}
```

```json
{
	"data": {
		"collection": "articles",
		"field": "title",
		"type": "string",
		"meta": {
			"id": 50,
			"collection": "articles",
			"field": "title",
			"special": null,
			"interface": null,
			"options": null,
			"display": null,
			"display_options": null,
			"readonly": false,
			"hidden": false,
			"sort": null,
			"width": "full",
			"group": null,
			"translations": null,
			"note": null
		},
		"schema": {
			"name": "title",
			"table": "articles",
			"data_type": "character varying",
			"default_value": "Hello World",
			"max_length": 255,
			"numeric_precision": null,
			"numeric_scale": null,
			"is_nullable": true,
			"is_primary_key": false,
			"has_auto_increment": false,
			"foreign_key_column": null,
			"foreign_key_table": null,
			"comment": null,
			"schema": "public",
			"foreign_key_schema": null
		}
	}
}
```

</div>
</div>
</div>

---

## Update a Field

Updates the given field in the given collection.

<div class="two-up">
<div class="left">

### Query Parameters

This endpoint doesn't currently support any query parameters.

### Request Body

<div class="definitions">

`type`\
The new type for the field.

::: warning Changing Type

Types may not be compatible, and/or data might be truncated / corrupted. Please be careful when changing types of an
existing field with content.

:::

`meta`\
Any of the optional meta values in the [field object](#the-field-object).

`schema`\
Any of the optional schema values in the [field object](#the-field-object).

</div>

Updating the field name is not supported at this time.

### Returns

The [field object](#the-field-object) for the updated field.

</div>
<div class="right">

```
PATCH /fields/:collection/:field
```

```json
// Request

{
	"meta": {
		"note": "Put the title here"
	},
	"schema": {
		"default_value": "Hello World!"
	}
}
```

```json
{
	"data": {
		"collection": "articles",
		"field": "title",
		"type": "string",
		"meta": {
			"id": 50,
			"collection": "articles",
			"field": "title",
			"special": null,
			"interface": null,
			"options": null,
			"display": null,
			"display_options": null,
			"readonly": false,
			"hidden": false,
			"sort": null,
			"width": "full",
			"group": null,
			"translations": null,
			"note": "Put the title here"
		},
		"schema": {
			"name": "title",
			"table": "articles",
			"data_type": "character varying",
			"default_value": "Hello World!",
			"max_length": 255,
			"numeric_precision": null,
			"numeric_scale": null,
			"is_nullable": true,
			"is_primary_key": false,
			"has_auto_increment": false,
			"foreign_key_column": null,
			"foreign_key_table": null,
			"comment": null,
			"schema": "public",
			"foreign_key_schema": null
		}
	}
}
```

</div>
</div>

---

## Delete a Field

Deletes the given field in the given collection.

<div class="two-up">
<div class="left">

::: danger Destructive

Be aware, this will delete the column from the database, including all data in it. This action can't be undone.

:::

</div>
<div class="right">

```
DELETE /fields/:collection/:field
```

```json
// Empty Response
```

</div>
</div>
