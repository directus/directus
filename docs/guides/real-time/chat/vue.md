---
contributors: Kevin Lewis, Esther Agbaje
description: Learn how to build a real-time multi-user chat with WebSockets and Vue.js.
---

# Build a Multi-User Chat With Vue.js

In this guide, you will build a multi-user chat application with Directus’ WebSockets interface that authenticate users
with an existing account, show historical messages stored in Directus, allow users to send new messages, and immediately
update all connected chats.

## Before You Start

### Set Up Your Directus Project

You will need a Directus project. If you don’t already have one, the easiest way to get started is with our
[managed Directus Cloud service](https://directus.cloud).

Create a new collection called `messages`, with `date_created` and `user_created` fields enabled in the _Optional System
Fields_ pane on collection creation. Create an input field called `text`.

Create a new Role called `Users`, and give Create and Read access to the `Messages` collection, and Read access to the
`Directus Users` system collection. Create a new user with this role. Make note of the password you set.

### Create a Vue.js Boilerplate

```html
<!DOCTYPE html>
<html>
	<body>
		<div id="app">
			<form @submit.prevent="loginSubmit">
				<label for="email">Email</label>
				<input type="email" id="email" />
				<label for="password">Password</label>
				<input type="password" id="password" />
				<input type="submit" />
			</form>

			<ol></ol>

			<form @submit.prevent="messageSubmit">
				<label for="message">Message</label>
				<input type="text" id="text" />
				<input type="submit" />
			</form>
		</div>

		<script setup>

		</script>
	</body>
</html>
```

The first form will handle user login and the second will handle new message submissions. The empty `<ol>` will be
populated with messages.

Inside the setup `script`, create a `url` property being sure to replace `your-directus-url` with your project’s URL:

```js
const url = 'https://your-directus-url';
```

## Import the Required Composables and Methods

At the top of your setup `script`, import the SDK composables and vue hooks needed for this project

```js
import { onMounted, ref, onBeforeUnmount } from 'vue';
import { authentication, createDirectus, realtime } from '@directus/sdk';
```

- `createDirectus` is a function that initializes a Directus client.
- `authentication` provides methods to authenticate a user.
- `realtime` provides methods to establish a WebSocket connection.

## Establish and Authenticate a WebSocket Client

```js
const client = createDirectus(url)
  .with(authentication())
  .with(realtime());
```

## Set Up Form Submission Methods

Create the methods for form submissions:

```js
const loginSubmit = (event) => {};

const messageSubmit = (event) => {};
```

Now, extract the `email` and `password` values from the login form.

```js
const loginSubmit = (event) => {
  const email = event.target.elements.email.value; // [!code ++]
  const password = event.target.elements.password.value; // [!code ++]
};
```

Once the client is authenticated, immediately create a WebSocket connection:

```js
client.connect();
```

## Subscribe To Messages

As soon as you have successfully authenticated, a message will be sent. When this happens, within `onMounted` hook,
subscribe to updates on the `Messages` collection.

```js
onMounted(() => {
  const cleanup = client.onWebSocket('message', function (message) {
    if (message.type == 'auth' && message.status == 'ok') {
      subscribe('create');
    }
  });

  client.connect();
  onBeforeUnmount(cleanup);
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
function receiveMessage() {
  if (data.type == 'subscription' && data.event == 'init') {
	  console.log('subscription started');
  }
}
```

Open your browser, enter your user’s email and password, and hit submit. Check the browser console. You should see
“subscription started”

## Create New Messages

At the top of your component, set up a ref to store an array of previous message history.

```js
const messageHistory = ref([]);
```

Within the `messageSubmit` method, send a new message to create the item in your Directus collection:

```js
const messageSubmit = (event) => {

  const text = event.target.elements.text.value;

  client.sendMessage({
    type: 'items',
    collection: 'messages',
    action: 'create',
    data: { text },
  });

  event.target.reset();
};
```

_Refresh your browser, login, and submit a new message. Check the `Messages` collection in your Directus project and you
should see a new item._

![Directus Data Studio Content Module showing the Messages collection with one item in it. Visible is the text, User, and Date Created.](https://cdn.directus.io/docs/v9/guides/websockets/chat-collection.webp)

## Display New Messages

In your `receiveMessage` function, listen for new `create` events on the `Messages` collection, and add them to
`messageHistory`:

```js
if (data.type == 'subscription' && data.event == 'create') {
    addMessageToList(message.data[0]);
  }
```

Create an `addMessageToList` function that adds new messages to list:

```js
function addMessageToList(message) {
  messageHistory.value.push(message);
}
```

Update your `<ol>` to display items in the array by mapping over `messageHistory`

```js
<ol>
  <li v-for="message in messageHistory" :key="message.id">
    {{ message.user_created.first_name }}: {{ message.text }}
  </li>
</ol>
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
const cleanup = client.onWebSocket('message', function (data) {
  if (data.type == 'auth' && data.status == 'ok') {
    readAllMessages(); // [!code ++]
    subscribe('create');
  }
});
```

Within the connection, listen for "items" message to update the user interface with message history.

```js
const cleanup = client.onWebSocket('message', function (data) {
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
    <div id="app">
      <form @submit.prevent="loginSubmit">
        <label for="email">Email</label>
        <input v-model="form.email" type="email" id="email" />
        <label for="password">Password</label>
        <input v-model="form.password" type="password" id="password" />
        <input type="submit" />
      </form>

      <ol>
        <li v-for="message in messages.history" :key="message.id">
          {{ message.user_created.first_name }}: {{ message.text }}
        </li>
      </ol>

      <form @submit.prevent="messageSubmit">
        <label for="message">Message</label>
        <input v-model="messages.new" type="text" id="text" />
        <input type="submit" />
      </form>
    </div>

    <script>
      import { onMounted, ref, onBeforeUnmount } from 'vue';
      import { authentication, createDirectus, realtime } from '@directus/sdk';

      const messageHistory = ref([]);

      const url = 'https://your-directus-url';

      const client = createDirectus(url)
        .with(authentication())
        .with(realtime());

      onMounted(() => {
        const cleanup = client.onWebSocket('message', function (data) {
          if (data.type == 'auth' && data.status == 'ok') {
            readAllMessages();
            subscribe('create');
          }

          if (data.type == 'items') {
            for (const item of data.data) {
              addMessageToList(item);
            }
          }
          console.log(message);
        });

        client.connect();
        onBeforeUnmount(cleanup);
      });

      const loginSubmit = (event) => {
        const email = event.target.elements.email.value;
        const password = event.target.elements.password.value;
        client.login(email, password);
      };

      async function subscribe(event) {
        const { subscription } = await client.subscribe('messages', {
          event,
          query: {
            fields: ['*', 'user_created.first_name'],
          },
        });

        for await (const message of subscription) {
          console.log('receiveMessage', message);
          receiveMessage(message);
        }
      }

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

      function receiveMessage(data) {
        if (data.type == 'subscription' && data.event == 'init') {
          console.log('subscription started');
        }
        if (data.type == 'subscription' && data.event == 'create') {
          addMessageToList(message.data[0]);
        }
      }

      function addMessageToList(message) {
        messageHistory.value.push(message);
      }

      const messageSubmit = (event) => {
        const text = event.target.elements.text.value;

        client.sendMessage({
          type: 'items',
          collection: 'messages',
          action: 'create',
          data: { text },
        });

        event.target.reset();
      };
    </script>
  </body>
</html>
```
