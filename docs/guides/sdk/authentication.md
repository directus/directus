---
contributors: Kevin Lewis, Tim de Heiden
description: Learn about all of the ways to control authentication with the Directus SDK
---

# Directus SDK Authentication

The Directus SDK provides multiple ways to [authenticate your requests](/reference/authentication), by either generating
an access/refresh tokens through login, or by setting a static token.

## Generate, Use, and Refresh Access Tokens

### Using the `authentication()` Composable

```js
import { createDirectus, authentication } from '@directus/sdk';
const client = createDirectus('http://directus.example.com').with(authentication());
await client.login(email, password);
await client.refresh();
await client.logout();
```

This approach will handle token refreshing automatically. The current token is stored inside of the initialized client.

### Using the `rest()` Composable

```js
import { createDirectus, rest, login, refresh, logout } from '@directus/sdk';
const client = createDirectus('http://directus.example.com').with(rest());
const user = await client.request(login(email, password));
await client.request(refresh('REFRESH TOKEN'));
await client.request(logout('REFRESH TOKEN'));
```

Note that each of the authentication methods must be imported from the SDK. The refresh token must be stored manually
and used when refreshing or invalidating a token.

### Using the `realtime()` Composable

```js
import { createDirectus, realtime } from '@directus/sdk';
const client = createDirectus('http://directus.example.com').with(realtime());
client.send(JSON.stringify({ type: 'auth', email: email, password: password}));
```

When using Directus Realtime's [default 'handshake' authentication strategy](/guides/real-time/authentication), the
first message sent must include authentication details - either an `email` and `password`, or an `access_token` (shown
below).

## Set a Token

### Create a Directus Client with a Token

```js
import { createDirectus, staticToken, rest } from '@directus/sdk';
const client = const client = createDirectus('http://directus.example.com')
  .with(staticToken('TOKEN'))
  .with(rest());
```

### Set a Token for Single Requests

```js
import { createDirectus, rest, withToken, readItems } from '@directus/sdk';
const client = createDirectus('http://directus.example.com').with(rest());
const request = await client.request(
  withToken('TOKEN', readItems('collection'))
);
```

### Set a Client Token Manually

```js
import { createDirectus, authentication } from '@directus/sdk';
const client = createDirectus('http://directus.example.com').with(authentication());
await client.setToken('TOKEN');
```

### Authenticate Realtime Connection with a Token

```js
import { createDirectus, realtime } from '@directus/sdk';
const client = createDirectus('http://directus.example.com').with(realtime());
client.send(JSON.stringify({ type: 'auth', access_token: 'TOKEN' }));
```

While the property may be called `access_token`, you can also pass a static or refresh token as a value.

## Get a Token

### Using the `authentication()` Composable

```js
import { createDirectus, authentication } from '@directus/sdk';
const client = createDirectus('http://directus.example.com').with(authentication());
const token = await client.getToken();
```

### Using the `staticToken()` Composable

```js
import { createDirectus, staticToken } from '@directus/sdk';
const client = createDirectus('http://directus.example.com').with(staticToken('TOKEN'));
const token = await client.getToken();
```

## Configure Custom Storage

Internally, the `getToken()` and `setToken()` implement an overwritable storage mechanism, which can be customized for
your environment's needs. There must be a `get()` and `set()` method exposed, and the `AuthData` type returned.

### Example

Instead of storing `AuthData` in an object in the browser, this custom storage implementation stores and retrieves data
in `localStorage`:

```js
import { createDirectus, authentication } from '@directus/sdk';

class LocalStorage {
  get() {
    return localStorage.getItem("directus-data");
  }
  set(data) {
    localStorage.setItem("directus-data", JSON.stringify(data));
  }
}

const client = createDirectus('http://directus.example.com')
  .with(authentication({ storage: new LocalStorage() }));

client.setToken('TOKEN');
```

Note that an instance of the `LocalStorage` was created in the options of the `authentication()` composable.

## Cross-Domain Cookies

A common situation is for the Directus backend and frontend to be hosted on different domains, requiring extra
configuration to make sure cookies are passed correctly. This can be set globally for each composable. This will then
apply to all requests made using that composable:

```js
const client = createDirectus('http://directus.example.com')
  .with(authentication('cookie', { credentials: 'include' }))
  .with(graphql({ credentials: 'include' }))
  .with(rest({ credentials: 'include' }));
```

Or you can enable this only for specific REST requests using the following helper:

```js
const result = await client.request(
  withOptions(login(email, password), { credentials: 'include' })
);
```
