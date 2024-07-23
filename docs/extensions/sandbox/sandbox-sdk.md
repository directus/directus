---
description: Learn about the permissions and functions available in Directus Sandboxed Extensions
contributors: Rijk van Zanten, Nils Twelker, Kevin Lewis, Esther Agbaje
---

# Sandbox SDK

As the name implies, sandboxed extensions run in complete isolation. This also means that they don't have any access to
the database, network, or filesystem by default.

In order for extensions to interact with the project's database or host environment, it has to use functions that are
made available through the virtual `directus:api` Sandbox SDK. Each function that's used from this SDK is checked
against the configured permissions of the extension, ensuring that extensions don't have access to anything it
shouldn't.

## Basic Usage

Sandbox SDK functions can be imported from `directus:api` as if it's any other ESM module:

```js
import { log } from 'directus:api';

log('Hello World');
```

::: warning

Sandboxed extensions can not import any other third party modules.

:::

## TypeScript

The functions exposed through `directus:api` are generated virtually, and therefore don't have automatically
introspected types. To enable full type checking for these virtual functions, you can use the `api.d.ts` file that's
shipped with the `@directus/extensions` package.

You can reference the type file directly in your TS files (like in the example before), or add it to the `tsconfig.json`
file to enable it globally for your extension.

```ts
/// <reference types="@directus/extensions/api.d.ts" />

import type { SandboxEndpointRouter } from 'directus:api';
import { request } from "directus:api";

export default (router: SandboxEndpointRouter) => {
	router.get("/hello", async () => {
		const response = await request("https://directus.io", {
			method: 'POST'
		});

		return {
			status: 200,
			body: response.data,
		};
	});
};
```

## Reference

The following SDK functions are currently available:

- [Log](#log)
- [Sleep](#sleep)
- [Request](#request)

### Log

The `log` function will print a message in the API's logger output. It can be used as a replacement for `console.log`.

::: tabs

== Signature

```ts
type SandboxLogFn = (message: string) => void;
```

== Example

```js
import { log } from 'directus:api';

log('Hello World!');
```

:::

#### Required Scopes

In order to use `log`, your extension needs to have the `log` property present in the requested scopes:

```json{9}
"directus:extension": {
	"type": "endpoint",
	"path": "dist/index.js",
	"source": "src/index.js",
	"host": "^10.7.0",
	"sandbox": {
		"enabled": true,
		"requestedScopes": {
			"log": {}
		}
	}
}
```

---

### Sleep

The `sleep` function will wait for a given amount of time. It can be used as a replacement for `setTimeout`.

::: tabs

== Signature

```ts
type SandboxSleepFn = (milliseconds: number) => Promise<void>;
```

== Example

```js
import { sleep } from 'directus:api';

await sleep(1000);
```

:::

#### Required Scopes

In order to use `sleep`, your extension needs to have the `sleep` property present in the requested scopes:

```json{9}
"directus:extension": {
	"type": "endpoint",
	"path": "dist/index.js",
	"source": "src/index.js",
	"host": "^10.7.0",
	"sandbox": {
		"enabled": true,
		"requestedScopes": {
			"sleep": {}
		}
	}
}
```

---

### Request

The `request` function will make a network request to the given URL.

::: tabs

== Signature

```ts
interface SandboxRequestResponse {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	data: string | Record<string, unknown>;
}

type SandboxRequestFn = (
	url: string,
	options: {
		method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
		body?: Record<string, any> | string;
		headers?: Record<string, string>;
	}
) => Promise<SandboxRequestResponse>;
```

== Example

```js
import { request } from 'directus:api';

const response = await request('https://directus.io');
```

:::

#### Required Scopes

In order to use `request`, your extension needs to have the `request` property present in the requested scopes,
specifying the methods and URLs you want to use:

```json{9-12}
"directus:extension": {
	"type": "endpoint",
	"path": "dist/index.js",
	"source": "src/index.js",
	"host": "^10.7.0",
	"sandbox": {
		"enabled": true,
		"requestedScopes": {
			"request": {
				"methods": ["GET"],
				"urls": ["https://directus.io/*"]
			}
		}
	}
}
```

The URLs configuration in the requested scopes for the request operation supports wildcards. For example, if you want to
allow any sub-path, use `https://directus.example.com/items/*`.
