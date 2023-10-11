---
description: Learn about the permissions and execution types available in Directus Secure Extensions
contributors: Nils Twelker, Kevin Lewis, Esther Agbaje
---

# Execution Types

In a Secure Extension, the `exec` function is an asynchronous operation that returns a `Promise` object. It executes a specific operation defined by an execution type.

```js
await exec(executionType, ...additionalArguments)
```

The first argument of the `exec` function is an `executionType` string, which represents the type of operation to be conducted. The `executionType` should correspond to a valid, available execution type.

Additional parameters required by the `exec` function depend on the provided execution type. These are added after the `executionType` parameter.

There are built-in execution types provided with the `exec` function that are available to all extensions, irrespective of its permissions, while other execution types may be added through granted permissions. 

:::warning Handle Optional Permissions

If an invalid or non-existent `executionType` is passed to the `exec` function, it will throw an error. If you set some permissions as optional, you should handle both cases where they are and are not granted.

:::



## Log

The `log` execution type allows you to show a message in the console as `console.log` is not available in isolates.

::: tabs

== Signature

```js
async function exec('log', message: string)
```

== Example

```js
await exec('log', 'Hello, world!');
```

:::


The `log` execution type is available in all Directus Secure Extensions with no further permissions required. 

## Request

The `request` execution type allows you to make HTTP requests as `fetch` is unavilable in an isolate. 

::: tabs

== Signature

```js
async function exec('request', url: string, options?: {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: string,
  headers?: Record<string, string>,
  output: 'text' | 'json'
}): Promise<string | Record<string, any>>
```

== Simple Example

```js
const text = await exec('request', 'https://example-api.com');
```

== Complex Example

```js
const text = await exec('request', 'https://example-api.com', {
	method: 'GET',
	headers: {
		'User-Agent': 'Directus Extension'
	}
});
```

:::

The `request` execution type requires the following permissions are added to your extension's metadata: 

```js
{
	permission: 'request',
	optional: boolean,
	allowedUrls: string[]
}
```

`optional` can be omitted and will default to `false`. 

`allowedUrls` contains an array of strings, which may be regex or use wildcard notation.

## Database Interactions

Isolates do not have the abiltiy to access your collections by default. By enabling any of the Create/Read/Update/Delete (CRUD) execution types in your extension, you will be able to perform these actions.

:::info No Single Item CRUD Operations

In the current release, all database interaction execution types are for multiple items.

:::

### Create Items

The `create-items` execution type allows you to create items in collections in your Directus project.

::: tabs

== Signature

```js
async function exec('create-items', collection: string, options: {
	data: Record<string, unknown>[]
}): Promise<any>
```

== Example

```js
const items = await exec('create-items', 'articles', {
	data: [{ title: 'Hello World' }]
});
```

:::

The `create-items` execution type requires the following permissions are added to your extension's metadata:

```js
{
	permission: 'create-items',
	optional: boolean,
	role: string
}
```

`optional` can be omitted and will default to `false`. 

`role` accepts the id of a role in your Directus project to control what collections can be accessed.


### Read Items

::: tabs

== Signature

```js
async function exec('read-items', collection: string, options: {
	query?: Query 
}): Promise<any>
```

== Example

```js
const items = await exec('read-items', 'articles', {
	query: { limit: 5, sort: '-date_published' }
});
```

:::

The `read-items` execution type requires the following permissions are added to your extension's metadata:

```js
{
	permission: 'read-items',
	optional: boolean,
	role: string
}
```

`optional` can be omitted and will default to `false`. 

`role` accepts the id of a role in your Directus project to control what collections can be accessed.

### Update Items

::: tabs

== Signature

```js
async function exec('update-items', collection: string, options: {
	query?: Query, data: Record<string, unknown> 
}): Promise<any>
```

== Example

```js
const items = await exec('update-items', 'articles', {
	query: { id: { _eq: '42' } },
	data: { title: 'The Hitchhiker\'s Guide to the Galaxy' }
});
```

:::

The `update-items` execution type requires the following permissions are added to your extension's metadata:

```js
{
	permission: 'update-items',
	optional: boolean,
	role: string
}
```

`optional` can be omitted and will default to `false`. 

`role` accepts the id of a role in your Directus project to control what collections can be accessed.

### Delete Items

::: tabs

== Signature

```js
async function exec('delete-items', collection: string, options: {
	query?: Query
}): Promise<any>
```

== Example

```js
const items = await exec('update-items', 'articles', {
	query: { id: { _eq: '404' } },
});
```

:::

The `delete-items` execution type requires the following permissions are added to your extension's metadata:

```js
{
	permission: 'delete-items',
	optional: boolean,
	role: string
}
```

`optional` can be omitted and will default to `false`. 

`role` accepts the id of a role in your Directus project to control what collections can be accessed.

## Hooks

### Register Filter

::: tabs

== Signature

```js
async function exec('register-filter', {
  event: string,
  handler: (meta: any, { accountability: any }): Promise<any> | any
});
```

== Example

```js
await exec('register-filter', {
	event: 'items.create'
	handler: async (data) => {
		await exec('log', 'An item is about to be created');
		return data;
	}
});
```

:::

The `register-filter` execution type is available in all Directus Secure Extensions with no further permissions required. All events are exposed. 

### Register Action

::: tabs

== Signature

```js
async function exec('register-action', {
  event: string,
  handler: (payload: any, meta: any, { accountability: any }): Promise<void> | void
})
```

== Example

```js
await exec('register-action', {
	event: 'items.create'
	handler: async (data) => {
		await exec('log', 'An item has been created');
		return data;
	}
});
```

:::

The `register-action` execution type is available in all Directus Secure Extensions with no further permissions required. All events are exposed. 

## Endpoints

### Register Endpoint

The Secure Extensions Framework intentionally limits your access to the scoped router which defines your endpoint's paths. 

Instead of being able to define the namespace of your endpoints, Secure Extensions will always use the full extension name. For example, an extension with name `directus-extension-my-extension` will have all of it's endpoints under `https://example.directus.app/directus-extension-my-extension/`. 

::: tabs

== Signature

```js
async function exec('register-endpoint', {
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  handler: (req: {
			url: string,
			headers: Record<string, string>,
			body: string,
			baseUrl: string
		}
	): Promise<{
		status: number,
		body: string | Record<string, any>
	}>,
});
```

== Example

```js
await exec('register-endpoint', {
	method: 'POST',
	path: '/',
	handler: async function (request) {
		return {
			status: 200,
			body: `The body received was ${request.body}!`
		}
	}
});
```

:::

The `register-action` execution type is available in all Directus Secure Extensions with no further permissions required.

## Operations

### Register Operation

::: tabs

== Signature

```js
async function exec('register-operation', {
	id: string,
	handler: (data: Record<string, any>): Promise<void | Record<string, any>>,
});
```

== Example

```js
await exec('register-operation', {
	id: 'custom',
	handler: async ({ text }) => {
		return {
			test: `The text given was ${ text }`
		}
	},
});
```

:::
