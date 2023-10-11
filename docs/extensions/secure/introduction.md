---
description: Learn about the Directus Secure Extensions Framework to isolate and build trust in your extensions.
contributors: Nils Twelker, Kevin Lewis, Esther Agbaje
---

# Secure Extensions

The Secure Extensions Framework is designed to provide robust security to your data and maintain strict control over interactions with the external environment. The main purpose is to allow configurations that limit how extensions access your information and communicate externally.

The Secure Extensions Framework is available for API and Hybrid Extensions.

::: info Directus Marketplace

In the future, API and Hybrid extensions must be built with the Secure Extensions Framework to be distributed in the Directus Marketplace (coming soon).

:::

## Understanding Isolates 

An isolate is a secure environment to evaluate and execute extensions. The environment is given capabilities via an `exec` function exposed by Directus. While the `exec` function has minimal default capabilities, it can be extended through extension permissions. 

Isolates only have access to [JavaScript standard built-in objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects). This means that common runtime functions such as `console` and `setTimeout` are not available. 

## Creating Secure Extensions

When using the CLI provided with the Directus Extensions SDK to scaffold a new extension, you will be given the option to create a Secure Extension. This will use our new templates for creating Secure Extensions.

You can run the CLI from your terminal with the following command:

```
npx create-directus-extension@latest
```

Secure Extensions have the following properties in the `package.json` file:

- A `secure` property with the value of `true`.
- A `permissions` property which is an array of required and optional permissions.

## Exeuction Types

The `exec` function is an asynchronous operation that returns a `Promise` object. It executes a specific operation defined by an execution type.

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
await exec('log', 'Hello, world!')
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
})
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
})
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
})
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
})
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
})
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

### Register Action

Explainer

::: tabs

== Signature

```js
// To Include
```

== Example

```js
// To Include
```

:::

### Register Filter

Explainer

::: tabs

== Signature

```js
// To Include
```

== Example

```js
// To Include
```

:::

## Endpoints

### Register Endpoint

Explainer

::: tabs

== Signature

```js
// To Include
```

== Example

```js
// To Include
```

:::

## Operations

### Register Operation

Explainer

::: tabs

== Signature

```js
// To Include
```

== Example

```js
// To Include
```

:::
