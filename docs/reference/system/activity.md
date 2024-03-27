---
description: REST and GraphQL API documentation on the Activity collection in Directus.
readTime: 4 min read
pageClass: page-reference
---

# Activity

> All events within Directus are tracked and stored in the activities collection. This gives you full accountability
> over everything that happens. [Learn more about Activity](/user-guide/overview/glossary#activity).

## The Activity Object

`action` **string**\
Action that was performed.

`collection` **string**\
Collection identifier in which the item resides.

`comment` **string**\
User comment. This will store the comments that show up in the right sidebar of the item edit page in the admin app.

`id` **integer**\
Unique identifier for the object.

`ip` **string**\
The IP address of the user at the time the action took place.

`item` **string**\
Unique identifier for the item the action applied to. This is always a string, even for integer primary keys.

`timestamp` **string**\
When the action happened.

`user` **many-to-one**\
The user who performed this action. Many-to-one to [users](/reference/system/users#the-users-object).

`user_agent` **string**\
User agent string of the browser the user used when the action took place.

`revisions` **one-to-many**\
Any changes that were made in this activity. One-to-many to [revisions](/reference/system/revisions#the-revisions-object).

```json
{
	"action": "create",
	"collection": "articles",
	"comment": null,
	"id": 5,
	"ip": "139.178.128.0",
	"item": "1",
	"timestamp": "2021-02-02T12:50:26-05:00",
	"user": "2d321940-69f5-445f-be6b-c773fa58a820",
	"user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.2 Safari/605.1.15",
	"revisions": [4]
}
```

## List Activity Actions

Returns a list of activity actions.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /activity`

`SEARCH /activity`

If using SEARCH you can provide a [query object](/reference/query) as the body of your request.

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	activity: [directus_activity]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readActivities } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readActivities(query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

An array of up to [limit](/reference/query#limit) [activity objects](#the-activity-object). If no items are available,
data will be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /activity`

`SEARCH /activity`

</template>
<template #graphql>

```graphql
query {
	activity {
		# ...
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readActivities } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readActivities({
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Retrieve Activity Action

Returns a single activity action by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /activity/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	activity_by_id(id: ID!): directus_activity
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readActivity } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readActivity(activity_id, query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns an [activity object](#the-activity-object) if a valid identifier was provided.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /activity/15`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	activity_by_id(id: 15) {
		# ...
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readActivity } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readActivity('53281', {
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Create a Comment

Creates a new comment on a given item.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /activity/comment`

```json
{
	"collection": collection_name,
	"item": item_id,
	"comment": comment_content
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_comment(collection: String!, item: ID!, comment: String!): directus_activity
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createComment } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(
	createComment({
		collection: collection_name,
		item: item_id,
		comment: comment_content,
	})
);
```

</template>
</SnippetToggler>

#### Request Body

`collection` **Required**\
Collection in which the item resides.

`item` **Required**\
Primary Key of the item to comment on.

`comment` **Required**\
The comment content. Supports Markdown.

### Response

Returns the [activity object](#the-activity-object) of the created comment.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /activity/comment`

```json
{
	"collection": "pages",
	"item": 3,
	"comment": "Hello World"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_comment(collection: "pages", item: 3, comment: "Hello World") {
		# ...
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createComment } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createComment({
		collection: 'articles',
		item: '18',
		comment: 'This is the wrong article to publish!',
	})
);
```

</template>
</SnippetToggler>

## Update a Comment

Updates an existing comment by activity action primary key.

### Response

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /activity/comment/:id`

```json
{
	"comment": comment_content
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_comment(id: ID): delete_one
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateComment } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(
	updateComment(comment_id, {
		comment: comment_content,
	})
);
```

</template>
</SnippetToggler>

#### Request Body

`comment` **Required**\
The updated comment content. Supports Markdown.

### Response

Returns the [activity object](#the-activity-object) of the created comment.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /activity/comment/15`

```json
{
	"comment": "Hello World!!"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_comment(id: 3, comment: "Hello World") {
		# ...
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateComment } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateComment('53727', {
		comment: 'Great work!',
	})
);
```

</template>
</SnippetToggler>

## Delete a Comment

Deletes a comment.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /activity/comment/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_comment(id: ID): delete_one
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

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /activity/comment/15`

</template>
<template #graphql>

```graphql
mutation {
	delete_comment(id: 3) {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteComment } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteComment('53727'));
```

</template>
</SnippetToggler>
