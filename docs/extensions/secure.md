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
function exec('log', message: string)
```

== Example

```js
function exec('log', 'Hello, world!')
```

:::


The `log` execution type is available in all Directus Secure Extensions with no further permissions required. 

## Request

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

Explain required permissions

## Database Interactions

### Create Items

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

Explain required permissions

### Read Items

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

### Update Items

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

### Delete Items

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

Explain required permissions

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
