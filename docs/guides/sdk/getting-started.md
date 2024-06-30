---
contributors: Esther Agbaje, Kevin Lewis
description: Learn how to use the Directus JavaScript SDK to work with your data and files.
---

# Directus JavaScript SDK

Learn how to use the new Directus JavaScript SDK to easily access and manipulate your data.

::: info Older SDK Documentation

You can find the SDK reference for older versions (prior to v11) [here](/reference/old-sdk). Version 11 introduced a
complete rewrite, and was released in July 2023.

:::

## Features

- **TypeScript first:** The SDK provides a robust and type-safe development experience
- **Modular architecture:** The SDK is split into separate modules, giving you granular control over which features to
  include and which can be pruned at build-time
- **Lightweight and dependency-free:** It does not require external libraries, ensuring a lighter bundle and streamlined
  experience.

## Installation

Install the SDK:

```shell
npm install @directus/sdk
```

## Basic Usage

Create a Directus client using the `createDirectus` hook from `@directus/sdk`. The client gives you access to your
Directus project and data.

```js
import { createDirectus } from '@directus/sdk';

const client = createDirectus('http://directus.example.com');
```

::: tip TypeScript Version

The SDK requires a minimum TypeScript version of 5.0 but it is recommended to keep up to date with the latest version.

:::

## Creating a Composable Client

The Directus SDK is a "Composable Client" that allows you to customize and build a client with the specific features you
need. The client starts as an empty wrapper without any functionality. To add features, use the following composables:

- `rest()`: REST request functions, adds `.request(...)` to the client.
- `graphql()`: GraphQL request functions, adds `.query(...)` to the client.
- `authentication()`: Authentication functions including refresh logic, adds `.login(...)`, `.logout()`, and
  .`refresh()` to the client.
- `staticToken()`: Authentication functions for static tokens.
- `realtime()`: WebSocket connectivity, adds `.connect()`, `.subscribe(...)`, `.sendMessage(...)` and
  `.onWebSocket(...)` to the client.

For example, to create a client with REST or GraphQL support, use the following:

::: code-group

```js [JavaScript]
import { createDirectus, rest, graphql } from '@directus/sdk';

// Client with REST support
const client = createDirectus('http://directus.example.com').with(rest());

// Client with GraphQL support
const client = createDirectus('http://directus.example.com').with(graphql());
```

```ts [TypeScript]
import { createDirectus, rest, graphql } from '@directus/sdk';

interface Article {
	id: number;
	title: string;
	content: string;
}

interface Schema {
	articles: Article[];
}

// Client with REST support
const client = createDirectus<Schema>('http://directus.example.com').with(rest());

// Client with GraphQL support
const client = createDirectus<Schema>('http://directus.example.com').with(graphql());
```

:::

If using TypeScript, you need to provide a `Schema` when creating a Directus client to make use of type hinting and
completion. This schema contains definitions for each collection and provides you with type hints (on input) and
completion (on output).

## Authentication

Use the `authentication()` composable to add user login and tokens auto-refresh to the client.

For example, to login to your directus instance, invoke the `login` method

```js
import { createDirectus, authentication } from '@directus/sdk';

const client = createDirectus('http://directus.example.com').with(authentication());

await client.login(email, password);
```

There are many ways to create authenticated requests with the Directus SDK.
[Read our SDK Authentication guide](/guides/sdk/authentication) for more.

## Making Requests

To query or update your collection in Directus, use the `rest()` or `graphql()` composable.

### Using REST

Add the `rest()` composable to the client, this enables the `.request(...)` method to query the collection.

For example, to make a request to an `articles` collection.

#### Read a single item

```js
import { createDirectus, rest, readItem } from '@directus/sdk';

const client = createDirectus('http://directus.example.com').with(rest());

const article_id = 5;
const result = await client.request(readItem('articles', article_id));
```

#### Read all items

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('http://directus.example.com').with(rest());

const result = await client.request(readItems('articles'));
```

#### Read specific fields

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('http://directus.example.com').with(rest());

const result = await client.request(
	readItems('articles', {
		fields: ['id', 'title'],
	})
);
```

#### Read all fields

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('http://directus.example.com').with(rest());

const result = await client.request(
	readItems('articles', {
		fields: ['*'],
	})
);
```

#### Read nested fields

```js
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('http://directus.example.com').with(rest());

const result = await client.request(
	readItems('articles', {
		fields: ['*', { author: ['*'] }],
	})
);
```

#### Custom endpoints

To call custom endpoints using the SDK, you can either manually write a command or use the `customEndpoint` helper,
which allows you to type the output of the custom endpoint.

```ts
import { createDirectus, rest, customEndpoint } from '@directus/sdk';

const client = createDirectus('http://directus.example.com').with(rest());

const result = await client.request(customEndpoint<OutputType>({
	path: '/custom/endpoint',
	method: 'GET',
}));

// or manually without types
const manualResult = await client.request(() => ({
	path: '/custom/endpoint',
	method: 'GET',
}));
```

### Using GraphQL

Add the `graphql()` composable to the client, this enables the `.query(...)` method to query the collection.

For example, to make a request to an `articles` collection with TypeScript:

```ts
import { createDirectus, graphql } from '@directus/sdk';

interface Article {
	id: number;
	title: string;
	content: string;
}

interface Schema {
	articles: Article[];
}

const client = createDirectus<Schema>('http://directus.example.com').with(graphql());

const result = await client.query<Article[]>(`
    query {
        articles {
            id
            title
            content
        }
    }
`);
```

## Global APIs

To keep the SDK dependency-free, it does rely on the APIs mentioned below, which originally came from the browser
ecosystem and may not be available in all environments.

#### The `fetch` API

This API is shipped with almost every modern runtime. Nevertheless, there might be reasons to overwrite or set the
implementation, for example, if an alternative implementation is preferred or if you actually work with a special
runtime where `fetch` is not available.

- [`node-fetch`](https://www.npmjs.com/package/node-fetch)
- [`ofetch`](https://www.npmjs.com/package/ofetch)
- [`whatwg-fetch`](https://www.npmjs.com/package/whatwg-fetch)

#### The `URL` API

This API is shipped with almost every modern runtime. However, there are exceptions, like `react-native`, that require a
polyfill for the SDK to work.

- [`url-polyfill`](https://www.npmjs.com/package/url-polyfill)
- [`react-native-url-polyfill`](https://www.npmjs.com/package/react-native-url-polyfill)

#### The `WebSocket` API

This API is optional if you're not making use of the `realtime()` features in the SDK. Backend JavaScript environments
often do not ship with an implementation of WebSockets.

- [`ws`](https://www.npmjs.com/package/ws)
- [`isomorphic-ws`](https://www.npmjs.com/package/isomorphic-ws)

#### The `logger` API

This API is optional and currently only used for debugging the `realtime()` features. This will default to the `Console`
however in environments where this isn't shipped you can overwrite this with any logger.

### Polyfilling

These can be overwritten in two ways:

1. Via options parameter of the `createDirectus` function.  
   (Takes precedence over the second way)

```ts
import { createDirectus } from '@directus/sdk';
import { ofetch } from 'ofetch';
import WebSocket from 'ws';

const client = createDirectus('http://directus.example.com', {
  globals: {
    WebSocket: WebSocket,
    fetch: ofetch,
  }
});
```

2. Directly via the `globalThis` object.

```ts
import { createDirectus } from '@directus/sdk';
import { ofetch } from 'ofetch';
import WebSocket from 'ws';

globalThis.WebSocket = WebSocket;
globalThis.fetch = ofetch;

// Polyfill libraries will often register itself to the globalThis object.
// For example, the following URL polyfill for react-native.
import 'react-native-url-polyfill/auto';

const client = createDirectus('http://directus.example.com');
```

## Next Steps

You can find code examples using the Directus SDK throughout our [API reference](/reference/items).

You can also find an auto-generated [TypeDoc of the new SDK](/packages/@directus/sdk/).
