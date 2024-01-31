---
contributors: Esther Agbaje
description: "Learn how to get started with Directus' GraphQL interface."
---

# Getting Started With GraphQL Subscriptions

You can connect to a Directus project and get updates on data held in a collection in real-time.

This guide will show you how to get started with subscribing to data using GraphQL. GraphQL is framework-agnostic, so
you can apply the same set of steps in your stack of choice.

> GraphQL Subscriptions are read-only. This means you can't run `create`, `update`, or `delete` operations over a
> connection. However, you can still use standard GraphQL queries to achieve this.

## Before You Begin

You will need a Directus project. If you don’t already have one, the easiest way to get started is with our
[managed Directus Cloud service](https://directus.cloud). You can also self-host Directus, ensuring the
`WEBSOCKETS_ENABLED` environment variable is set to `true`.

Create a new collection called `messages`, with a `date_created` field enabled in the _Optional Fields_ pane on
collection creation. Create the required field such as an input field called `text`.

If it doesn’t already exist, create a user with a role that can execute read and create operations on the collection.

Finally in the Directus Data Studio, create a static access token for the user, copy it, and save the user profile.

## Create a Connection

Establish a WebSocket connection between the client and server using `createClient` from `graphql-ws`. To authenticate,
enter both `your-directus-url` and the `token` generated earlier.

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

This immediately creates a connection and ensures that only authorized clients can access the resources and real-time
data updates.

[Learn more about WebSocket authentication here.](/guides/real-time/authentication)

## Create a Subscription

After subscribing to collections over your connection, you will receive real-time data changes of those collections. To
subscribe to a `messages` collection, the query would look like this:

```js
client.subscribe(
	{
		query: `
				subscription {
					messages_mutated {
						key
						event
						data {
							text
						}
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
```

> `next`, `error` and `complete` are subscription handlers required by `graphql-ws`

Go ahead to add new data to your `messages` collection, you should immediately receive updates on your frontend.

## In Summary

In this guide, you have successfully established a connection and created your first subscription.

[Learn more about subscriptions with GraphQL with Directus.](/guides/real-time/subscriptions/graphql)
