---
contributors: Esther Agbaje
description: Learn how to use the new Directus JavaScript SDK to access your data.
---

# Getting Started with the JavaScript SDK

Learn how to use the new Directus JavaScript SDK to easily access and manipulate your data.

## Features

This SDK is a significant overhaul of the previous version, introducing new features and improvements.

- **TypeScript first:** It is now written in TypeScript, providing more robust and type-safe development experience.
- **Modular architecture:** The SDK is now split into separate modules, giving you granular control over the features
  that match your product needs.
- **Lightweight and dependency-free:** It does not require external libraries, ensuring a lighter bundle and streamlined
  experience.

::: warning SDK in Beta

The new SDK is in Beta, so we recommend using it in a staging environment first before deploying it to production.

:::

## Installation

Install the SDK using the following command:

```js
npm install @directus/sdk
```

## Basic Usage

Create the directus client using the `useDirectus` hook from `@directus/sdk`. The client gives you access to your
Directus project and data.

```ts
import { useDirectus } from '@directus/sdk';

// your Directus collection schema
type Schema = {
	// ...
};

const client = useDirectus<Schema>('http://directus.example.com');
```

## Creating a Composable Client

The new SDK introduces the concept of a "Composable Client" which allows you to customize and build a client with the
specific features you need.

The client starts as an empty wrapper without any functionality. To add features, use the following composables:

- `rest()`: REST request functions, adds `.request(...)` to the client.
- `graphql()`: GraphQL request functions, adds `.query(...)` to the client.
- `auth()`: Authentication functions, adds `.login(...)`, `.logout()`, and .`refresh()` to the client. (work in
  progress).
- `realtime()`: WebSocket connectivity, adds `.subscribe(...)` and `.message(...)` to the client. (work in progress).
- `subscription()`: GraphQL Subscriptions, adds `.subscription()` to the client. (work in progress).

For example, to create a client with REST and GraphQL support, use the following:

```ts
import { useDirectus } from '@directus/sdk';
import { rest, graphql } from '@directus/sdk/composable';

type Schema = {};

// Client with REST support
const client = useDirectus<Schema>('http://directus.example.com').use(rest());

// Client with GraphQL support
const client = useDirectus<Schema>('http://directus.example.com').use(graphql());
```

## Authentication

Use the `auth()` composable to authenticate with the client.

For example, to login to your directus instance, invoke the `login` method

```js
import { useDirectus } from '@directus/sdk';
import { auth } from '@directus/sdk/composable';

const client = useDirectus('http://directus.example.co').use(auth());
await client.login({ email, password });
```

## Making Requests

To query or update your collection in Directus, use the `rest()` or `graphql()` composable.

### Using REST

Add the `rest()` composable to the client, this enables the `.request(...)` method to query the collection.

For example, say you want to make a request to an `articles` collection.

#### Read a single item

```ts
import { useDirectus, readItem } from '@directus/sdk';
import { rest } from '@directus/sdk/composable';

type Schema = {
	articles: { title: string; content: string };
};

const client = useDirectus<Schema>('http://directus.example.com').use(rest());
const result = await client.request(readItem('articles', 5));
```

#### Read all items

```ts
import { useDirectus, readItems } from '@directus/sdk';
import { rest } from '@directus/sdk/composable';

type Schema = {
	articles: { title: string; content: string };
};

const client = useDirectus<Schema>('http://directus.example.com').use(rest());
const result = await client.request(readItems('articles'));
```

### Using GraphQL

Add the `graphql()` composable to the client, this enables the `.query(...)` method to query the collection.

For example, say you want to make a request to an `articles` collection.

```ts
import { useDirectus } from '@directus/sdk';
import { graphql } from '@directus/sdk/composable';

type Article = {
	title: string;
	content: string;
};

type Schema = {
	articles: Article;
};

const client = useDirectus<Schema>('http://directus.example.com').use(graphql());
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

> Feel free to customize the queries according to your project's GraphQL schema.

## Next Steps

You have successfully created a composable client using the Directus SDK.

As you progress, you may want to explore other available features like authentication, real-time updates, and GraphQL
subscriptions. Keep an eye on our documentation as we continue to enhance and expand the SDK with new features and
improvements.

If you encounter any issues or have questions, don't hesitate to reach out to us in our [Discord community](https://directus.chat/).

## Backward Compatibility

The older Directus SDK will still work and your existing applications that use the older version will continue to
function without any issues.

:::tip Migrate to the new SDK

We recommended that you migrate to the new SDK. This way, you can take advantage of the new features and improvements
that this SDK offers.

:::
