---
description: REST and GraphQL API documentation on the comments in Directus.
pageClass: page-reference
---

# Comments

> Comments are a collaboration tool and can be left on items from the sidebar.

## The Comment Object

`collection` **string**\
Collection identifier in which the item resides.

`id` **uuid**\
Unique identifier for the object.

`item` **string**\
The item the comment is created for.

`comment` **string**\
User comment. This will store the comments that show up in the right sidebar of the item edit page in the Data Studio.

`date_created` **timestamp**\
Timestamp in ISO8601 when the comment was created.

`date_updated` **timestamp**\
Timestamp in ISO8601 when the comment was last updated.

`user_created` **many-to-one**\
The user who created the comment. Many-to-one to [users](/reference/system/users#the-users-object).

`user_updated` **many-to-one**\
The user who last updated the comment. Many-to-one to [users](/reference/system/users#the-users-object).

```json
{
	"collection": "articles",
	"id": "2fab3b9d-0543-4b87-8a30-3c5ee66fedf1",
	"item": "15",
	"comment": "This is a comment on an article",
	"date_created": "2023-01-15T09:14:52Z",
	"date_updated": "2023-01-15T09:00:00Z",
	"user_created": "12e62fd0-29c7-4fd3-b3d3-c7a39933e8af",
	"user_updated": "12e62fd0-29c7-4fd3-b3d3-c7a39933e8af"
}
```

## Get Comments

Returns a list of comments.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /comments`

`SEARCH /comments`

If using SEARCH you can provide a [query object](/reference/query) as the body of your request.

[Learn more about SEARCH.](/reference/introduction#search-http-method)

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	flows: [directus_comments]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readComments } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(readComments(query));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

An array of up to [limit](/reference/query#limit) [comment objects](#the-comment-object). If no items are available,
data will be an empty array.

## Get Comment by ID

Returns a single comment by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /comments/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	comment_by_id(id: ID!): directus_comments
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readComment } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readComment(comment_id, query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns a [comment object](#the-comment-object) if a valid identifier was provided.

## Create a Comment

Create a new comment. This action is only available to authenticated users.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /comments`

Provide a [comment object](#the-comment-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_comments_item(data: create_directus_comments_input): directus_comments
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createComment } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createComment(comment_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [comment object](#the-comment-object).

### Response

Returns the [comment object](#the-comment-object) of the comment that was created.

## Create Multiple Comments

Create multiple new comments. This action is only available to authenticated users.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /comments`

Provide an array of [comment objects](#the-comment-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_comments_items(data: [create_directus_comments_input]): [directus_comments]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createComments } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createComments(comment_object_array));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [comment objects](#the-comment-object). `name` is required.

### Response

Returns an array of [comment objects](#the-comment-object) of the comments that were created.

## Update a Comment

Update an existing comment. This action is only available to authenticated users.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /comments/:id`

Provide a partial [comment object](#the-comment-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_comments_item(id: ID!, data: update_directus_comments_input): directus_comments
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateComment } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateComment(comment_id, partial_comment_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [comment object](#the-comment-object).

### Response

Returns the [comment object](#the-comment-object) of the comment that was updated.

## Update Multiple Comments

Update multiple existing comments. This action is only available to authenticated users.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /comments`

```json
{
	"keys": comment_id_array,
	"data": partial_comment_objects
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_comments_items(ids: [ID!]!, data: update_directus_comments_input): [directus_comments]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateComments } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateComments(comment_id_array, partial_comment_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the comments you'd like to update.

`data` **Required**\
Any of [the comment object](#the-comment-object)'s properties.

### Response

Returns the [comment objects](#the-comment-object) of the comments that were updated.

## Delete a Comment

Delete an existing comment. This action is only available to authenticated users.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /comments/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_comments_item(id: ID!): delete_one
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteComment } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteComment(comment_id));
```

</template>
</SnippetToggler>

### Response

Empty body.

## Delete Multiple Comments

Delete multiple existing comments. This action is only available to authenticated users.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /comments`

Provide an array of item IDs as your request body.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_comments_items(ids: [ID!]!): delete_many
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteComments } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteComments(comment_id_array));
```

</template>
</SnippetToggler>

#### Request Body

An array of comment primary keys.

### Returns

Empty body.
