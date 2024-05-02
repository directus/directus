---
contributors: Kevin Lewis, Tim de Heiden
description: Learn about all of the ways to control authentication with the Directus SDK
---

# Directus SDK Authentication

The Directus SDK provides multiple ways to [authenticate your requests](/reference/authentication), by either generating
access and refresh tokens through login, or by setting a static token.

## Generate, Use, and Refresh Access Tokens

### Using the `authentication()` Composable

The `authentication()` composable provides the Directus client with new methods related to authentication. It also
manages token storage and refreshing on your behalf.

```js
import { createDirectus, authentication } from '@directus/sdk';

const client = createDirectus('http://directus.example.com').with(authentication());

await client.login(email, password, options);
await client.refresh();
await client.logout();
```

This approach will handle refreshing of the token automatically. The current token is stored inside the initialized
client.

### Using the `rest()` Composable

```js
import { createDirectus, rest, login, refresh, logout } from '@directus/sdk';

const client = createDirectus('http://directus.example.com').with(rest());

const user = await client.request(login(email, password, options));
const authData = await client.request(refresh(mode, refresh_token));
await client.request(logout(refresh_token, mode));
```

The `mode` will either be `'json'`, `'cookie'` or `'session'`. If cookies are used, you don't need to set the second
parameter, as the token in your cookie will automatically be used.

This approach is manually sending API requests, the SDK does not store the returned tokens. You must store the access
token and provide it to following requests and the same for the refresh token if using authentication mode `'json'`.

### Using the `realtime()` Composable

```js
import { createDirectus, realtime } from '@directus/sdk';

const client = createDirectus('http://directus.example.com').with(realtime());

client.sendMessage({ type: 'auth', email: email, password: password });
```

When using Directus Realtime's [default 'handshake' authentication strategy](/guides/real-time/authentication), the
first message sent must include authentication details. This example uses the `email` & `password` combination, but
tokens can be used as well (see
[Authenticate Realtime Connection with a Token](#authenticate-realtime-connection-with-a-token)).

### Login Options

Both the `authentication` and `rest` composable `login` functions accept a login options object, which has the following
signature:

```ts
type LoginOptions = {
	/** The user's one-time-password (if MFA is enabled). */
	otp?: string;
	/** Whether to retrieve the refresh token in the JSON response, or in a httpOnly cookie. One of `json`, `cookie` or `session`. Defaults to `cookie`. */
	mode?: AuthenticationMode;
	/** Use a specific authentication provider (does not work for SSO that relies on browser redirects). */
	provider?: string;
};
```

## Set a Token

### Create a Directus Client with a Token

```js
import { createDirectus, staticToken, rest } from '@directus/sdk';

const client = createDirectus('http://directus.example.com')
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

// with access token or static token
client.sendMessage({ type: 'auth', access_token: 'TOKEN' });
// with refresh token
client.sendMessage({ type: 'auth', refresh_token: 'TOKEN' });
```

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

Internally, the `getToken()` and `setToken()` make use of the configurable storage, which can be customized for your
environment's needs. There must be a `get()` and `set()` method exposed, and the `AuthData` type returned.

### Example

Instead of storing `AuthData` in an object in the browser, this custom storage implementation stores and retrieves data
in `localStorage`:

```js
import { createDirectus, authentication } from '@directus/sdk';

class LocalStorage {
  get() {
    return JSON.parse(localStorage.getItem("directus-data"));
  }
  set(data) {
    localStorage.setItem("directus-data", JSON.stringify(data));
  }
}

const storage = new LocalStorage();
const client = createDirectus('http://directus.example.com')
  .with(authentication('json', { storage }));

// set a long term or static token without expiry information
client.setToken('TOKEN');

// set custom credentials to the storage
storage.set({
	access_token: 'token',
	refresh_token: 'token',
	expires_at: 123456789
});
```

Note that the `LocalStorage` class is for demonstration purposes only, in production it is not recommended to store
credentials in the `localStorage` of browsers.

## Cross-Domain Cookies

A common situation is for the Directus backend and frontend to be hosted on different domains, requiring extra
configuration to make sure cookies are passed correctly. Usually this is only required for authentication with cookies
but this can be set globally for each composable that does requests. This will then apply to all requests made using
that composable:

```js
const client = createDirectus('http://directus.example.com')
  .with(authentication('cookie', { credentials: 'include' }))
  .with(graphql({ credentials: 'include' }))
  .with(rest({ credentials: 'include' }));
```

Or you can enable this only for specific REST requests using the following helper:

```js
const result = await client.request(
  withOptions(refresh(), { credentials: 'include' })
);
```
