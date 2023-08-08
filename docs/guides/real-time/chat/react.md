---
contributors: Esther Agbaje
description: Learn how to build a real-time multi-user chat with WebSockets and React.js.
---

# Build a Multi-User Chat With React.js

In this guide, you will build a multi-user chat application with Directus’ WebSockets interface that authenticates users
with an existing account, shows historical messages stored in Directus, allows users to send new messages, and
immediately updates all connected chats.

## Before You Start

### Set Up Your Directus Project

You will need a Directus project. If you don’t already have one, the easiest way to get started is with our
[managed Directus Cloud service](https://directus.cloud).

Create a new collection called `messages`, with `date_created` and `user_created` fields enabled in the _Optional System
Fields_ pane on collection creation. Create a text field called `text`.

Create a new Role called `Users`. Give Create and Read access to the `Messages` collection, and Read access to the
`Directus Users` system collection. Now, create a new user with this role and take note of the password you set.

### Create a React.js Boilerplate

```jsx
function App() {
	return (
		<div className="App">
			<form>
				<label htmlFor="email">Email</label>
				<input type="email" id="email" />
				<label htmlFor="password">Password</label>
				<input type="password" id="password" />
				<button type="submit">Submit</button>
			</form>

			<ol></ol>

			<form>
				<label htmlFor="message">Message</label>
				<input type="text" id="message" />
				<button type="submit">Submit</button>
			</form>
		</div>
	);
}
```

The first form will handle user login, the second will handle new message submissions while the empty `<ol>` will be
populated with messages we will create shortly.

Create a `url` variable and be sure to replace `your-directus-url` with your project’s URL:

```js
const url = 'wss://your-directus-url/websocket';
```

Now, create a variable called `connectionRef` that has an initial null value. The `connectionRef` will later contain a
WebSocket instance.

```js
const connectionRef = useRef(null);
```

## Set Up Form Submission Methods

Create the methods for form submissions:

```js
const loginSubmit = (event) => {};

const messageSubmit = (event) => {};
```

Ensure to call the `event.preventDefault()` in these methods to prevent the browser from refreshing the page upon
submission of the form.

```js
const loginSubmit = (event) => {
	event.preventDefault(); // [!code ++]
};

const messageSubmit = (event) => {
	event.preventDefault(); // [!code ++]
};
```

## Establish WebSocket Connection

At the top of your component, create a piece of state to hold the `email` and `password` values of the login form:

```js
const [formValue, setFormValue] = useState({ email: '', password: '' });
```

Set up a `handleLoginChange` method that updates the value of the login input field as the user types.

```js
const handleLoginChange = (event) => {
	setFormValue({ ...formValue, [event.target.name]: event.target.value });
};
```

Then, connect these values to the form input fields:

```jsx
<form onSubmit={loginSubmit}>
	<label htmlFor="email">Email</label>
	<input type="email" id="email" /> // [!code --]
	<input type="email" id="email" name="email" value={formValue.email} onChange={handleLoginChange} /> // [!code ++]
	<label htmlFor="password">Password</label>
	<input type="password" id="password" /> // [!code --]
	<input type="password" id="password" name="password" value={formValue.password} onChange={handleLoginChange} /> // [!code ++]
	<button type="submit">Submit</button>
</form>
```

Within the `loginSubmit` method, create a new WebSocket, which will immediately attempt connection:

```js
const loginSubmit = (event) => {
	connectionRef.current = new WebSocket(url); // [!code ++]
};
```

On connection, you must [send an authentication message before the timeout](/guides/real-time/authentication). Add an
event handler for the connection's `open` event:

```js
const loginSubmit = (event) => {
	connectionRef.current = new WebSocket(url);
	connectionRef.current.addEventListener('open', authenticate(formValue)); // [!code ++]
};
```

Then, create a new `authenticate` method:

```js
const authenticate = (opts) => {
	const { email, password } = opts;
	connectionRef.current.send(JSON.stringify({ type: 'auth', email, password }));
};
```

### Subscribe to Messages

In a WebSocket connection, all data sent from the server will trigger the connection’s `message` event. Inside
`loginSubmit`, add an event handler:

```js
const loginSubmit = (event) => {
	connectionRef.current = new WebSocket(url);
	connectionRef.current.addEventListener('open', authenticate(formValue));
	connectionRef.current.addEventListener('message', (message) => receiveMessage(message)); // [!code ++]
};
```

Then, create a new `receiveMessage` method:

```js
const receiveMessage = (message) => {
	const data = JSON.parse(message.data);
};
```

As soon as you have successfully authenticated, a message will be sent. When this happens, subscribe to updates on the
`Messages` collection. Add this inside of the `receiveMessage` method:

```js
const receiveMessage = (message) => {
	const data = JSON.parse(message.data);

	if (data.type === 'auth' && data.status === 'ok') { // [!code ++]
		connectionRef.current.send( // [!code ++]
			JSON.stringify({ // [!code ++]
				type: 'subscribe', // [!code ++]
				collection: 'messages', // [!code ++]
				query: { // [!code ++]
					fields: ['*', 'user_created.first_name'], // [!code ++]
					sort: 'date_created', // [!code ++]
				}, // [!code ++]
			}) // [!code ++]
		); // [!code ++]
	} // [!code ++]
};
```

When a subscription is started, a message will be sent to confirm. Add this inside of the `receiveMessage` method:

```js {15-17}
const receiveMessage = (message) => {
	const data = JSON.parse(message.data);

	if (data.type === 'auth' && data.status === 'ok') {
		connectionRef.current.send(
			JSON.stringify({
				type: 'subscribe',
				collection: 'messages',
				query: {
					fields: ['*', 'user_created.first_name'],
					sort: 'date_created',
				},
			})
		);
	}

	if (data.type === 'subscription' && data.event === 'init') { // [!code ++]
		console.log('subscription started'); // [!code ++]
	} // [!code ++]
};
```

Open your browser, enter your user’s email and password, and hit submit. Check the browser console. You should see
“subscription started”

## Create New Messages

At the top of your component, set up two pieces of state to hold messages: one to keep track of new messages and another
to store an array of previous message history.

```js
const [newMessage, setNewMessage] = useState('');
const [messageHistory, setMessageHistory] = useState([]);
```

Create a `handleMessageChange` method that updates the value of the message input field as the user types.

```js
const handleMessageChange = (event) => {
	setNewMessage(event.target.value);
};
```

Then, connect these values to the form input fields:

```jsx
<form onSubmit={messageSubmit}>
	<label htmlFor="message">Message</label>
	<input type="text" id="message" /> // [!code --]
	<input type="text" id="message" name="message" value={newMessage} onChange={handleMessageChange} /> // [!code ++]
	<button type="submit">Submit</button>
</form>
```

Within the `messageSubmit` method, send a new message to create the item in your Directus collection:

```js
const messageSubmit = (event) => {
	connectionRef.current.send(
		JSON.stringify({
			type: 'items',
			collection: 'messages',
			action: 'create',
			data: { text: newMessage },
		})
	);

	setNewMessage('');
};
```

_Refresh your browser, login, and submit a new message. Check the `Messages` collection in your Directus project and you
should see a new item._

![Directus Data Studio Content Module showing the Messages collection with one item in it. Visible is the text, User, and Date Created.](https://cdn.directus.io/docs/v9/guides/websockets/chat-collection.webp)

## Display New Messages

In your `receiveMessage` function, listen for new `create` events on the `Messages` collection, and add them to
`messageHistory`:

```js
if (data.type === 'subscription' && data.event === 'create') {
	setMessageHistory((history) => [...history, data.data[0]]);
}
```

Update your `<ol>` to display items in the array by mapping over `messageHistory`

```jsx
<ol>
	{messageHistory.map((message) => (
		<li key={message.id}>
			{message.user_created.first_name}: {message.text}
		</li>
	))}
</ol>
```

_Refresh your browser, login, and submit a new message. The result should be shown on the page. Open a second browser
and navigate to your index.html file, login and submit a message there and both pages should immediately update_

![Web page showing the login form, new message form, and one message shown. The message reads “Kevin: This is brilliant!”](https://cdn.directus.io/docs/v9/guides/websockets/chat-webpage.webp)

## Display Historical Messages

Replace the `console.log()` you created when the subscription is initialized:

```js
if (data.type === 'subscription' && data.event === 'init') {
	console.log('subscription started'); // [!code --]

	for (const message of data.data) { // [!code ++]
		setMessageHistory((history) => [...history, message]); // [!code ++]
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

```jsx
import { useState, useRef } from 'react';

const url = 'wss://your-directus-url/websocket';

export default function App() {
	const [formValue, setFormValue] = useState({ email: '', password: '' });
	const [newMessage, setNewMessage] = useState('');
	const [messageHistory, setMessageHistory] = useState([]);

	const connectionRef = useRef(null);

	const authenticate = (opts) => {
		const { email, password } = opts;
		connectionRef.current.send(JSON.stringify({ type: 'auth', email, password }));
	};

	const loginSubmit = (event) => {
		event.preventDefault();
		connectionRef.current = new WebSocket(url);
		connectionRef.current.addEventListener('open', authenticate(formValue));
		connectionRef.current.addEventListener('message', (message) => receiveMessage(message));
	};

	const receiveMessage = (message) => {
		const data = JSON.parse(message.data);

		if (data.type == 'auth' && data.status == 'ok') {
			connectionRef.current.send(
				JSON.stringify({
					type: 'subscribe',
					collection: 'messages',
					query: {
						fields: ['*', 'user_created.first_name'],
						sort: 'date_created',
					},
				})
			);
		}

		if (data.type === 'subscription' && data.event === 'init') {
			for (const message of data.data) {
				setMessageHistory((history) => [...history, message]);
			}
		}

		if (data.type === 'subscription' && data.event === 'create') {
			setMessageHistory((history) => [...history, data.data[0]]);
		}
	};

	const messageSubmit = (event) => {
		event.preventDefault();

		connectionRef.current.send(
			JSON.stringify({
				type: 'items',
				collection: 'messages',
				action: 'create',
				data: { text: newMessage },
			})
		);

		setNewMessage('');
	};

	const handleLoginChange = (event) => {
		setFormValue({ ...formValue, [event.target.name]: event.target.value });
	};

	const handleMessageChange = (event) => {
		setNewMessage(event.target.value);
	};

	return (
		<div className="App">
			<form onSubmit={loginSubmit}>
				<label htmlFor="email">Email</label>
				<input type="email" id="email" name="email" value={formValue.email} onChange={handleLoginChange} />
				<label htmlFor="password">Password</label>
				<input type="password" id="password" name="password" value={formValue.password} onChange={handleLoginChange} />
				<button type="submit">Submit</button>
			</form>

			<ol>
				{messageHistory.map((message) => (
					<li key={message.id}>
						{message.user_created.first_name}: {message.text}
					</li>
				))}
			</ol>

			<form onSubmit={messageSubmit}>
				<label htmlFor="message">Message</label>
				<input type="text" id="message" name="message" value={newMessage} onChange={handleMessageChange} />
				<button type="submit">Submit</button>
			</form>
		</div>
	);
}
```
