---
contributors: Kevin Lewis
description: Learn how to build a real-time multi-user chat with WebSockets and Vue.js.
---

# Build a Multi-User Chat With Vue.js

In this guide, you will build a multi-user chat application with Directus’ WebSockets interface that authenticate users with an existing account, show historical messages stored in Directus, allow users to send new messages, and immediately update all connected chats.  

## Before You Start

### Set Up Your Directus Project

You will need a Directus project. If you don’t already have one, the easiest way to get started is with our [managed Directus Cloud service](https://directus.cloud). 

Create a new collection called `messages`, with `date_created` and `user_created` fields enabled in the *Optional System Fields* pane on collection creation. Create a text field called `text`.

Create a new Role called `Users`, and give Create and Read access to the `Messages` collection, and Read access to the `Directus Users` system collection. Create a new user with this role. Make note of the password you set.

### Create a Vue.js Boilerplate

```html
<!doctype html>
<html>
<body>
	<div id="app">
		<form>
			<label for="email">Email</label>
			<input type="email" id="email">
			<label for="password">Password</label>
			<input type="password" id="password">
			<input type="submit">
		</form>

		<ol>
		</ol>

		<form>
			<label for="message">Message</label>
			<input type="text" id="message">
			<input type="submit">
		</form>
	</div>

	<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
	<script>
		const { createApp } = Vue;
		createApp({
			data() {
				return {
				}
			},
			methods: {
			}
		}).mount('#app');
	</script>	
</body>
```

The first form will handle user login and the second will handle new message submissions. The empty `<ol>` will be populated with messages. 

Inside of Vue's `data` object, create a `url` property being sure to replace `your-directus-url` with your project’s URL:

```js
data() {
	return {
		url: 'wss://your-directus-url/websocket', // [!code ++]
		connection: null, // [!code ++]
	}
},
```

The `connection` property will later contain a WebSocket instance.

## Set Up Form Submission Methods

Create the methods for form submissions:

```js
methods: {
	loginSubmit() { // [!code ++]
	}, // [!code ++]
	messageSubmit() { // [!code ++]
	} // [!code ++]
}
```

Then, ensure these methods are called on form submissions by using the `@submit.prevent` directive:

```html
<!-- Login form -->
<form> // [!code --]
<form @submit.prevent="loginSubmit"> // [!code ++]
	<label for="email">Email</label>

<!-- Message form -->
<form> // [!code --]
<form @submit.prevent="messageSubmit"> // [!code ++]
	<label for="message">Message</label>
```

## Establish WebSocket Connection

First, create a new `login` object in your Vue application's `data` object. It will contain form data:

```js
data() {
	return {
		url: 'wss://your-directus-url/websocket',
		connection: null, 
		form: {}, // [!code ++]
	}
},
```

Then, bind the login form's inputs to `form`:

```html
<form>
	<label for="email">Email</label>
	<input type="email" id="email">  // [!code --]
	<input v-model="form.email" type="email" id="email">  // [!code ++]
	<label for="password">Password</label>
	<input type="password" id="password">  // [!code --]
	<input v-model="form.password" type="password" id="password">  // [!code ++]
	<input type="submit">
</form>
```

Within the `loginSubmit` method, create a new WebSocket, which will immediately attempt connection:

```js
loginSubmit() { 
	this.connection = new WebSocket(this.url); // [!code ++]
},
```

On connection, you must [send an authentication message before the timeout](/guides/real-time/authentication). Add an event handler for the connection's `open` event:

```js
loginSubmit() { 
	this.connection = new WebSocket(this.url); 
	this.connection.addEventListener('open', this.authenticate(this.form)); // [!code ++]
},
```

Then, create a new `authenticate` method:

```js
authenticate(opts) {
	const { email, password } = opts;
	this.connection.send(JSON.stringify({  type: 'auth', email, password }));
},
```

### Subscribe to messages

In a WebSocket connection, all data sent from the server will trigger the connection’s `message` event. Inside `loginSubmit`, add an event handler:

```js
loginSubmit() {
	this.connection = new WebSocket(this.url);
	this.connection.addEventListener('open', this.authenticate(this.login));
	this.connection.addEventListener('message', message => this.receiveMessage(message)); // [!code ++]
},
```

Then, create a new `receiveMessage` method:

```js
receiveMessage(message) {
	const data = JSON.parse(message.data);
}
```

As soon as you have successfully authenticated, a message will be sent. When this happens, subscribe to updates on the `Messages` collection. Add this inside of the `receiveMessage` method:

```js
receiveMessage(message) {
	const data = JSON.parse(message.data);
	if (data.type == 'auth' && data.status == 'ok') { // [!code ++]
		connection.send(JSON.stringify({ // [!code ++]
			type: 'subscribe', // [!code ++]
			collection: 'messages', // [!code ++]
			query: { // [!code ++] 
				fields: ['*', 'user_created.first_name'], // [!code ++]
				sort: 'date_created' // [!code ++]
			} // [!code ++]
		})); // [!code ++]
	} // [!code ++]
}
```

When a subscription is started, a message will be sent to confirm. Add this inside of the `receiveMessage` method:

```js
receiveMessage(message) {
	const data = JSON.parse(message.data);
	if (data.type == 'auth' && data.status == 'ok') { 
		this.connection.send(JSON.stringify({ 
			type: 'subscribe', 
			collection: 'messages', 
			query: {	
				fields: ['*', 'user_created.first_name'], 
				sort: 'date_created' 
			} 
		})) ;
	} 
	if (data.type == 'subscription' && data.event == 'init') { // [!code ++]
		console.log('subscription started'); // [!code ++]
	} // [!code ++]
}
```

*Open your `index.html` file in your browser, enter your user’s email and password, submit, and check the browser console for this console log.* 

## Create New Messages

First, create a new `messages` object in your Vue application's `data` object with two properties: a `new` string to be bound to the input, and a `history` array to contain existing messages:

```js
data() {
	return {
		url: 'wss://your-directus-url/websocket',
		connection: null, 
		form: {}, 
		messages: { // [!code ++]
			new: '', // [!code ++]
			history: [] // [!code ++]
		} // [!code ++]
	}
},
```

Then, bind the login form's inputs to `form` properties:

```html
<form @submit.prevent="messageSubmit">
	<label for="message">Message</label>
	<input type="text" id="message"> // [!code --]
	<input v-model="messages.new" type="text" id="message"> // [!code ++]
	<input type="submit">
</form>
```

Within the `messageSubmit` method, send a new message to create the item in your Directus collection:

```js
messageSubmit() {
	this.connection.send(JSON.stringify({ // [!code ++]
		type: 'items', // [!code ++]
		collection: 'messages', // [!code ++]
		action: 'create', // [!code ++]
		data: { text: this.messages.new } // [!code ++]
	})); // [!code ++]
	this.messages.new = ''; // [!code ++]
}
```

*Refresh your browser, login, and submit a new message. Check the `Messages` collection in your Directus project and you should see a new item.* 

![Directus Data Studio Content Module showing the Messages collection with one item in it. Visible is the text, User, and Date Created.](https://cdn.directus.io/docs/v9/guides/websockets/chat-collection.webp)

## Display New Messages

In your `receiveMessage` function, listen for new `create` events on the `Messages` collection, and add them to `messages.history`:

```js
if (data.type == 'subscription' && data.event == 'create') {
	this.messages.history.push(data.data[0]);
}
```

Update your `<ol>` to display items in the array:

```html
<ol>
	<li v-for="message in messages.history" :key="message.id"> // [!code ++]
		{{ message.user_created.first_name }}: {{ message.text }} // [!code ++]
	</li> // [!code ++]
</ol>
```

*Refresh your browser, login, and submit a new message. The result should be shown on the page. Open a second browser and navigate to your index.html file, login and submit a message there and both pages should immediately update*

![Web page showing the login form, new message form, and one message shown. The message reads “Kevin: This is brilliant!”](https://cdn.directus.io/docs/v9/guides/websockets/chat-webpage.webp)

## Display Historical Messages

Replace the `console.log()` you created when the subscription is initialized:

```js
if (data.type == 'subscription' && data.event == 'init') {
	console.log('subscription started'); // [!code --]
	for (const message of data.data) { // [!code ++]
		this.messages.history.push(message); // [!code ++]
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
	<div id="app">
		<form @submit.prevent="loginSubmit">
			<label for="email">Email</label>
			<input v-model="form.email" type="email" id="email">
			<label for="password">Password</label>
			<input v-model="form.password" type="password" id="password">
			<input type="submit">
		</form>

		<ol>
			<li v-for="message in messages.history" :key="message.id"> 
				{{ message.user_created.first_name }}: {{ message.text }} 
			</li> 
		</ol>

		<form @submit.prevent="messageSubmit">
			<label for="message">Message</label>
			<input v-model="messages.new" type="text" id="message">
			<input type="submit">
		</form>
	</div>

	<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
	<script>
		const { createApp } = Vue
		createApp({
			data() {
				return {
					url: 'wss://your-directus-url/websocket', 
					connection: null, 
					form: {}, 
					messages: { 
						new: '', 
						history: [] 
					} 
				}
			},
			methods: {
				loginSubmit() { 
					this.connection = new WebSocket(this.url); 
					this.connection.addEventListener('open', this.authenticate(this.form)); 
					this.connection.addEventListener('message', message => this.receiveMessage(message));
				}, 
				messageSubmit() { 
					this.connection.send(JSON.stringify({ 
						type: 'items', 
						collection: 'messages', 
						action: 'create', 
						data: { text: this.messages.new } 
					})); 
					this.messages.new = '';
				},
				authenticate(opts) {
					const { email, password } = opts;
					this.connection.send(JSON.stringify({	type: 'auth', email, password }));
				},
				receiveMessage(message) {
					const data = JSON.parse(message.data);
					if (data.type == 'auth' && data.status == 'ok') { 
						this.connection.send(JSON.stringify({ 
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
							this.messages.history.push(message); 
						} 
					} 
					if (data.type == 'subscription' && data.event == 'create') {
						this.messages.history.push(data.data[0]);
					}
				}
			}
		}).mount('#app')
	</script>	
</body>
```