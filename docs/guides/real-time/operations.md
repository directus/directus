---
description: "Learn how to execute CRUD operations over Directus' WebSockets interface"
contributors: Kevin Lewis
---

# WebSockets Operations

You can execute CRUD operations over Directus' WebSockets interface.

This guide assumes you already know
[how to establish, authenticate, and send messages](/guides/real-time/getting-started/websockets) over a WebSocket
connection.

::: info GraphQL

The GraphQL Subscriptions specification does not support CRUD operations. This guide is only suitable for WebSockets
connections not using GraphQL.

:::

## Read Items

```json
{
	"type": "items",
	"action": "read",
	"collection": "your_collection_name",
	"id": "single_item_id"
}
```

In return, you will receive a message with the specified item:

```json
{
	"type": "items",
	"data": {
		// ...
	}
}
```

### Read Multiple Items

Instead of using an `id` property, you can use an `ids` property with an array of item IDs you'd like to return, or omit
it to return all items in the specified collection. When returning multiple items, `data` will be an array of objects.

## Create Items

```json
{
	"type": "items",
	"action": "create",
	"collection": "your_collection_name",
	"data": {
		// ...
	}
}
```

In return, you will receive a message with the newly-created item:

```json
{
	"type": "items",
	"data": {
		// ...
	}
}
```

### Create Multiple Items

Instead of using an object as the value of `data`, you can provide an array of objects to create multiple items at once.
The returned payload will also contain an array.

## Update Items

```json
{
	"type": "items",
	"action": "update",
	"collection": "your_collection_name",
	"id": "single_item_id",
	"data": {
		// ...
	}
}
```

Regardless of how many items are updated, the `data` in the returned object will always be an array.

```json
{
	"type": "subscription",
	"event": "update",
	"data": [
		// ...
	]
}
```

### Update Multiple Items

Instead of using an `id` property, you can use an `ids` property with an array of item IDs to update multiple items at a
time.

## Delete Items

```json
{
	"type": "items",
	"action": "delete",
	"collection": "your_collection_name",
	"id": "single_item_id"
}
```

Regardless of how many items are updated, the `data` in the returned data will always be an array containing all IDs
from deleted items:

```json
{
	"type": "items",
	"event": "delete",
	"data": ["single_item_id", "single_item_id_2"]
}
```

## Delete Multiple Items

Instead of using an `id` property, you can use an `ids` property with an array of item IDs to delete multiple items at a
time.

Instead of using an `id` property, you can also use delete items based on a provided `query` property. To delete all
items, provide an empty query object.

## Operations With Queries

For non-delete operations, all fields that the user has access to are returned by default. You can add an optional
`query` property along with any of the [global query parameters](/reference/query) to change the returned data.

When running a delete operation, the items matching the `query` property will be deleted.

## Use UIDs To Better Understand Responses

All messages sent over WebSockets can optionally include a `uid` property with an arbitrary string and will be echoed in
the response. This allows you to identify which request a given response is related to. For example:

```json
{
	"type": "items",
	"action": "read",
	"collection": "your_collection_name",
	"query": {
		"sort": "date_created"
	},
	"uid": "sorted_latest_first"
}
```

The response will include the same `uid`:

```json
{
	"type": "items",
	"data": {
		// ...
	},
	"uid": "sorted_latest_first"
}
```
