---
description: REST and GraphQL API documentation on the Extensions collection in Directus.
readTime: 1 min read
pageClass: page-reference
---

# Extensions

> The extensions endpoints are used by the Data Studio to retrieve what extensions to install.
> [Learn more about Extensions](/user-guide/overview/glossary#extensions).

## The Extension Object

`bundle` **string | null**\
Name of the bundle the extension is in.

`name` **string**\
Unique name of the extension.

#### Meta

Directus metadata for the extension. Where the configuration for the extension in the current project is stored.

`enabled` **boolean**\
Whether or not the extension is enabled.

#### Schema

Information about the installed extension. Can't be changed.

`type` **string**\
Type of the extension. One of `'interface'`, `'display'`, `'layout'`, `'module'`, `'panel'`, `'hook'`, `'endpoint'`, `'operation'`,
`'bundle'`.

`local` **boolean**\
Whether the extension exists in the local extensions folder or is loaded from `node_modules`.

`version` **string**\
The currently loaded version of the plugin as defined by its `package.json`.

`partial` **boolean**\
Whether or not a bundles entries can be individually disabled. This is applicable to bundle type extensions only.

```json
{
  "name": "my-bundle-operation",
  "bundle": "directus-extension-my-bundle",
  "schema": {
    "type": "operation",
    "local": true,
    "version": "1.0.0"
  },
  "meta": {
    "enabled": true
  }
}
```

## List Extensions

List the installed extensions and their configuration in the project.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /extensions/`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	extensions: [extension]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readExtensions } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readExtensions());
```

</template>
</SnippetToggler>

#### Query Parameters

This endpoint doesn't currently support any query parameters.

### Response

An array of interface extension keys.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /extensions/`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	extensions {
		name
		type
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readExtensions } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(readExtensions());
```

</template>
</SnippetToggler>

## Update an Extension

Update an existing extension.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /extensions/:bundleOrName/:name?`

Provide a partial [extension object](#the-extension-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_extensions_item(bundle: String, name: String!, data: update_directus_extensions_input!): directus_extensions
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateExtension } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(updateExtension(bundle, name, partial_extension_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Doesn't support any query parameters.

#### Request Body

A partial [extension object](#the-extension-object).

### Response

Returns the [extension object](#the-extension-object) for the updated extension.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /extensions/my-bundle/draw-interface`

```json
{
	"meta": {
		"enabled": false
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_extensions_item(bundle: null, name: "my-custom-display", data: { meta: { enabled: true } }) {
		name
		type
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateExtension } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateExtension('directus-extension-bundle', 'stock-display', {
		meta: {
			enabled: false
		},
	})
);
```

</template>
</SnippetToggler>
