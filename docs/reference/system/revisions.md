---
description: REST and GraphQL API documentation on the Revisions collection in Directus.
readTime: 2 min read
pageClass: page-reference
---

# Revisions

> Revisions are individual changes to items made. Directus keeps track of changes made, so you're able to revert to a
> previous state at will. [Learn more about Revisions](/user-guide/overview/glossary#revisions).

## The Revision Object

`id` **integer**\
Primary key of the revision.

`activity` **many-to-one**\
Related activity record. Many-to-one to [activity](/reference/system/activity).

`collection` **string**\
Collection in which this revision happened.

`item` **string**\
Primary key of the item that was changed.

`data` **object**\
Snapshot of the top-level item data.

`delta` **object**\
Snapshot of the changes made in this revision.

`parent` **many-to-one**\
Parent revision that triggered this revision. Many-to-one to revisions (recursive).

`version` **many-to-one**\
Associated version of this revision. Many-to-one to [versions](/reference/system/versions).

```json
{
	"id": 368,
	"activity": 438,
	"collection": "articles",
	"item": "1",
	"data": {
		"title": "Hello World"
	},
	"delta": {
		"title": "Hello from the Docs!"
	},
	"parent": null,
	"version": null
}
```

## List revisions

List all revisions that exist in Directus.

::: tip Permissions

The data returned in this endpoint will be filtered based on the user's permissions. For example, revisions that apply
to a collection that the current user doesn't have access to are stripped out.

:::

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /revisions`

`SEARCH /revisions`

If using SEARCH you can provide a [query object](/reference/query) as the body of your request.

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	revisions: [directus_revisions]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readRevisions } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readRevisions(query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [revision objects](#the-revision-object). If no items are available,
data will be an empty array.

### Examples

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /revisions`

`SEARCH /revisions`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	revisions {
		id
		data
		delta
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readRevisions } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readRevisions({
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Retrieve a revision

List an existing revision by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /revisions/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	revisions_by_id(id: ID!): directus_revisions
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readRevision } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readRevision(revision_id, query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the requested [revision object](#the-revision-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /revisions/322`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	revisions_by_id(id: 322) {
		id
		data
		delta
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readRevision } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readRevision('53201', {
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>
