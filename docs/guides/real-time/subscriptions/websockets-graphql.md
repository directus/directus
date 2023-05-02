# Subscriptions With WebSockets using GraphQL

WebSocket subscriptions allows for real-time notification of item creations, edits, and deletions in a collection.

This guide assumes you already know
[how to establish and authenticate](/guides/real-time/getting-started/websockets-graphql) over a WebSocket connection.

## Subscribe To Changes In A Collection

Send the following query, `<collection>_mutated` over your WebSocket connection to subscribe to changes. If you want to
subscribe to a `messages` collection, the query would look like this:

```graphql
subscription {
	messages_mutated {
		id
		text
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
		"id": "1",
		"text": "Hello world!",
		"_event": "create"
	}
}
```

An `event` will be either `create`, `update`, or `delete`. If the event is `create` or `update`, the payload will
contain the full item objects (or specific fields, if specified). If the event is `delete`, just the `id` will be
returned.
