---
description: REST documentation on the Translations collection in Directus.
readTime: 3 min read
pageClass: page-reference
---

# Custom Translations

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

## List Translations

List all translations that exist in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`GET /translations`

`SEARCH /translations`

</template>

<template #graphql>

</template>
</SnippetToggler>

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [translation objects](#the-translations-object). If no items are
available, data will be an empty array.

## Retrieve a Translation

List an existing translation by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`GET /translations/:id`

</template>

<template #graphql>

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the requested [translation object](#the-translations-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`GET /translations/2fc325fb-299b-4d20-a9e7-a34349dee8b2`

</template>

<template #graphql>

</template>
</SnippetToggler>

## Create a Translation

Create a new translation.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /translations`

```json
{
	"translation_object_field_1": "value_1",
	"translation_object_field_2": "value_2",
	"translation_object_field_3": "value_3"
}
```

</template>

<template #graphql>

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [translation object](#the-translations-object).

### Response

Returns the [translation object](#the-translations-object) for the created translation.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /translations`

```json
{
	"key": "Test",
	"language": "en-US",
	"value": "My Test"
}
```

</template>

<template #graphql>

</template>
</SnippetToggler>

## Create Multiple Translations

Create multiple new translation.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /translations`

```json
[
	{
		"translation_1_object_field_1": "value_1",
		"translation_1_object_field_2": "value_2",
		"translation_1_object_field_3": "value_3"
	},
	{
		"translation_2_object_field_1": "value_4",
		"translation_2_object_field_2": "value_5",
		"translation_2_object_field_3": "value_6"
	}
]
```

</template>

<template #graphql>

</template>

</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [translation object](#the-translations-object).

### Response

Returns the [translation object](#the-translations-object) for the created translation.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /translations`

```json
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

</template>

<template #graphql>

</template>
</SnippetToggler>

## Update a Translation

Update an existing translation.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`PATCH /translations/:id`

```json
{
	"translation_object_field": "value_1"
}
```

</template>

<template #graphql>

</template>
</SnippetToggler>

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [translation object](#the-translations-object).

### Response

Returns the [translation object](#the-translations-object) for the updated translation.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`PATCH /translations/2fc325fb-299b-4d20-a9e7-a34349dee8b2`

```json
{
	"value": "My Updated Translations"
}
```

</template>

<template #graphql>

</template>
</SnippetToggler>

## Update Multiple Translations

Update multiple existing translations.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`PATCH /translations`

```json
{
	"keys": ["translation_1_key", "translation_2_key"],
	"data": {
		"field": "value"
	}
}
```

</template>

<template #graphql>

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the translations you'd like to update.

`data` **Required**\
Any of [translation object](#the-translations-object)'s properties.

### Response

Returns the [translation objects](#the-translations-object) for the updated translations.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`PATCH /translations`

```json
{
	"keys": ["3f2facab-7f05-4ee8-a7a3-d8b9c634a1fc", "7259bfa8-3786-45c6-8c08-cc688e7ba229"],
	"data": {
		"value": "Test Value"
	}
}
```

</template>

<template #graphql>

</template>
</SnippetToggler>

## Delete a Translation

Delete an existing translation.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`DELETE /translations/:id`

</template>

<template #graphql>

</template>
</SnippetToggler>

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`DELETE /translations/12204ee2-2c82-4d9a-b044-2f4842a11dba`

</template>

<template #graphql>

</template>
</SnippetToggler>

## Delete Multiple Translations

Delete multiple existing translations.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`DELETE /translations`

```json
["translation_1_key", "translation_2_key", "translation_3_key"]
```

</template>

<template #graphql>

</template>
</SnippetToggler>

#### Request Body

An array of translations primary keys

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`DELETE /translations`

```json
["25821236-8c2a-4f89-8fdc-c7d01f35877d", "02b9486e-4273-4fd5-b94b-e18fd923d1ed", "7d62f1e9-a83f-407b-84f8-1c184f014501"]
```

</template>

<template #graphql>

</template>
</SnippetToggler>
