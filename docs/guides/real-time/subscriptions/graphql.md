---
contributors: Esther Agbaje
description: "Learn how to get started with Directus' GraphQL subscriptons."
---

# GraphQL Subscriptions

GraphQL subscriptions provide live updates that are delivered in real-time whenever an item is created, updated or
deleted in your collection.

This guide assumes you already know [how to establish and authenticate](/guides/real-time/getting-started/graphql) over
a GraphQL connection.

## Subscribe To Changes In A Collection

Send the following query, `<collection>_mutated` over your WebSocket connection to subscribe to changes. If you want to
subscribe to a `messages` collection, the query would look like this:

```graphql
subscription {
	messages_mutated {
		key
		event
		data {
			id
			text
		}
	}
}
```

In return, this query will subscribe to changes in the messages collection and return the `id` and `text` fields of the
message added.

Refer to the [Fields Query Parameter](/reference/query.html#fields) docs for more information on specifying what data
should be returned.

## Handling Collection Changes

When a change happens to an item in a collection with an active subscription, it will emit a message

```json
{
	"messages_mutated": {
		"key": "1",
		"event": "create",
		"data": {
			"id": "1",
			"text": "Hello world!"
		}
	}
}
```

An event will be either `create`, `update`, or `delete`. If the event is `create` or `update`, the payload will contain
the full item objects (or specific fields, if specified). If the event is `delete`, just the `key` will be filled the
other requested fields will be `null`.

## Working With Specific CRUD Operations

Using the `event` argument you can filter for specific `create`, `update`, and `delete` events. Here's an example of how
to do this:

```graphql
subscription {
	messages_mutated(event: create) {
		key
		data {
			text
		}
	}
}
```

## Unsubscribing From Changes

To unsubscribe from a subscription, use the `dispose` method. Here's an example:

```js
client.dispose();
```

Calling `dispose` sends a message to the server to unsubscribe from the specified subscription. This will stop receiving
any further updates for that subscription.
