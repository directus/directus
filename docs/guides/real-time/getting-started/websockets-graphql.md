# Getting Started With WebSockets using GraphQL

You can connect to a Directus project using a WebSocket interface and get updates on data held in a collection in
real-time.

This guide will show you how to get started with Directus' WebSockets interface, by subscribing to data using GraphQL.

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
