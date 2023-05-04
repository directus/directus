# Getting Started with GraphQL Subscriptions

You can connect to a Directus project and get updates on data held in a collection in real-time.

This guide will show you how to get started with subscribing to data using GraphQL.

We'll be using a React.js project for demonstration purposes, however, WebSockets are language-agnostic, so you can
apply the same set of steps in your stack of choice.

> It's important to note that GraphQL will only use WebSockets for subscriptions. This means that regular GraphQL
> queries and mutations will still use HTTP requests and responses, even if you have established a WebSocket connection.

## Before You Begin

You will need a Directus project. If you don’t already have one, the easiest way to get started is with our
[managed Directus Cloud service](https://directus.cloud). You can also self-host Directus, ensuring the
`WEBSOCKETS_ENABLED` environment variable is set to `true`.

Create a new collection called `messages`, with a `date_created` field enabled in the _Optional System Fields_ pane on
collection creation. Create a text field called `text` and a second called `user`.

If it doesn’t already exist, create a user with a role that can execute read and create operations on the collection.

Finally in the Directus Data Studio, create a static access token for the user, copy it, and save the user profile.

### Create a React boilerplate

In `App.jsx`, insert this code:

```js
function App() {
	return (
		<div className="App">
			<div>
				<button>Hey</button>
				<ul></ul>
			</div>
		</div>
	);
}
```

The empty `<ul>` will be populated with messages we will create shortly.

## Install the Required Packages

The first step in using WebSockets with GraphQL is to install the `graphql-ws` library. This library makes it easy to
establish a WebSocket connection with a GraphQL server.

You also want to install `@apollo/client` to handle GraphQL queries, mutations and subscriptions on the client side.

In your React project, run the following command:

```js
npm install graphql-ws @apollo/client
```

## Authenticate Your Connection

Establish a WebSocket connection between the client and server using `createClient` from `graphql-ws`. To authenticate,
enter both `your-directus-url` and the `token` generated earlier.

```js
import { createClient } from 'graphql-ws';

const client = createClient({
	url: 'ws://your-directus-url/graphql', // [!code ++]
	keepAlive: 30000,
	connectionParams: async () => {
		return { access_token: 'MY_TOKEN' }; // [!code ++]
	},
});
```

This immediately creates a connection and ensures that only authorized clients can access the resources and real-time
data updates.

[Learn more about WebSocket authentication here.](/guides/real-time/authentication)

## Create Mutation to Add Messages

Create a mutation `ADD_MESSAGE` that sends messages to the messages collection:

```js
const ADD_MESSAGE = gql`
	mutation AddMessage($text: String!, $user: String!) {
		create_messages_item(data: { text: $text, user: $user }) {
			id
			text
			user
		}
	}
`;
```

## Set up Query to Get Messages

Compose a query `GET_MESSAGES` to retrieve messages from the messages collection:

```js
const GET_MESSAGES = gql`
	query {
		messages {
			id
			text
			user
		}
	}
`;
```

## Utilize Hooks for GraphQL protocols

At the top of your component, use the `useQuery` and `useMutation` hooks to complete the GraphQL and Websocket
protocols:

```js
const { loading, error, data } = useQuery(GET_MESSAGES);

const [addMessage] = useMutation(ADD_MESSAGE);
```

## Subscribe To Changes

After subscribing to collections over your connection, you will real-data changes in your messages collection:

```js
useEffect(() => {
	return client.subscribe(
		{
			query: `
        subscription {
          messages_mutated {
            id,
            text
            user
            _event
          }
        }`,
		},
		{
			next: ({ data }) => {
				console.log(data);
			},
			error: (err) => {
				console.log(err);
			},
			complete: () => {},
		}
	);
}, []);
```

At the moment, you are subscribed to the messages collection and can only retrieve all messages in real-time. However,
you may also desire to subscribe to `create`, `update`, and `delete` events.

To accomplish this, replace the `console.log` in the `next` field with:

```js
useEffect(() => {
	return client.subscribe(
		{
			query: `
        subscription {
          messages_mutated {
            id,
            text
            user
            _event
          }
        }`,
		},
		{
			next: ({ data }) => {
        console.log(data)  // [!code --]
				const { text, user, id, _event } = data?.messages_mutated || {};  // [!code ++]
				if (_event === 'create') { // [!code ++]
					setMessageData((messages) => [...messages, { id, user, text }]); // [!code ++]
				} else if (_event === 'delete') { // [!code ++]
					setMessageData((messages) => messages.filter((m) => m.id !== id)); // [!code ++]
				} else if (_event === 'update') { // [!code ++]
					setMessageData((messages) => // [!code ++]
						messages.map((message) => (message.id === id ? { ...message, text, user } :  // [!code ++]message))
					); // [!code ++]
				} // [!code ++]
			},
			error: (err) => {
				console.log(err);
			},
			complete: () => {},
		}
	);
}, []);
```

## Create Helper Functions

To store the message data, create a piece of state underneath the hooks:

```js
const [messageData, setMessageData] = useState([]);
```

Next, assign the message data coming from the messages collection to `setMessageData`:

```jsx
useEffect(() => {
	if (!data) return;
	setMessageData((message) => [...message, ...data.messages]);
}, [data]);
```

Finally, set up the `handleClick` method for the button such that when the button is clicked, a new message is sent to
the collection and shows up in real time on the UI.

```js
const handleClick = () => {
	addMessage({ variables: { text: 'Hello World!', user: 'Ben' } });
};
```

## Display the Messages

Within the `<ul/>` created earlier, map over `messageData` and render it:

```js
<ul>
	{messageData.map(
		(
			message // [!code ++]
		) => (
			<li key={message.id}>
				{' '}
				// [!code ++]
				<p>
					{' '}
					// [!code ++]
					{message.user} says {message.text} // [!code ++]
				</p>{' '}
				// [!code ++]
			</li> // [!code ++]
		)
	)}{' '}
	// [!code ++]
</ul>
```

Now, whenever you click the button, a new message with its corresponding text and user will be displayed. Also, any
updates made in the collection should automatically reflect in the UI.

## In Summary

In this guide, you have successfully established a connection and authenticated. You've also created your first
subscription.

[Learn more about subscriptions with WebSockets with Directus.](/guides/real-time/subscriptions/websockets)

## Full Code Sample

```js
import { gql, useQuery, useMutation } from '@apollo/client';
import { createClient } from 'graphql-ws';
import { useEffect, useState } from 'react';

const client = createClient({
	url: 'ws://your-directus-url/graphql',
	keepAlive: 30000,
	connectionParams: async () => {
		return { access_token: 'MY_TOKEN' };
	},
});

const GET_MESSAGES = gql`
	query {
		messages {
			id
			text
			user
		}
	}
`;

const ADD_MESSAGE = gql`
	mutation AddMessage($text: String!, $user: String!) {
		create_messages_item(data: { text: $text, user: $user }) {
			id
			text
			user
		}
	}
`;

const App = () => {
	const { loading, error, data } = useQuery(GET_MESSAGES);

	const [addMessage] = useMutation(ADD_MESSAGE);

	const [messageData, setMessageData] = useState([]);

	useEffect(() => {
		if (!data) return;
		setMessageData((message) => [...message, ...data.messages]);
	}, [data]);

	const handleClick = () => {
		addMessage({ variables: { text: 'Hello World!', user: 'Ben' } });
	};

	useEffect(() => {
		return client.subscribe(
			{
				query: `
        subscription {
          messages_mutated {
            id,
            text
            user
            _event
          }
        }`,
			},
			{
				next: ({ data }) => {
					const { text, user, id, _event } = data?.messages_mutated || {};
					if (_event === 'create') {
						setMessageData((messages) => [...messages, { id, user, text }]);
					} else if (_event === 'delete') {
						setMessageData((messages) => messages.filter((m) => m.id !== id));
					} else if (_event === 'update') {
						setMessageData((messages) =>
							messages.map((message) => (message.id === id ? { ...message, text, user } : message))
						);
					}
				},
				error: (err) => {
					console.log(err);
				},
				complete: () => {},
			}
		);
	}, []);

	if (loading) return <p>Loading...</p>;
	if (error) return <p>An error occured :(</p>;

	return (
		<div>
			<button onClick={handleClick}>Hey</button>
			<ul>
				{messageData.map((message) => (
					<li key={message.id}>
						<p>
							{message.user} says {message.text}
						</p>
					</li>
				))}
			</ul>
		</div>
	);
};

export default App;
```
