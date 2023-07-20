---
contributors: Esther Agbaje
description: Learn how to use the Directus JavaScript SDK to work with your data and files.
---

# Getting Started with the JavaScript SDK

Learn how to use the new Directus JavaScript SDK to easily access and manipulate your data.

If you have any questions or feedback on/about the new SDK, please join us in
[`#new-sdk`](https://discord.com/channels/725371605378924594/1121094628037361768) on Discord!

::: warning SDK in Beta

The new SDK is currently in Beta, so we do not recommend using it in production.

:::

## Features

This SDK is a significant overhaul of the previous version, introducing new features and improvements.

- **TypeScript first:** The SDK provides a robust and type-safe development experience
- **Modular architecture:** The SDK is split into separate modules, giving you granular control over which features to
  include and which can be pruned at build-time
- **Lightweight and dependency-free:** It does not require external libraries, ensuring a lighter bundle and streamlined
  experience.

## Installation

Install the SDK from the `beta` tag:

```js
npm install @directus/sdk@beta
```

## Basic Usage

Create a Directus client using the `createDirectus` hook from `@directus/sdk`. The client gives you access to your
Directus project and data.

```ts
import { createDirectus } from '@directus/sdk';

// Your Directus collection schema
interface Schema {
	// ...
}

const client = createDirectus<Schema>('http://directus.example.com');
```

## Creating a Composable Client

The new SDK introduces the concept of a "Composable Client" which allows you to customize and build a client with the
specific features you need.

The client starts as an empty wrapper without any functionality. To add features, use the following composables:

- `rest()`: REST request functions, adds `.request(...)` to the client.
- `graphql()`: GraphQL request functions, adds `.query(...)` to the client.
- `auth()`: Authentication functions, adds `.login(...)`, `.logout()`, and .`refresh()` to the client.
- `realtime()`: WebSocket connectivity, adds `.subscribe(...)` and `.message(...)` to the client.
- `subscription()`: GraphQL Subscriptions, adds `.subscription()` to the client. (Coming soon).

For example, to create a client with REST or GraphQL support, use the following:

```js
import { createDirectus } from '@directus/sdk';
import { rest } from '@directus/sdk/rest';
import { graphql } from '@directus/sdk/graphql';

// Client with REST support
const client = createDirectus('http://directus.example.com').with(rest());

// Client with GraphQL support
const client = createDirectus('http://directus.example.com').with(graphql());
```

## Authentication

Use the `authentication()` composable to add user login and tokens auto-refresh to the client.

For example, to login to your directus instance, invoke the `login` method

```js
import { createDirectus } from '@directus/sdk';
import { authentication } from '@directus/sdk/auth';

const client = createDirectus('http://directus.example.com').with(authentication());

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
import { createDirectus } from '@directus/sdk@beta';
import { rest } from '@directus/sdk@beta/rest';
import { readItem } from '@directus/sdk@beta/rest/commands';

const client = createDirectus('http://directus.example.com').with(rest());

const result = await client.request(readItem('articles', 5));
```

TypeScript

```ts
import { createDirectus } from '@directus/sdk@beta';
import { rest } from '@directus/sdk@beta/rest';
import { readItem } from '@directus/sdk@beta/rest/commands';

interface Article {
	id: number;
	title: string;
	content: string;
}

interface Schema {
	articles: Article[];
}

const client = createDirectus<Schema>('http://directus.example.com').with(rest());

const result = await client.request(readItem('articles', 5));
```

#### Read all items

```js
import { createDirectus } from '@directus/sdk@beta';
import { rest } from '@directus/sdk@beta/rest';
import { readItems } from '@directus/sdk@beta/rest/commands';

const client = createDirectus('http://directus.example.com').with(rest());

const result = await client.request(readItems('articles'));
```

#### Read specific fields

```js
import { createDirectus } from '@directus/sdk@beta';
import { rest } from '@directus/sdk@beta/rest';
import { readItems } from '@directus/sdk@beta/rest/commands';

const client = createDirectus('http://directus.example.com').with(rest());

const result = await client.request(
	readItems('articles', {
		fields: ['id', 'title'],
	})
);
```

#### Read all fields

```js
import { createDirectus } from '@directus/sdk@beta';
import { rest } from '@directus/sdk@beta/rest';
import { readItems } from '@directus/sdk@beta/rest/commands';

const client = createDirectus('http://directus.example.com').with(rest());

const result = await client.request(
	readItems('articles', {
		fields: ['*'],
	})
);
```

#### Read nested fields

```js
import { createDirectus } from '@directus/sdk@beta';
import { rest } from '@directus/sdk@beta/rest';
import { readItems } from '@directus/sdk@beta/rest/commands';

const client = createDirectus('http://directus.example.com').with(rest());

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
import { createDirectus } from '@directus/sdk';
import { graphql } from '@directus/sdk/graphql';

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

## Next Steps

You have successfully created a composable client using the Directus SDK.

As you progress, you may want to explore other available features like real-time updates, and GraphQL subscriptions.

Keep an eye on our documentation as we continue to enhance and expand the SDK and take a look at the auto-generated
[TypeDoc of the new SDK](</packages/@directus/SDK (beta)/>) to explore all available functions.

If you encounter any issues or have questions, don't hesitate to reach out to us in our
[Discord community](https://directus.chat/) in
[the `#new-sdk` channel](https://discord.com/channels/725371605378924594/1121094628037361768).
