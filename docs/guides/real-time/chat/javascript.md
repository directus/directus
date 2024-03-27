---
contributors: Kevin Lewis
description: Learn how to build a real-time multi-user chat with WebSockets and JavaScript.
---

# Build a Multi-User Chat With JavaScript

In this guide, you will build a multi-user chat application with Directus’ WebSockets interface that authenticate users
with an existing account, show historical messages stored in Directus, allow users to send new messages, and immediately
updates all connected chats.

## Before You Start

### Set Up Your Directus Project

You will need a Directus project. If you don’t already have one, the easiest way to get started is with our
[managed Directus Cloud service](https://directus.cloud).

Create a new collection called `messages`, with `date_created` and `user_created` fields enabled in the _Optional System
Fields_ pane on collection creation. Create an input field called `text`.

Create a new Role called `Users`, and give Create and Read access to the `Messages` collection, and Read access to the
`Directus Users` system collection. Create a new user with this role. Make note of the password you set.

### Create an HTML Boilerplate

Create an `index.html` file and open it in your code editor:

```html
<!DOCTYPE html>
<html>
	<body>
		<form id="login">
			<label for="email">Email</label>
			<input type="email" id="email" />
			<label for="password">Password</label>
			<input type="password" id="password" />
			<button type="submit">Submit</button>
		</form>

		<ol></ol>

		<form id="new">
			<label for="message">Message</label>
			<input type="text" id="text" />
			<button type="submit">Submit</button>
		</form>

		<script></script>
	</body>
</html>
```

The first form will handle user login and the second will handle new message submissions. The empty `<ol>` will be
populated with messages.

Inside of the `<script>`, create a `url` variable being sure to replace `your-directus-url` with your project’s URL:

```js
const url = 'https://your-directus-url';
```

## Import the SDK Composables

At the top of the `<script>` tag, import the SDK composables needed for this project

```html
<!doctype html>
<html>
	<body>
		<script>
			import { createDirectus, authentication, realtime } from 'https://www.unpkg.com/@directus/sdk/dist/index.js'; // [!code ++]

			const url = 'https://your-directus-url';
		</script>
	</body>
</html>
```

- `createDirectus` is a function that initializes a Directus client.
- `authentication` provides methods to authenticate a user.
- `realtime` provides methods to establish a WebSocket connection.

## Establish and Authenticate a WebSocket Client

Create and authenticate the WebSocket client

```js
const client = createDirectus(url)
  .with(authentication())
  .with(realtime());
```

Now, extract the `email` and `password` values from the form. To do this, create event listeners which are triggered on
the form submissions:

```js
document.querySelector('#login').addEventListener('submit', function (event) {
	event.preventDefault();
});

document.querySelector('#new').addEventListener('submit', function (event) {
	event.preventDefault();
});
```

Within the `#login` form submit event handler, get access to the email and password values

```js
const email = event.target.elements.email.value;
const password = event.target.elements.password.value;
```

Now, call the login method on the client, passing the email and password

```js
document.querySelector('#login').addEventListener('submit', function (event) {
	event.preventDefault();

  const email = event.target.elements.email.value;
  const password = event.target.elements.password.value;

  client.login(email, password); // [!code ++]
});
```

Once the client is authenticated, immediately create a WebSocket connection:

```js
client.connect();
```

## Subscribe To Messages

As soon as you have successfully authenticated, a message will be sent. When this happens, subscribe to updates on the
`Messages` collection.

```js
client.onWebSocket('message', function (data) {
  if (data.type == 'auth' && data.status == 'ok') {
	  subscribe('update')
  }
});
```

Create a `subscribe` function that subscribes to events.

```js
async function subscribe(event) {
  const { subscription } = await client.subscribe('messages', {
    event,
    query: {
      fields: ['*', 'user_created.first_name'],
    },
  });

  for await (const message of subscription) {
    receiveMessage(message);
  }
}
```

When a subscription is started, a message will be sent to confirm. Create a `receiveMessage` function with the
following:

```js
if (data.type == 'subscription' && data.event == 'init') {
	console.log('subscription started');
}
```

_Open your `index.html` file in your browser, enter your user’s email and password, submit, and check the browser
console for this console log._

## Create New Messages

Within the `#new` form submit event handler, send a new message to create the item in your Directus collection:

```js
document.querySelector('#new').addEventListener('submit', function (event) {
	event.preventDefault();
	const text = event.target.elements.text.value; // [!code ++]

  client.sendMessage({ // [!code ++]
    type: 'items', // [!code ++]
    collection: 'messages', // [!code ++]
    action: 'create', // [!code ++]
    data: { text }, // [!code ++]
  });

	document.querySelector('#text').value = ''; // [!code ++]
});
```

_Refresh your browser, login, and submit a new message. Check the `Messages` collection in your Directus project and you
should see a new item._

![Directus Data Studio Content Module showing the Messages collection with one item in it. Visible is the text, User, and Date Created.](https://cdn.directus.io/docs/v9/guides/websockets/chat-collection.webp)

## Display New Messages

At the bottom of your `<script>`, create an `addMessageToList` function:

```js
function addMessageToList(message) {
	const li = document.createElement('li');
	li.setAttribute('id', message.id);
	li.textContent = `${message.user_created.first_name}: ${message.text}`;
	document.querySelector('ol').appendChild(li);
}
```

In your `receiveMessage` function, listen for new `create` events on the `Messages` collection:

```js
if (data.type == 'subscription' && data.event == 'create') {
	addMessageToList(data.data[0]);
}
```

_Refresh your browser, login, and submit a new message. The result should be shown on the page. Open a second browser
and navigate to your index.html file, login and submit a message there and both pages should immediately update_

![Web page showing the login form, new message form, and one message shown. The message reads “Kevin: This is brilliant!”](https://cdn.directus.io/docs/v9/guides/websockets/chat-webpage.webp)

## Display Historical Messages

To display the list of all existing messages, create a function `readAllMessages` with the following:

```js
function readAllMessages() {
  client.sendMessage({
    type: 'items',
    collection: 'messages',
    action: 'read',
    query: {
      limit: 10,
      sort: '-date_created',
      fields: ['*', 'user_created.first_name'],
    },
  });
}
```

Invoke this function directly before subscribing to any events

```js
client.onWebSocket('message', function (data) {
  if (data.type == 'auth' && data.status == 'ok') {
    readAllMessages(); // [!code ++]
    subscribe('create');
  }
});
```

Within the connection, listen for "items" message to update the user interface with message history.

```js
client.onWebSocket('message', function (data) {
  if (data.type == 'auth' && data.status == 'ok') {
    readAllMessages();
    subscribe('create');
  }

  if (data.type == 'items') { // [!code ++]
    for (const item of data.data) { // [!code ++]
      addMessageToList(item); // [!code ++]
    } // [!code ++]
  } // [!code ++]
});
```

Refresh your browser, login, and you should see the existing messages shown in your browser.

## Next Steps

This guide covers authentication, item creation, and subscription using WebSockets. You may consider:

1. Hiding the login form and only showing the new message form once authenticated.
2. Handling reconnection logic if the client disconnects or a refresh token is needed.
3. Locking down permissions so users can only see user first names.
4. Allow for editing and deletion of messages by the author or by an admin.

## Full Code Sample

```html
<!DOCTYPE html>
<html>
  <body>
    <form id="login">
      <label for="email">Email</label>
      <input type="email" id="email" />
      <label for="password">Password</label>
      <input type="password" id="password" />
      <input type="submit" />
    </form>

    <ol></ol>

    <form id="new">
      <label for="message">Message</label>
      <input type="text" id="text" />
      <input type="submit" />
    </form>

    <script>
      import {
        createDirectus,
        authentication,
        realtime,
      } from 'https://www.unpkg.com/@directus/sdk/dist/index.js';

      const url = 'https://your-directus-url';

      const client = createDirectus(url)
        .with(authentication())
        .with(realtime());

      client.onWebSocket('message', function (data) {
        if (data.type == 'auth' && data.status == 'ok') {
          readAllMessages();
          subscribe('create');
        }

        if (data.type == 'items') {
          for (const item of data.data) {
            addMessageToList(item);
          }
        }
      });

      client.connect();

      document
        .querySelector('#login')
        .addEventListener('submit', function (event) {
          event.preventDefault();
          const email = event.target.elements.email.value;
          const password = event.target.elements.password.value;
          client.login(email, password);
        });

      document
        .querySelector('#new')
        .addEventListener('submit', function (event) {
          event.preventDefault();

          const text = event.target.elements.text.value;

          client.sendMessage({
            type: 'items',
            collection: 'messages',
            action: 'create',
            data: { text },
          });
        });

      async function subscribe(event) {
        const { subscription } = await client.subscribe('messages', {
          event,
          query: {
            fields: ['*', 'user_created.first_name'],
          },
        });

        for await (const message of subscription) {
          receiveMessage(message);
        }
      }

      function receiveMessage(data) {
        if (data.type == 'subscription' && data.event == 'init') {
          console.log('subscription started');
        }
        if (data.type == 'subscription' && data.event == 'create') {
          addMessageToList(message.data[0]);
        }
      }

      function addMessageToList(message) {
        const li = document.createElement('li');
        li.setAttribute('id', message.id);
        li.textContent = `${message.user_created.first_name}: ${message.text}`;
        document.querySelector('ol').appendChild(li);
      }
    </script>
  </body>
</html>

```
