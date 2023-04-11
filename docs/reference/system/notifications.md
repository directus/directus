---
description: REST and GraphQL API documentation on the Notifications collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Notifications

> Notifications allow you to send/receive messages to/from other users of the platform.

---

## The Notification Object

`id` **integer**\
Primary key of the revision.

`timestamp` **string**\
Timestamp in ISO8601 when the notification was created.

`status` **string**\
Current status of the notification. One of "inbox", "archived".

`recipient` **many-to-one**\
User that received the notification.

`sender` **many-to-one**\
User that sent the notification, if any.

`subject` **string**\
Subject line of the message.

`message` **string**\
Notification's message content. Will be sent in the email.

`collection` **string**\
Collection this notification references.

`item` **string**\
Primary key of the item this notification references.

```json
{
	"id": 2,
	"timestamp": "2021-11-24T13:57:35Z",
	"status": "inbox",
	"recipient": "3EE34828-B43C-4FB2-A721-5151579B08EA",
	"sender": "497a495e-5529-4e46-8feb-2f35e9b85601",
	"subject": "You were mentioned in articles",
	"message": "\nHello admin@example.com,\n\rijk@directus.io has mentioned you in a comment:\n\n> Hello <em>admin@example.com</em>!\n\n<a href=\"http://localhost:8080/admin/content/articles/1\">Click here to view.</a>\n",
	"collection": "articles",
	"item": "1"
}
```

---

## List Notifications

List all notifications that exist in Directus.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

An array of up to [limit](/reference/query#limit) [notification objects](#the-notification-object). If no items are
available, data will be an empty array.

### REST API

```
GET /notifications
SEARCH /notifications
```

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	notifications: [directus_notifications]
}
```

##### Example

```graphql
query {
	notifications {
		id
		recipient
		subject
	}
}
```

---

## Retrieve a notification

List an existing notification by primary key.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Returns

Returns the requested [notification object](#the-notification-object).

### REST API

```
GET /notifications/:id
```

##### Example

```
GET /notifications/42
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Query {
	notifications_by_id(id: ID!): directus_notifications
}
```

##### Example

```graphql
query {
	notifications_by_id(id: 42) {
		id
		sender
		recipient
		message
		subject
	}
}
```

---

## Create a Notification

Create a new notification.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [notification object](#the-notification-object).

### Returns

Returns the [notification object](#the-notification-object) for the created notification.

### REST API

```
POST /notifications
```

##### Example

```json
// POST /notifications

{
	"recipient": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
	"subject": "Hi there!"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	create_notifications_item(data: create_directus_notifications_input!): directus_notifications
}
```

##### Example

```graphql
mutation {
	create_notifications_item(data: { recipient: "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca", subject: "Hi there!" }) {
		id
		recipient
	}
}
```

---

## Create Multiple Notifications

Create multiple new notifications.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

An array of partial [notification objects](#the-notification-object).

### Returns

Returns the [notification object](#the-notification-object) for the created notification.

### REST API

```
POST /notifications
```

##### Example

```json
// POST /notifications

[
	{
		"collection": "directus_files",
		"recipient": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
		"message": "Hi there! You should check out these files"
	},
	{
		"collection": "articles",
		"recipient": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
		"message": "Hi there! You should check out these articles"
	}
]
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	create_notifications_items(data: [create_directus_notifications_input!]!): [directus_notifications]
}
```

##### Example

```graphql
mutation {
	create_notifications_items(
		data: [
			{
				collection: "directus_files"
				recipient: "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca"
				message: "Hi there! You should check out these files"
			}
			{
				collection: "articles"
				recipient: "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca"
				message: "Hi there! You should check out these articles"
			}
		]
	) {
		id
		recipient
	}
}
```

---

## Update a Notification

Update an existing notification.

::: tip Email Notifications

Emails are only sent when the notification is created. Updated to an existing notification won't trigger a new
notification email to be sent.

:::

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

A partial [notification object](#the-notification-object).

### Returns

Returns the [notification object](#the-notification-object) for the updated notification.

### REST API

```
PATCH /notifications/:id
```

##### Example

```json
// PATCH /notifications/34

{
	"message": "This is my updated notification"
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_notifications_item(id: ID!, data: update_directus_notifications_input): directus_notifications
}
```

##### Example

```graphql
mutation {
	update_notifications_item(id: 32, data: { message: "This is my updated notification" }) {
		id
		message
	}
}
```

---

## Update Multiple Notifications

Update multiple existing notifications.

### Query Parameters

Supports all [global query parameters](/reference/query).

### Request Body

`keys` **Required**\
Array of primary keys of the notifications you'd like to update.

`data` **Required**\
Any of [the notification object](#the-notification-object)'s properties.

### Returns

Returns the [notification objects](#the-notification-object) for the updated notifications.

### REST API

```
PATCH /notifications
```

##### Example

```json
// PATCH /notifications

{
	"keys": [15, 64],
	"data": {
		"message": "Updated message!"
	}
}
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	update_notifications_items(ids: [ID!]!, data: update_directus_notifications_input): [directus_notifications]
}
```

##### Example

```graphql
mutation {
	update_notifications_items(ids: [15, 64], data: { message: "Updated message!" }) {
		id
		recipient
	}
}
```

---

## Delete a Notification

Delete an existing notification.

### Returns

Empty body.

### REST API

```
DELETE /notifications/:id
```

##### Example

```
DELETE /notifications/34
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_notifications_item(id: ID!): delete_one
}
```

##### Example

```graphql
mutation {
	delete_notifications_item(id: 32) {
		id
	}
}
```

---

## Delete Multiple Notifications

Delete multiple existing notifications.

### Request Body

An array of notification primary keys

### Returns

Empty body.

### REST API

```
DELETE /notifications
```

##### Example

```json
// DELETE /notifications
[15, 251, 810]
```

### GraphQL

```
POST /graphql/system
```

```graphql
type Mutation {
	delete_notifications_items(ids: [ID!]!): delete_many
}
```

##### Example

```graphql
mutation {
	delete_notifications_items(ids: [15, 251, 810]) {
		ids
	}
}
```
