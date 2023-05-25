---
description: REST documentation on the Translations collection in Directus.
readTime: 3 min read
pageClass: page-reference
---

# Translation Strings

---

## The Translation Strings Object

`id` **integer**\
Primary key of the Translation String.

`key` **string**\
The Translation String key.

`language` **string**\
The language of the Translation String.

`value` **string**\
The Translation String value.

```json
{
	"data": {
		"id": 1,
		"key": "Test",
		"language": "en-US",
		"value": "Test"
	}
}
```

---

## Retrieve Translation Strings

List existing translation strings.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

Returns an array of [translation strings objects](#The-Translation-Strings-Object).

### REST API

```
GET /translations
SEARCH /translations
```

---

## Update Translation Strings

Upsert translation strings.

### Request Body

An array of [translation strings objects](#the-settings-object).
Any existing translations not present for the provided `key` will be deleted.

### Returns

Returns the updated [translation strings objects](#the-setting-object).

### REST API

```
POST /translations/:key
PATCH /translations/:key
```

---

## Delete Translation Strings

Deletes all existing translation strings matching the `key`.

### Returns

Empty body.

### REST API

```
DELETE /translations/:key
```
