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

