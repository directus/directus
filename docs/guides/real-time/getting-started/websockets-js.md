---
contributors: Kevin Lewis
description: "Learn how to get started with Directus' WebSockets interface."
---

# Getting Started With WebSockets

You can connect to a Directus project using a WebSocket interface and get updates on data held in a collection in
real-time.

This guide will show you how to get started with Directus' WebSockets interface and JavaScript. WebSockets are
language-agnostic, so you can apply the same set of steps in your stack of choice.

## Before You Begin

You will need a Directus project. If you don’t already have one, the easiest way to get started is with our
[managed Directus Cloud service](https://directus.cloud). You can also self-host Directus, ensuring the
`WEBSOCKETS_ENABLED` environment variable is set to `true`.

Create a new collection called `messages`, with a `date_created` field enabled in the _Optional Fields_ pane on
collection creation. Create an input field called `text` and a second called `user`.

If it doesn’t already exist, create a user with a role that can execute read and create operations on the collection.

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

## Create a Connection

At the bottom of your `<script>`, add the following code to establish a new WebSocket connection:

```js
const connection = new WebSocket(url);
```

To add some feedback, add the following event handlers below your `connection` variable:

```js
connection.addEventListener('open', function () {
	console.log({ event: 'onopen' });
});

connection.addEventListener('message', function (message) {
	const data = JSON.parse(message.data);
	console.log({ event: 'onmessage', data });
});

connection.addEventListener('close', function () {
	console.log({ event: 'onclose' });
});

connection.addEventListener('error', function (error) {
	console.log({ event: 'onerror', error });
});
```

Open `index.html` in your browser and open the Developer Tools. You should see the `onopen` event logged in the console.

## Authenticate Your Connection

Once a connection is opened, you have to send a message to authenticate your session. If you don't, you'll receive a
message indicating there was an authentication failure.

```js
connection.addEventListener('open', function () {
	console.log({ event: 'onopen' });
// [!code ++]
	connection.send( // [!code ++]
		JSON.stringify({ // [!code ++]
			type: 'auth', // [!code ++]
			access_token, // [!code ++]
		}) // [!code ++]
	); // [!code ++]
});
```

You should immediately receive a message in return to confirm. The connection is now authenticated and will remain open,
ready to send and receive data.

[Learn more about WebSocket authentication here.](/guides/real-time/authentication)

## Create a Subscription

After subscribing to collections over your connection, you will receive new messages whenever items in the collection
are created, updated, or deleted.

At the bottom of your `<script>`, create a new function which subscribes to a collection:

```js
function subscribe() {
	connection.send(
		JSON.stringify({
			type: 'subscribe',
			collection: 'messages',
			query: { fields: ['*'] },
		})
	);
}
```

Save your file, refresh your browser, and open your browser console. Run this function by typing:

```js
subscribe();
```

You will receive a message in response to confirm the subscription has been initialized. Then, new messages will be sent
when there’s an update on the collection.

## Create Item

Create a new function that sends a message over the connection with a `create` action:

```js
function createItem(text, user) {
	connection.send(
		JSON.stringify({
			type: 'items',
			collection: 'messages',
			action: 'create',
			data: { text, user },
		})
	);
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
	connection.send(
		JSON.stringify({
			type: 'items',
			collection: 'messages',
			action: 'read',
			query: { limit: 1, sort: '-date_created' },
		})
	);
}
```

Send the message over the connection by entering `readLatestItem()` your browser console. You will receive a message
with the result of your query on the collection.

## Pings To Keep Connection Active

You may have noticed that, periodically, you will receive a message with a type of `ping`. This serves two purposes:

1. To act as a periodic message to stop your connection from closing due to inactivity. This may be required by your
   application technology stack.
2. To verify that the connection is still active.

In order to prevent the connection from _closing_, you may reply with a `pong` event:

```js
// Exemplary code
connection.addEventListener('message', (message) => {
	const data = JSON.parse(message.data);

	if (data.type === 'ping') {
		this.connection.send(
			JSON.stringify({
				type: 'pong',
			}),
		);
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
			const url = 'wss://your-directus-url/websocket';
			const access_token = 'your-access-token';
			const collection = 'messages';

			const connection = new WebSocket(url);

			connection.addEventListener('open', function () {
				console.log({ event: 'onopen' });
				connection.send(
					JSON.stringify({
						type: 'auth',
						access_token,
					})
				);
			});

			connection.addEventListener('message', function (message) {
				const data = JSON.parse(message.data);
				console.log({ event: 'onmessage', data });
			});

			connection.addEventListener('close', function () {
				console.log({ event: 'onclose' });
			});

			connection.addEventListener('error', function (error) {
				console.log({ event: 'onerror', error });
			});

			function subscribe() {
				connection.send(
					JSON.stringify({
						type: 'subscribe',
						collection: 'messages',
						query: {
							fields: ['*'],
						},
					})
				);
			}

			function createItem(text, user) {
				connection.send(
					JSON.stringify({
						type: 'items',
						collection: 'messages',
						action: 'create',
						data: { text, user },
					})
				);
			}

			function readLatestItem() {
				connection.send(
					JSON.stringify({
						type: 'items',
						collection: 'messages',
						action: 'read',
						query: { limit: 1, sort: '-date_created' },
					})
				);
			}
		</script>
	</body>
</html>
```
