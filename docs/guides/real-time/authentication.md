---
contributors: Kevin Lewis
description: "Learn about Directus' real-time security and authentication settings."
---

# WebSocket & GraphQL Authentication

Authentication is an important part of establishing your persistent connection with a Directus project.

## Authentication Modes

There are three authentication modes in Directus.

| Mode          | Description                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| **public**    | No authentication is required.                                                                                  |
| **handshake** | No authentication required to connect. First message must be an authentication request sent before the timeout. |
| **strict**    | Authentication is required as a URL parameter on the initial connection.                                        |

### Changing Authentication Modes

Your whole project will use the same, single, authentication mode. You cannot use multiple authentication modes in a
single project.

By default, the `handshake` authentication mode is used. If self-hosting your project, you may change the mode used by
setting the `WEBSOCKETS_REST_AUTH`, `WEBSOCKETS_GRAPHQL_AUTH` and `WEBSOCKETS_LOGS_AUTH` environment variables.

## REST Authentication Flow

### Public Mode

You do not need to authenticate if using a public authentication mode, but you are limited to the public role only.

If you want to change your role, follow the flow for the `handshake` authentication mode.

### Handshake Mode

Your first message must include authentication details and be sent before the timeout. There are three options:

**Access Token**

```json
{
	"type": "auth",
	"access_token": "your-access-token"
}
```

**Email and Password**

```json
{
	"type": "auth",
	"email": "user@email.com",
	"password": "your-password"
}
```

**Refresh Token**

```json
{
	"type": "auth",
	"refresh_token": "token"
}
```

On successful authentication you’ll receive a confirmation message. This message includes a `refresh_token` when using
email/password and refresh_token credentials.

```json
{
	"type": "auth",
	"status": "ok",
	"refresh_token": "a-token-to-use-later"
}
```

When the client receives an auth expired error, a new authentication request is expected within the set timeout or the
connection will be closed.

### Strict Mode

When initially opening your connection, add a `access_token` query parameter to your request.

Once initially authenticated, all 3 authentication are available.

## GraphQL Authentication Flow

GraphQL puts more responsibility on the client for handling the re-authentication flow and has no supported way for us
to implement it without breaking compatibility with existing clients. Because of this, you may only use an
`access_token` for authentication at this time.

When a token expires, the connection will be closed with a `Forbidden` message, signaling to the client to refresh their
`access_token` and reconnect.

### Public Mode

```js
import { createClient } from 'graphql-ws';

const client = createClient({
	url: 'ws://your-directus-url/graphql',
	keepAlive: 30000,
});
```

### Handshake Mode

```js
import { createClient } from 'graphql-ws';

const client = createClient({
	url: 'ws://your-directus-url/graphql',
	keepAlive: 30000,
	connectionParams: async () => {
		return { access_token: 'MY_TOKEN' };
	},
});
```

### Strict Mode

```js
import { createClient } from 'graphql-ws';

const client = createClient({
	url: 'ws://your-directus-url/graphql?access_token=your-access-token',
	keepAlive: 30000,
});
```

## Rate Limiter / Messenger

WebSockets and GraphQL Subscriptions use the same globally-set configuration for the rate limiter and messenger.
