---
contributors: Kevin Lewis
description: "Learn how to get started with Directus' WebSockets subscriptons."
---

# WebSockets Subscriptions

WebSocket subscriptions allows for real-time notification of item creations, edits, and deletions in a collection.

This guide assumes you already know
[how to establish, authenticate, and send messages](/guides/real-time/getting-started/websockets) over a WebSocket
connection.

## Subscribe To Changes In A Collection

Send the following message over your WebSocket connection to start a subscription:

```json
{
	"type": "subscribe",
	"collection": "messages"
}
```

In return, you will receive a message to confirm that your subscription has been initialized:

```json
{
	"type": "subscription",
	"event": "init"
}
```

## Handling Collection Changes

When a change happens to an item in a collection with an active subscription, it will emit a message

```json
{
	"type": "subscription",
	"event": "create",
	"data": [
		// ...
	]
}
```

The `event` will be one of `create`, `update`, or `delete`. If the event is `create` or `update`, the `data` will
contain the full item objects (or specific fields, if specified). If the event is `delete`, just the `id` will be
returned.

## Working With Specific CRUD Operations

Using the optional `event` argument you can filter for specific `create`, `update`, and `delete` events.

Here's an example of how to do this:

```json
{
	"type": "subscribe",
	"collection": "messages",
	"event": "create"
}
```

## Specifying Fields To Return

If you only want to return specific fields on subscription events, add the `query.fields` property when initializing the
subscription:

```json
{
	"type": "subscribe",
	"collection": "messages",
	"query": { "fields": ["text"] }
}
```

Refer to the [Fields Query Parameter](/reference/query.html#fields) docs for more information on specifying what data
should be returned.

## Using UIDs

You can have multiple ongoing CRUD operations and subscriptions at a time. When doing so, it is highly recommended to
add an additional `uid` property to your request, which will be included in related item change events.

```json
{
	"type": "subscribe",
	"collection": "messages",
	"uid": "any-string-value"
}
```

When you receive responses, the same `uid` will be included as a property:

```json
{
	"type": "subscription",
	"event": "create",
	"data": [
		// ...
	],
	"uid": "any-string-value"
}
```

Use a new `uid` for every subscription, and you can easily tell which subscription an event is related to.

## Unsubscribing From Changes

To stop change events being sent from a specific subscription, send the following message:

```json
{
	"type": "unsubscribe",
	"uid": "identifier"
}
```

You can also omit `uid` to stop all subscriptions at once.
