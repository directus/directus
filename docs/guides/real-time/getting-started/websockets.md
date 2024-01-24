---
contributors: Kevin Lewis, Esther Agbaje
description: "Learn how to get started with Directus' WebSockets interface."
---

# Getting Started with WebSockets and the Directus SDK

You can connect to a Directus project using a WebSocket interface and get updates on data held in a collection in
real-time.

This guide will show you how to get started with Directus' Realtime SDK and JavaScript. WebSockets are
language-agnostic, so you can apply the same set of steps in your stack of choice.

::: info Want to use WebSockets without the SDK?

To get started with WebSockets without the SDK please refer to our
[Getting Started with WebSockets guide](/guides/real-time/getting-started/websockets-js.md).

:::

## Before You Begin

You will need a Directus project. If you don’t already have one, the easiest way to get started is with our
[managed Directus Cloud service](https://directus.cloud). You can also self-host Directus, ensuring the
`WEBSOCKETS_ENABLED` environment variable is set to `true`.

Create a new collection called `messages`, with a `date_created` field enabled in the _Optional Fields_ pane on
collection creation. Create an input field called `text` and a second called `user`.

If it doesn’t already exist, create a user with a role that can execute **read**, **create** and **update** operations
on the collection.

Finally in the Directus Data Studio, create a static access token for the user, copy it, and save the user profile.

Create an `index.html` file and open it in your code editor. Add the following boilerplate code:

```html
<!DOCTYPE html>
<html>
	<body>
		<script>
			const url = 'wss://your-directus-url/websocket';
			const access_token = 'your-access-token';
			const collection = 'messages';
		</script>
	</body>
</html>
```

Make sure to replace `your-directus-url` and `your-access-token` with your project and user details.

## Import the SDK Composables

At the top of the `<script>` tag, import the composables needed for the SDK

```html
<!doctype html>
<html>
	<body>
		<script>
			import { createDirectus, staticToken, realtime } from 'https://www.unpkg.com/@directus/sdk/dist/index.js'; // [!code ++]

			const url = 'wss://your-directus-url/websocket';
			const access_token = 'your-access-token';
			const collection = 'messages';
		</script>
	</body>
</html>
```

- `staticToken` is used to authenticate the client we'll create shortly.
- `createDirectus` is a function that initializes a Directus client.
- `realtime` provides methods to establish a WebSocket connection.

## Create a Realtime Client with Authentication

To authenticate the client using a static token and receive realtime updates about changes in your data, add the
following code at the bottom of your `<script>` to create a client:

```js
const client = createDirectus(url)
  .with(staticToken(access_token))
  .with(realtime());
```

Establish a connection:

```js
await client.connect();
```

To listen for when changes are made to an item in your data, use the `onWebSocket` method

```js

client.onWebSocket('open', function () {
	console.log({ event: 'onopen' });
});

client.onWebSocket('message', function (message) {
	const { type,  data } = message;
	console.log({ event: 'onmessage', data });
});

client.onWebSocket('close', function () {
	console.log({ event: 'onclose' });
});

client.onWebSocket('error', function (error) {
	console.log({ event: 'onerror', error });
});
```

Open `index.html` in your browser and open the Developer Tools. You should immediately receive a message in return to
confirm. The connection is now authenticated and will remain open, ready to send and receive data.

[Learn more about WebSocket authentication here.](/guides/real-time/authentication)

## Create a Subscription

After subscribing to collections over your connection, you will receive new messages whenever items in the collection
are created, updated, or deleted.

At the bottom of your `<script>`, create a new function `subscribe` which subscribes to a collection:

```js
async function subscribe() {
  const { subscription } = await client.subscribe('messages', {
    event: 'update',
    query: { fields: ['user', 'text'] },
  });

  for await (const item of subscription) {
    console.log(item);
  }
}

subscribe();
```

Save your file, refresh your browser, and open your browser console.

You will receive a message in response to confirm the subscription has been initialized. Then, new messages will be sent
when there’s an update on the collection.

## Create Item

Create a new function that sends a message over the connection with a `create` action:

```js
function createItem(text, user) {
  client.sendMessage({
    type: 'items',
    collection: 'messages',
    action: 'create',
    data: { text, user },
  });
}
```

Save your file, refresh your browser, and open your browser console. Create a few new items by using your new function
directly in the console:

```js
createItem('Hello World!', 'Ben');
createItem('Hello Universe!', 'Rijk');
createItem('Hello Everyone Everywhere All At Once!', 'Kevin');
```

Every time you create an item, you will receive a message in response with the new item as created in your Directus
collection.

![Directus Data Studio Content Module showing the Messages collection with three items in it - one for each time the above command was run in the console.](https://cdn.directus.io/docs/v9/guides/websockets/getting-started-messages-collection.webp)

## Get Latest Item

You can use your connection to perform all CRUD actions by using `type: 'items'` in the payload and including the
respective `action`. Create a new function for reading the latest message:

```js
function readLatestItem() {
  client.sendMessage({
    type: 'items',
    collection: 'messages',
    action: 'read',
    query: { limit: 1, sort: '-date_created' },
  });
}
```

Send the message over the connection by entering `readLatestItem()` your browser console. You will receive a message
with the result of your query on the collection.

## Pings To Keep Connection Active

You may have noticed that, periodically, you will receive a message with a type of `ping`. This serves two purposes:

1. To act as a periodic message to stop your connection from closing due to inactivity. This may be required by your
   application technology stack.
2. To verify that the connection is still active.

In order to prevent the connection from closing, you may reply with a pong event:

```js
client.onWebSocket('message', (message) => {
  if (message.type === 'ping') {
    client.sendMessage({
      type: 'pong',
    });
  }
});
```

On Directus Cloud, this feature is enabled. If you are self-hosting, you can alter this behavior with the
`WEBSOCKETS_HEARTBEAT_ENABLED` and `WEBSOCKETS_HEARTBEAT_PERIOD` environment variables.

You may wish to exclude these messages from your application logic.

## In Summary

In this guide, you have successfully created a new WebSocket connection, authenticated yourself, and performed CRUD
operations over the connection. You have also created your first subscription.

[Learn more about subscriptions with WebSockets with Directus.](/guides/real-time/subscriptions/websockets)

## Full Code Sample

```html
<!DOCTYPE html>
<html>
  <body>
    <script>
      import {
        createDirectus,
        staticToken,
        realtime,
      } from 'https://www.unpkg.com/@directus/sdk/dist/index.js';

      const url = 'wss://your-directus-url/websocket';
      const access_token = 'your-access-token';
      const collection = 'messages';

      const client = createDirectus(url)
        .with(staticToken(access_token))
        .with(realtime());

      await client.connect();

      client.onWebSocket('open', function () {
        console.log({ event: 'onopen' });
      });

      client.onWebSocket('message', function (message) {
        const { type, data } = message;
        if (message.type == 'auth' && message.status == 'ok') {
          subscribe();
          console.log({ event: 'onmessage', data });
        }

      });

      client.onWebSocket('close', function () {
        console.log({ event: 'onclose' });
      });

      client.onWebSocket('error', function (error) {
        console.log({ event: 'onerror', error });
      });

      const { subscription } = await client.subscribe(collection, {
        event: 'update',
        query: { fields: ['user', 'text'] },
      });

      for await (const item of subscription) {
        console.log(item);
      }

      function createItem(text, user) {
        client.sendMessage({
          type: 'items',
          collection: collection,
          action: 'create',
          data: { text, user },
        });
      }

      function readLatestItem() {
        client.sendMessage({
          type: 'items',
          collection: collection,
          action: 'read',
          query: { limit: 1, sort: '-date_created' },
        });
      }
    </script>
  </body>
</html>
```
