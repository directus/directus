---
contributors: Kevin Lewis
description: Learn how to build a real-time multi-user chat with WebSockets and JavaScript.
---

# Build a Multi-User Chat With JavaScript

In this guide, you will build a multi-user chat application with Directus’ WebSockets interface that authenticate users with an existing account, show historical messages stored in Directus, allow users to send new messages, and immediately update all connected chats.  

## Before You Start

### Set Up Your Directus Project
You will need a Directus project. If you don’t already have one, the easiest way to get started is with our [managed Directus Cloud service](https://directus.cloud). 

Create a new collection called `messages`, with `date_created` and `user_created` fields enabled in the *Optional System Fields* pane on collection creation. Create a text field called `text`.

Create a new Role called `Users`, and give Create and Read access to the `Messages` collection, and Read access to the `Directus Users` system collection. Create a new user with this role. Make note of the password you set.

### Create an HTML Boilerplate

Create an `index.html` file and open it in your code editor:

```html
<!doctype html>
<html>
<body>
	<form id="login">
		<label for="email">Email</label>
		<input type="email" id="email">
		<label for="password">Password</label>
		<input type="password" id="password">
		<input type="submit">
	</form>

	<ol></ol>

	<form id="new">
		<label for="message">Message</label>
		<input type="text" id="text">
		<input type="submit">
	</form>

	<script>

	</script>
</body>
</html>
```

The first form will handle user login and the second will handle new message submissions. The empty `<ol>` will be populated with messages. 

Inside of the `<script>`, create a `url` variable being sure to replace `your-directus-url` with your project’s URL:

```js
const url = 'wss://your-directus-url/websocket';
let connection;
```

The `connection` variable will later contain a WebSocket instance.

Finally, create event listeners which are triggered on the form submissions:

```js
document.querySelector('#login').addEventListener('submit', function(event) {
	event.preventDefault();
});

document.querySelector('#new').addEventListener('submit', function(event) {
	event.preventDefault();
});
```

## Establish WebSocket Connection

Within the `#login` form submit event handler, extract the `email` and `password` values from the form:

```js
const email = event.target.elements.email.value;
const password = event.target.elements.password.value;
```

Create a new WebSocket, which will immediately attempt connection:

```js
connection = new WebSocket(url);
```

On connection, you must [send an authentication message before the timeout](/guides/real-time/authentication). Add an event handler for the connection's `open` event:

```js
connection.addEventListener('open', function() {
	connection.send(JSON.stringify({ 
		type: 'auth', 
		email, 
		password 
	}));
});
```

## Subscribe To Messages

In a WebSocket connection, all data sent from the server will trigger the connection’s `message` event. Underneath the `open` event handler, add the following:

```js
connection.addEventListener('message', function(message) {
	receiveMessage(message);
});
```

At the bottom of your `<script>`, create the `receiveMessage` function:

```js
function receiveMessage(message) {
	const data = JSON.parse(message.data);
};
```

As soon as you have successfully authenticated, a message will be sent. When this happens, subscribe to updates on the `Messages` collection. Add this inside of the `receiveMessage` function:

```js
if (data.type == 'auth' && data.status == 'ok') {
	connection.send(JSON.stringify({ 
		type: 'subscribe', 
		collection: 'messages', 
		query: { 
			fields: ['*', 'user_created.first_name'], 
			sort: 'date_created' 
		} 
	}));
};
```

When a subscription is started, a message will be sent to confirm. Add this inside of the `receiveMessage` function:

```js
if (data.type == 'subscription' && data.event == 'init') {
	console.log('subscription started');
}
```

*Open your `index.html` file in your browser, enter your user’s email and password, submit, and check the browser console for this console log.* 

## Create New Messages
Within the `#new` form submit event handler, send a new message to create the item in your Directus collection:

```js
document.querySelector('#new').addEventListener('submit', function(event) {
	event.preventDefault();
	const text = event.target.elements.text.value; // [!code ++]
	connection.send(JSON.stringify({ // [!code ++]
		type: 'items', // [!code ++]
		collection: 'messages', // [!code ++]
		action: 'create', // [!code ++]
		data: { text } // [!code ++]
	})); // [!code ++]
	document.querySelector('#text').value = ''; // [!code ++]
});
```

*Refresh your browser, login, and submit a new message. Check the `Messages` collection in your Directus project and you should see a new item.* 

![Directus Data Studio Content Module showing the Messages collection with one item in it. Visible is the text, User, and Date Created.](https://cdn.directus.io/docs/v9/guides/websockets/chat-collection.webp)

## Display New Messages
At the bottom of your `<script>`, create an `addMessageToList` function:

```js
function addMessageToList(message) {
	const li = document.createElement('li');
	li.setAttribute('id', message.id);
	li.textContent = `${message.user_created.first_name}: ${message.text}`;
	document.querySelector('ol').appendChild(li);
};
```

In your `receiveMessage` function, listen for new `create` events on the `Messages` collection:

```js
if (data.type == 'subscription' && data.event == 'create') {
	addMessageToList(data.data[0]);
}
```

*Refresh your browser, login, and submit a new message. The result should be shown on the page. Open a second browser and navigate to your index.html file, login and submit a message there and both pages should immediately update*

![Web page showing the login form, new message form, and one message shown. The message reads “Kevin: This is brilliant!”](https://cdn.directus.io/docs/v9/guides/websockets/chat-webpage.webp)

## Display Historical Messages

Replace the `console.log()` you created when the subscription is initialized:

```js
if (data.type == 'subscription' && data.event == 'init') {
	console.log('subscription started'); // [!code --]
	for (const message of data.data) { // [!code ++]
		addMessageToList(message); // [!code ++]
	} // [!code ++]
}
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
<!doctype html>
<html>
	<body>
		<form id="login">
			<label for="email">Email</label>
			<input type="email" id="email">
			<label for="password">Password</label>
			<input type="password" id="password">
			<input type="submit">
		</form>

		<ol></ol>

		<form id="new">
			<label for="message">Message</label>
			<input type="text" id="text">
			<input type="submit">
		</form>

		<script>
		const url = 'wss://your-directus-url/websocket';
		let connection;

		document.querySelector('#login').addEventListener('submit', function(event) {
			event.preventDefault();
			const email = event.target.elements.email.value;
			const password = event.target.elements.password.value;
			connection = new WebSocket(url);
			connection.addEventListener('open', function() {
				connection.send(JSON.stringify({ 
					type: 'auth', 
					email, 
					password 
				}));
			});
			connection.addEventListener('message', function(message) {
				receiveMessage(message);
			});
		});

		document.querySelector('#new').addEventListener('submit', function(event) {
			event.preventDefault();
			const text = event.target.elements.text.value;
			connection.send(JSON.stringify({
				type: 'items',
				collection: 'messages',
				action: 'create',
				data: { text }
			}));
			document.querySelector('#text').value = '';
		});

		function receiveMessage(message) {
			const data = JSON.parse(message.data);
			if (data.type == 'auth' && data.status == 'ok') {
				connection.send(JSON.stringify({ 
					type: 'subscribe', 
					collection: 'messages', 
					query: { 
						fields: ['*', 'user_created.first_name'], 
						sort: 'date_created' 
					} 
				}));
			}
			if (data.type == 'subscription' && data.event == 'init') {
				for (const message of data.data) { 
					addMessageToList(message); 
				} 
			}
			if (data.type == 'subscription' && data.event == 'create') {
				addMessageToList(data.data[0]);
			}
		};

		function addMessageToList(message) {
			const li = document.createElement('li');
			li.setAttribute('id', message.id);
			li.textContent = `${message.user_created.first_name}: ${message.text}`;
			document.querySelector('ol').appendChild(li);
		};
		</script>
	</body>
</html>
```
