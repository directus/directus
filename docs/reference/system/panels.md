---
description: REST and GraphQL API documentation on the Panels collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Panels

> Panels are modular units of data visualization that exist within the Insights module. Each panel exists within a
> Dashboard and can be positioned and resized as needed.

[Learn more about Panels](/user-guide/insights/dashboards).

## The Panel Object

`id` **uuid**\
Primary key of the panel.

`dashboard` **many-to-one**\
Dashboard where this panel is visible. Many-to-one to [dashboards](/reference/system/dashboards).

`name` **string**\
Name of the panel.

`icon` **string**\
Material design icon for the panel.

`color` **string**\
Accent color of the panel.

`show_header` **boolean**\
Whether or not the header should be rendered for this panel.

`note` **string**\
Description for the panel.

`type` **string**\
The panel type used for this panel.

`position_x` **integer**\
The X position on the workspace grid.

`position_y` **integer**\
The Y position on the workspace grid.

`width` **integer**\
Width of the panel in number of workspace dots.

`height` **integer**\
Height of the panel in number of workspace dots.

`options` **JSON**\
Arbitrary options for the panel. Differs per panel type.

`date_created` **Date**\
When the panel was created

`user_created` **many-to-one**\
User that created the panel. Many-to-one to [users](/reference/system/users).

```json
{
	"id": "22640672-eef0-4ee9-ab04-591f3afb2883",
	"dashboard": "a79bd1b2-beb2-49fc-8a26-0b3eec0e2697",
	"name": "30-day sales",
	"icon": "paid",
	"color": "#6B8068",
	"show_header": true,
	"note": "Overview of the sales numbers in the last 30 days",
	"type": "time-series",
	"position_x": 1,
	"position_y": 1,
	"width": 8,
	"height": 6,
	"options": {},
	"date_created": "2023-01-05T19:05:51.884Z",
	"user_created": "fd066644-c8e5-499d-947b-fe6c6e1a1473"
}
```

## List Panels

List all panels that exist in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /panels`

`SEARCH /panels`

If using SEARCH you can provide a [query object](/reference/query) as the body of your request.

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	panels: [directus_panels]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readPanels } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readPanels(query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [panel objects](#the-panel-object). If no items are available, data
will be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /panels`

`SEARCH /panels`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	panels {
		id
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readPanels } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readPanels({
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Retrieve a Panel

List an existing panel by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /panels/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	panels_by_id(id: ID!): directus_panels
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readPanel } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readPanel(panel_id, query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the requested [panel object](#the-panel-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /panels/2fc325fb-299b-4d20-a9e7-a34349dee8b2`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	panels_by_id(id: "2fc325fb-299b-4d20-a9e7-a34349dee8b2") {
		id
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readPanel } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readPanel('bf5d1373-3eea-431f-aaac-54591ba5ecf1', {
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Create a Panel

Create a new panel.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /panels`

Provide a [panel object](#the-panel-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_panels_item(data: create_directus_panels_input!): directus_panels
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createPanel } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createPanel(panel_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [panel object](#the-panel-object).

### Response

Returns the [panel object](#the-panel-object) for the created panel.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /panels`

```json
{
	"name": "My Panel",
	"icon": "architecture"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_panels_item(data: { name: "My Panel", icon: "panels" }) {
		id
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createPanel } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createPanel({
		name: 'sales chart',
		type: 'bar-chart',
		dashboard: '2418e38c-2f0b-460a-b46d-37b63106bcdc',
		width: 12,
		height: 10,
		position_x: 10,
		position_y: 10,
	})
);
```

</template>
</SnippetToggler>

## Create Multiple Panels

Create multiple new panels.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /panels`

Provide an array of [panel objects](#the-panel-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_panels_items(data: [create_directus_panels_input!]!): [directus_panels]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createPanels } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createPanels(panel_object_array));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [panel objects](#the-panel-object).

### Response

Returns the [panel object](#the-panel-object) for the created panel.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /panels`

```json
[
	{
		"name": "My Panel",
		"icon": "architecture"
	},
	{
		"name": "Another Panel",
		"icon": "person"
	}
]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_panels_items(data: [{ name: "My Panel", icon: "architecture" }, { name: "Another Panel", icon: "person" }]) {
		id
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createPanels } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createPanels([
		{
			name: 'sales chart',
			type: 'bar-chart',
			dashboard: '2418e38c-2f0b-460a-b46d-37b63106bcdc',
			width: 12,
			height: 10,
			position_x: 20,
			position_y: 10,
		},
		{
			name: 'authorship percentage',
			type: 'pie-chart',
			dashboard: '2418e38c-2f0b-460a-b46d-37b63106bcdc',
			width: 12,
			height: 10,
			position_x: 10,
			position_y: 10,
		},
	])
);
```

</template>
</SnippetToggler>

## Update a Panel

Update an existing panel.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /panels/:id`

Provide a partial [panel object](#the-panel-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_panels_item(id: ID!, data: update_directus_panels_input): directus_panels
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updatePanel } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updatePanel(panel_id, partial_panel_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [panel object](#the-panel-object).

### Response

Returns the [panel object](#the-panel-object) for the updated panel.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /panels/2fc325fb-299b-4d20-a9e7-a34349dee8b2`

```json
{
	"name": "My Updated Panel"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_panels_item(id: "2fc325fb-299b-4d20-a9e7-a34349dee8b2", data: { name: "My Updated Panel" }) {
		id
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updatePanel } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updatePanel('8d4acee9-f266-4664-801d-11d0273e9bfe', {
		height: 20,
		width: 20,
	})
);
```

</template>
</SnippetToggler>

## Update Multiple Panels

Update multiple existing panels.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /panels`

```json
{
	"keys": panel_id_array,
	"data": partial_panel_object
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_panels_items(ids: [ID!]!, data: update_directus_panels_input): [directus_panels]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updatePanels } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updatePanels(panel_id_array, partial_panel_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the panels you'd like to update.

`data` **Required**\
Any of [the panel](#the-panel-object)'s properties.

### Response

Returns the [panel objects](#the-panel-object) for the updated panels.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /panels`

```json
{
	"keys": ["3f2facab-7f05-4ee8-a7a3-d8b9c634a1fc", "7259bfa8-3786-45c6-8c08-cc688e7ba229"],
	"data": {
		"color": "#6644FF"
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_panels_items(
		ids: ["3f2facab-7f05-4ee8-a7a3-d8b9c634a1fc", "7259bfa8-3786-45c6-8c08-cc688e7ba229"]
		data: { color: "#6644FF" }
	) {
		id
		name
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updatePanels } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updatePanels(['8d4acee9-f266-4664-801d-11d0273e9bfe', '4a98c02e-62ac-4ceb-aabc-990ce603eb78'], {
		position_x: 30,
	})
);
```

</template>
</SnippetToggler>

## Delete a Panel

Delete an existing panel.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /panels/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_panels_item(id: ID!): delete_one
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deletePanel } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deletePanel(panel_id));
```

</template>
</SnippetToggler>

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /panels/12204ee2-2c82-4d9a-b044-2f4842a11dba`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_panels_item(id: "12204ee2-2c82-4d9a-b044-2f4842a11dba") {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deletePanel } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deletePanel('8d4acee9-f266-4664-801d-11d0273e9bfe'));
```

</template>
</SnippetToggler>

## Delete Multiple Panels

Delete multiple existing panels.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /panels`

Provide an array of panel IDs as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_panels_items(ids: [ID!]!): delete_many
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deletePanels } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deletePanels(panel_id_array));
```

</template>
</SnippetToggler>

### Request Body

An array of panels primary keys

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /panels`

```json
["25821236-8c2a-4f89-8fdc-c7d01f35877d", "02b9486e-4273-4fd5-b94b-e18fd923d1ed", "7d62f1e9-a83f-407b-84f8-1c184f014501"]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_panels_items(
		ids: [
			"25821236-8c2a-4f89-8fdc-c7d01f35877d"
			"02b9486e-4273-4fd5-b94b-e18fd923d1ed"
			"7d62f1e9-a83f-407b-84f8-1c184f014501"
		]
	) {
		ids
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deletePanels } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	deletePanels(['8d4acee9-f266-4664-801d-11d0273e9bfe', '4a98c02e-62ac-4ceb-aabc-990ce603eb78'])
);
```

</template>
</SnippetToggler>
