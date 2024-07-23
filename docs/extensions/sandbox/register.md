---
description: Learn about the ways to register extensions in the sandbox
contributors: Rijk van Zanten
---

# Registering Extensions in the Sandbox

The way extensions are registered in the sandbox closely follows the syntax of the existing extension types, but there
are some subtle yet crucial differences in how data is passed back and forth to the API.

## Hooks

Hooks are registered by exporting a default function that gets an object with the `filter` and `action` properties that
can be used to register filters and actions respectively.

```js
import { log } from 'directus:api';

export default ({ filter, action }) => {
	filter('items.create', (payload) => {
		log('Creating Item!');
	});

	action('items.create', (payload) => {
		log('Item created!');
	});
};
```

The callback functions for the hooks get the payload that triggered the event as the only parameter.

### TypeScript

You can import the `SandboxHookRegisterContext` type from `directus:api` to type the registration context object:

```ts
/// <reference types="@directus/extensions/api.d.ts" />

import { log } from 'directus:api';
import type { SandboxHookRegisterContext } from 'directus:api';

export default ({ filter, action }: SandboxHookRegisterContext) => {
	filter('items.create', (payload) => {
		log('Creating Item!');
	});

	action('items.create', (payload) => {
		log('Item created!');
	});
};
```

## Endpoints

Endpoints are registered by exporting a default function that gets a `router` object as it's only parameter:

```js
export default (router) => {};
```

This router object can be used register individual route handlers:

```js
export default (router) => {
	const handler = async (request) => ({ status: 200, body: 'hello world' });

	router.get('/', handler);
	router.post('/', handler);
	router.put('/', handler);
	router.patch('/', handler);
	router.delete('/', handler);
};
```

The handler function for each route gets a `request` object, and is expected to return a `response` object.

```ts
interface SandboxEndpointRequest {
	url: string;
	headers: Record<string, string>;
	body: any;
}

interface SandboxEndpointResponse {
	status: number;
	body: string | Record<string, unknown>;
}
```

### TypeScript

You can import the `SandboxEndpointRouter` type from `directus:api` to type the router object:

```ts
/// <reference types="@directus/extensions/api.d.ts" />

import type { SandboxEndpointRouter } from 'directus:api';

export default (router: SandboxEndpointRouter) => {
	router.get('/', () => {
		return {
			status: 200,
			body: 'Hello World',
		}
	});
};
```

## Operations

Usage of the App registration is identical to it's non-sandboxed counterpart, so please refer to the existing
documentation on [Operations](/extensions/operations) for more information.

The API entrypoint is identical in basic structure. To register the API entrypoint for a custom operation, return an
object defining an ID and handler function:

```js
import { log } from 'directus:api';

export default {
	id: 'custom',
	handler: ({ text }) => {
		log(text);
	},
};
```

The handler function receives the data payload of the current in-flight flow.

### TypeScript

You can import the `SandboxOperationConfig` type from `directus:api` to type the operation object:

```ts
/// <reference types="@directus/extensions/api.d.ts" />

import { log } from "directus:api";
import type { SandboxOperationConfig } from "directus:api";

const operation: SandboxOperationConfig = {
	id: 'custom',
	handler: ({ text }) => {
		log(text);
	},
};

export default operation;
```
