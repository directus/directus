---
description: REST documentation on the Translations collection in Directus.
readTime: 3 min read
pageClass: page-reference
---

# Custom Translations

---

## The Translations Object

`id` **uuid**\
Primary key of the translations

`key` **string**\
The translation key.

`language` **string**\
The language of the translation.

`value` **string**\
The translation value.

```json
{
	"data": {
		"id": "c4346aa4-81a8-4885-b3a8-f647e4f6f769",
		"key": "Test",
		"language": "en-US",
		"value": "Test"
	}
}
```

---

## List Translations

List all translations that exist in Directus.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

An array of up to [limit](/reference/query#limit) [translation objects](#the-translations-object). If no items are available, data
will be an empty array.

### REST API

```
GET /translations
SEARCH /translations
```

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

---

## Retrieve a Translation

List an existing translation by primary key.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

Returns the requested [translation object](#the-translations-object).

### REST API

```
GET /translations/:id
```

##### Example

```
GET /translations/2fc325fb-299b-4d20-a9e7-a34349dee8b2
```

---

## Create a Translation

Create a new translation.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [translation object](#the-translations-object).

### Returns

Returns the [translation object](#the-translations-object) for the created translation.

### REST API

```
POST /translations
```

##### Example

```json
// POST /translations

{
	"key": "Test",
	"language": "en-US",
	"value": "My Test",
}
```

---

## Create Multiple Translations

Create multiple new translation.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

An array of partial [translation object](#the-translations-object).

### Returns

Returns the [translation object](#the-translations-object) for the created translation.

### REST API

```
POST /translations
```

##### Example

```json
// POST /translations

[
	{
		"key": "translation.key",
		"language": "en-US",
		"value": "My Translation"
	},
	{
		"key": "translation.key",
		"language": "en-GB",
		"value": "Another Translation"
	}
]
```

---

## Update a Translation

Update an existing translation.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [translation object](#the-translations-object).

### Returns

Returns the [translation object](#the-translations-object) for the updated translation.

### REST API

```
PATCH /translations/:id
```

##### Example

```json
// PATCH /translations/2fc325fb-299b-4d20-a9e7-a34349dee8b2

{
	"value": "My Updated Translations"
}
```

---

## Update Multiple Translations

Update multiple existing translations.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

`keys` **Required**\
Array of primary keys of the translations you'd like to update.

`data` **Required**\
Any of [translation object](#the-translations-object)'s properties.

### Returns

Returns the [translation objects](#the-translations-object) for the updated translations.

### REST API

```
PATCH /translations
```

##### Example

```json
// PATCH /translations

{
	"keys": ["3f2facab-7f05-4ee8-a7a3-d8b9c634a1fc", "7259bfa8-3786-45c6-8c08-cc688e7ba229"],
	"data": {
		"value": "Test Value"
	}
}
```

---

## Delete a Translation

Delete an existing translation.

### Returns

Empty body.

### REST API

```
DELETE /translations/:id
```

##### Example

```
DELETE /translations/12204ee2-2c82-4d9a-b044-2f4842a11dba
```

---

## Delete Multiple Translations

Delete multiple existing translations.

### Request Body

An array of translations primary keys

### Returns

Empty body.

### REST API

```
DELETE /translations
```

##### Example

```json
// DELETE /translations
["25821236-8c2a-4f89-8fdc-c7d01f35877d", "02b9486e-4273-4fd5-b94b-e18fd923d1ed", "7d62f1e9-a83f-407b-84f8-1c184f014501"]
```

