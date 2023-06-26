---
contributors: Esther Agbaje
description: Learn how to use the new Directus JavaScript SDK to access your data.
---

# Getting Started with the JavaScript SDK

Learn how to use the new Directus JavaScript SDK to easily access and manipulate your data.

## Features

This SDK is a significant overhaul of the previous version, introducing new features and improvements.

- **TypeScript first:** Written in TypeScript, the SDK provides a robust and type-safe development experience
- **Modular architecture:** The SDK is split into separate modules, giving you granular control over which features to
  include and which can be pruned at build-time
- **Lightweight and dependency-free:** It does not require external libraries, ensuring a lighter bundle and streamlined
  experience.

::: warning SDK in Beta

The new SDK is in Beta, so we recommend using it in a staging environment first before deploying it to production.

:::

## Installation

Install the SDK using the following command:

```js
npm install @directus/sdk@beta
```

## Basic Usage

Create the directus client using the `useDirectus` hook from `@directus/sdk@beta`. The client gives you access to your
Directus project and data.

```ts
import { useDirectus } from '@directus/sdk@beta';

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
- `auth()`: Authentication functions, adds `.login(...)`, `.logout()`, and .`refresh()` to the client.
- `realtime()`: WebSocket connectivity, adds `.subscribe(...)` and `.message(...)` to the client.
- `subscription()`: GraphQL Subscriptions, adds `.subscription()` to the client. (work in progress).

For example, to create a client with REST or GraphQL support, use the following:

```js
import { useDirectus } from '@directus/sdk@beta';
import { rest, graphql } from '@directus/sdk@beta/composable';

// Client with REST support
const client = useDirectus('http://directus.example.com').use(rest());

// Client with GraphQL support
const client = useDirectus('http://directus.example.com').use(graphql());
```

## Authentication

Use the `authentication()` composable to authenticate with the client.

For example, to login to your directus instance, invoke the `login` method

```js
import { useDirectus } from '@directus/sdk@beta';
import { authentication } from '@directus/sdk@beta/composable';

const client = useDirectus('http://directus.example.co').use(authentication());
await client.login(email, password);
```

## Making Requests

To query or update your collection in Directus, use the `rest()` or `graphql()` composable.

### Using REST

Add the `rest()` composable to the client, this enables the `.request(...)` method to query the collection.

For example, to make a request to an `articles` collection.

#### Read a single item

JavaScript

```js
import { useDirectus, readItem } from '@directus/sdk@beta';
import { rest } from '@directus/sdk@beta/composable';

const client = useDirectus('http://directus.example.com').use(rest());
const result = await client.request(readItem('articles', 5));
```

TypeScript

```ts
import { useDirectus, readItem } from '@directus/sdk@beta';
import { rest } from '@directus/sdk@beta/composable';

type Schema = {
	articles: { title: string; content: string };
};

const client = useDirectus<Schema>('http://directus.example.com').use(rest());
const result = await client.request(readItem('articles', 5));
```

#### Read all items

```js
import { useDirectus, readItems } from '@directus/sdk@beta';
import { rest } from '@directus/sdk@beta/composable';

const client = useDirectus('http://directus.example.com').use(rest());
const result = await client.request(readItems('articles'));
```

#### Read specific fields

```js
import { useDirectus, readItems } from '@directus/sdk@beta';
import { rest } from '@directus/sdk@beta/composable';

const client = useDirectus('http://directus.example.com').use(rest());
const result = await client.request(
	readItems('articles', {
		fields: ['id', 'title'],
	})
);
```

#### Read all fields

```js
import { useDirectus, readItems } from '@directus/sdk@beta';
import { rest } from '@directus/sdk@beta/composable';

const client = useDirectus('http://directus.example.com').use(rest());
const result = await client.request(
	readItems('articles', {
		fields: ['*'],
	})
);
```

#### Read nested fields

```js
import { useDirectus, readItems } from '@directus/sdk@beta';
import { rest } from '@directus/sdk@beta/composable';

const client = useDirectus('http://directus.example.com').use(rest());
const result = await client.request(
	readItems('articles', {
		fields: ['*', { author: ['*'] }],
	})
);
```

### Using GraphQL

Add the `graphql()` composable to the client, this enables the `.query(...)` method to query the collection.

For example, to make a request to an `articles` collection.

```ts
import { useDirectus } from '@directus/sdk@beta';
import { graphql } from '@directus/sdk@beta/composable';

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

As you progress, you may want to explore other available features like real-time updates, and GraphQL subscriptions.

Keep an eye on our documentation as we continue to enhance and expand the SDK.

If you encounter any issues or have questions, don't hesitate to reach out to us in our
[Discord community](https://directus.chat/).

## Backward Compatibility

The older Directus SDK will still work and your existing applications that use the older version will continue to
function without any issues.
