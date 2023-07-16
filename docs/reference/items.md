---
description: REST and GraphQL API documentation to access and manage Items in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Accessing Items

> Items are individual pieces of data in your database. They can be anything, from articles, to IoT status checks.
> [Learn more about Items](/user-guide/overview/glossary#items).

---

## The Item Object

Items don't have a predefined schema. The format depends completely on how you configured your collections and fields in
Directus. For the sake of documentation, we'll use a fictional articles collection with the following fields: `id`,
`status`, `title`, `body`, `featured_image`, and `author`.

::: tip Relational Data

Please see [Relational Data](/reference/introduction#relational-data) and [Field Parameters](/reference/query#fields) to
learn more.

:::

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

---

## Get Items

List all items that exist in Directus.


### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`GET /items/:collection`

`SEARCH /items/:collection`

</template>


<template #graphql>

`POST /graphql`
```graphql
type Query {
	<collection>: [<collection>]
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, readItems} from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest());

const result = await client.request(
    readItems('collection_name', {
        fields : ['*']
    })
);

console.log(result)
```
</template>


</SnippetToggler>


[Learn more about SEARCH ->](/reference/introduction#search-http-method)


#### Query Parameters

Supports all [global query parameters](/reference/query).

::: tip Relational Data

The [Field Parameter](/reference/query#fields) is required to return nested relational data.

:::


### Response

An array of up to [limit](/reference/query#limit) [item objects](#the-item-object). If no items are available, data will
be an empty array.

::: tip Singleton

If your collection is a singleton, this endpoint will return the item. If the item doesn't exist in the database, the
default values will be returned.

:::


### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`GET /items/articles`

</template>


<template #graphql>

`POST /graphql`
```graphql
query {
	articles {
		id
		title
		author {
			first_name
		}
	}
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, readItems} from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
    readItems('posts', {
        fields : ['*']
    })
);

console.log(result)
```

</template>

</SnippetToggler>

---

## Get Item by ID

Get an item that exists in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`GET /items/:collection/:id`

</template>


<template #graphql>

`POST /graphql`

```graphql
type Query {
	<collection>_by_id(id: ID!): <collection>
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, readItem} from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(readItem('collection_name', 'item_id'));

console.log(result);
```
</template>

</SnippetToggler>


#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns an [item object](#the-item-object) if a valid primary key was provided.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`GET /items/articles/15`

</template>


<template #graphql>

`POST /graphql`

```graphql
type Query {
	<collection>_by_id(id: ID!): <collection>
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, readItem} from '@directus/sdk/rest';
const client = createDirectus('https:/directus.example.com').with(rest())

const result = await client.request(readItem('articles', '1'));

console.log(result);
```
</template>

</SnippetToggler>


---

## Create an Item

Create a new item in the given collection.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /items/:collection`

```json
{
	"field": "value",
	"field_2": "value_2"
}
```
</template>

<template #graphql>

`POST /graphql`

```graphql
type Mutation {
	create_<collection>_item(data: create_<collection>_input): <collection>
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, createItem} from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(
    createItem('collection_name', {
            'field' : 'value_1',
            'field_2' : 'value_2'
    })
);

console.log(result);
```
</template>

</SnippetToggler>


#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [item objects](#the-item-object).

::: tip Relational Data

Relational data needs to be correctly nested to add new items successfully. Check out the
[relational data section](/reference/introduction#relational-data) for more information.

:::

### Response

Returns the [item objects](#the-item-object) of the item that were created.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /items/articles`

```json
{
	"title": "Hello world!",
	"body": "This is our first article"
}
```

</template>

<template #graphql>

`POST /graphql`

```graphql
mutation {
	create_articles_item(data: { title: "Hello world!", body: "This is our first article" }) {
		id
		title
	}
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, createItem} from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(
    createItem('articles', {
            'title' : 'What is Directus?',
            'content' : 'Directus is an Open Data Platform built to democratize the database.'
    })
);

console.log(result);
```
</template>

</SnippetToggler>

---

## Create Multiple Items

Create new items in the given collection.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /items/:collection`

```json
[
	{
		"field_1": "value_1",
		"field_2": "value_2"
	},
	{
		"field_1": "value_3",
		"field_2": "value_4"
	}
]
```

</template>


<template #graphql>

`POST /graphql`

```graphql
type Mutation {
	create_<collection>_items(data: [create_<collection>_input]): [<collection>]
}
```

</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, createItems} from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(
    createItems('collection_name', 
    [
        {
            'field_1' : 'value_1',
            'field_2' : 'value_2'
        },
        {
            'field_1' : 'value_3',
            'field_2' : 'value_4'
        }
    ])
);

console.log(result);
```
</template>

</SnippetToggler> 


#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [item objects](#the-item-object).

### Response

Returns the [item objects](#the-item-object) of the item that were created.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`POST /items/articles`

```json
[
	{
		"title": "Hello world!",
		"body": "This is our first article"
	},
	{
		"title": "Hello again, world!",
		"body": "This is our second article"
	}
]
```

</template>

<template #graphql>

`POST /graphql`

```graphql
mutation {
	create_articles_items(
		data: [
			{ title: "Hello world!", body: "This is our first article" }
			{ title: "Hello again, world!", body: "This is our second article" }
		]
	) {
		id
		title
	}
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, createItems} from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(
    createItems('articles', 
    [
        {
            'title' : 'What is Directus?',
            'content' : 'Directus is an Open Data Platform built to democratize the database.'
        },
        {
            'title' : 'Build your internal tools with Directus',
            'content' : 'Flows enable custom, event-driven data processing and task automation within Directus.'
        }
    ])
);

console.log(result);
```
</template>

</SnippetToggler>

---

## Update an Item

Update an existing item.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`PATCH /items/:collection/:id`

```json
{
	"field": "value"
}
```

</template>

<template #graphql>

`POST /graphql`

```graphql
type Mutation {
	update_<collection>_item(id: ID!, data: update_<collection>_input!): <collection>
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, updateItem} from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(
    updateItem('collection_name', 'item_id', {
        'field' : 'value'
    })
);

console.log(result);
```
</template>
</SnippetToggler>


#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [item object](#the-item-object).

### Response

Returns the [item object](#the-item-object) of the item that was updated.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`PATCH /items/articles/15`
```json
{
	"title": "An updated title"
}
```

</template>

<template #graphql>

`POST /graphql`

```graphql
mutation {
	update_articles_item(id: 15, data: { title: "An updated title" }) {
		id
		title
	}
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, updateItem} from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(
    updateItem('articles', '5', {
        'title' : 'What is Directus and how it can help you build your next app!?'
    })
);

console.log(result);
```
</template>

</SnippetToggler>

---

## Update Multiple Items

Update multiple items at the same time.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`PATCH /items/:collection`
```json
{
	"keys": ['id_1', 'id_2'],
	"data": {
		"field": "value"
	}
}
```
</template>

<template #graphql>

`POST /graphql`
```graphql
type Mutation {
	update_<collection>_items(ids: [ID!]!, data: [update_<collection>_input]): [<collection>]
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, updatedItems} from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(
    updatedItems('collection_name', ['id_1', 'id_2'], {
        'field' : 'value'
    })
);

console.log(result);
```
</template>

</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

Object containing `data` for the values to set, and either `keys` or `query` to select what items to update.

::: tip Singleton
If your collection is a singleton, this endpoint will act the same as the [Update an Item](#update-an-item) endpoint.
:::

### Response

Returns the [item objects](#the-item-object) for the updated items.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`PATCH /items/articles`
```json
{
	"keys": [1, 2],
	"data": {
		"status": "published"
	}
}
```
</template>

<template #graphql>

`POST /graphql`
```graphql
mutation {
	update_articles_items(ids: [1, 2], data: { status: "published" }) {
		id
		status
	}
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, updatedItems} from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(
    updatedItems('articles', ['5', '6'], {
        'status' : 'published'
    })
);

console.log(result);
```
</template>

</SnippetToggler>

---

## Delete an Item

Delete an existing item.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`DELETE /items/:collection/:id`
</template>

<template #graphql>

`POST /graphql`
```graphql
type Mutation {
	delete_<collection>_item(id: ID!): delete_one
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, deleteItem} from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(deleteItem('collection_name', 'id'));

console.log(result);
```
</template>
</SnippetToggler>

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`DELETE /items/articles/15`
</template>

<template #graphql>

`POST /graphql`
```graphql
mutation {
	delete_articles_item(id: 15) {
		id
	}
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, deleteItem} from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(deleteItem('articles', '5'));

console.log(result);
```
</template>

</SnippetToggler>

---

## Delete Multiple Items

Delete multiple existing items.

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`DELETE /items/:collection`
```json
// Array
[value_1, value_2, value_3]
```

```json
// Object 
{
	"field": [value_1, value_2, value_3]
}
```

```json
// Object containing query
{
	"query": {
		"query_type": {
			"field_1": {
				"filter_condition": "value_1"
			}
		}
	}
}
```
</template>

<template #graphql>

`POST /graphql`

```graphql
type Mutation {
	delete_<collection>_items(ids: [ID!]!): delete_many
}
```
</template>

<template #sdk>

```js

import { createDirectus } from '@directus/sdk';
import { rest, deleteItems} from '@directus/sdk/rest';
const client = createDirectus('app_url').with(rest())

const result = await client.request(deleteItems('collection_name', ['id_1','id_2']));

//or

const result2 = await client.request(
    deleteItems('collection_name', {
        "query": {
            "query_type": {
                "field_1": {
                    "filter_condition": "value_1"
                }
            }
        }
    }
));

console.log(result);
```
</template>

</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of item primary keys or an object containing either `keys` or `query` to select what items to update.

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">

<template #rest>

`DELETE /items/articles`
```json
// Array of primary keys
[15, 16, 21]
```

```json
// Object containing keys
{
	"keys": [15, 16, 21]
}
```

```json
// Object containing query
{
	"query": {
		"filter": {
			"status": {
				"_eq": "draft"
			}
		}
	}
}
```
</template>

<template #graphql>

`POST /graphql`
```graphql
mutation {
	delete_articles_items(ids: [15, 16, 21]) {
		ids
	}
}
```
</template>

<template #sdk>

```js
import { createDirectus } from '@directus/sdk';
import { rest, deleteItems} from '@directus/sdk/rest';
const client = createDirectus('https://directus.example.com').with(rest())

const result = await client.request(deleteItems('articles', ['6','7']));

//or

const result2 = await client.request(
    deleteItems('articles', {
        "query": {
            "filter": {
                "status": {
                    "_eq": "draft"
                }
            }
        }
    }
));

console.log(result);
```
</template>

</SnippetToggler>




