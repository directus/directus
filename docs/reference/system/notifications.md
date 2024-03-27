---
description: REST and GraphQL API documentation on the Notifications collection in Directus.
readTime: 5 min read
pageClass: page-reference
---

# Notifications

> Notifications allow you to send/receive messages to/from other users of the platform.

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

## List Notifications

List all notifications that exist in Directus.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /notifications`

`SEARCH /notifications`

If using SEARCH you can provide a [query object](/reference/query) as the body of your request.

[Learn more about SEARCH ->](/reference/introduction#search-http-method)

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	notifications: [directus_notifications]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readNotifications } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readNotifications(query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

An array of up to [limit](/reference/query#limit) [notification objects](#the-notification-object). If no items are
available, data will be an empty array.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /notifications`

`SEARCH /notifications`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
query {
	notifications {
		id
		recipient
		subject
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readNotifications } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readNotifications({
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Retrieve a notification

List an existing notification by primary key.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /notifications/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Query {
	notifications_by_id(id: ID!): directus_notifications
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, readNotification } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(readNotification(notification_id, query_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

### Response

Returns the requested [notification object](#the-notification-object).

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`GET /notifications/42`

</template>
<template #graphql>

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

</template>
<template #sdk>

```js
import { createDirectus, rest, readNotification } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	readNotification('4', {
		fields: ['*'],
	})
);
```

</template>
</SnippetToggler>

## Create a Notification

Create a new notification.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /notifications`

Provide a [notification object](#the-notification-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_notifications_item(data: create_directus_notifications_input!): directus_notifications
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createNotification } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createNotification(notification_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [notification object](#the-notification-object).

### Response

Returns the [notification object](#the-notification-object) for the created notification.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /notifications`

```json
{
	"recipient": "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca",
	"subject": "Hi there!"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	create_notifications_item(data: { recipient: "410b5772-e63f-4ae6-9ea2-39c3a31bd6ca", subject: "Hi there!" }) {
		id
		recipient
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createNotification } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createNotification({
		recipient: '86eb0719-f5fc-4465-91f6-9d9cd527e105',
		subject: 'Hello there!',
		message: 'Hi fellow user',
	})
);
```

</template>
</SnippetToggler>

## Create Multiple Notifications

Create multiple new notifications.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /notifications`

Provide an array of [notification objects](#the-notification-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	create_notifications_items(data: [create_directus_notifications_input!]!): [directus_notifications]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, createNotifications } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(createNotifications(notifcation_object_array));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

An array of partial [notification objects](#the-notification-object).

### Response

Returns the [notification object](#the-notification-object) for the created notification.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`POST /notifications`

```json
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

</template>
<template #graphql>

`POST /graphql/system`

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

</template>
<template #sdk>

```js
import { createDirectus, rest, createNotifications } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	createNotifications([
		{
			recipient: '86eb0719-f5fc-4465-91f6-9d9cd527e105',
			subject: 'Hello there!',
			message: 'Hi fellow user',
		},
		{
			recipient: '86eb0719-f5fc-4465-91f6-9d9cd527e105',
			subject: 'How are you!',
			message: 'I see you are a new contributor, can I help with anything?',
		},
	])
);
```

</template>
</SnippetToggler>

## Update a Notification

Update an existing notification.

::: tip Email Notifications

Emails are only sent when the notification is created. Updated to an existing notification won't trigger a new
notification email to be sent.

:::

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /notifications/:id`

Provide a partial [notification object](#the-notification-object) as the body of your request.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_notifications_item(id: ID!, data: update_directus_notifications_input): directus_notifications
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateNotification } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(updateNotification(notification_id, partial_notification_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

A partial [notification object](#the-notification-object).

### Response

Returns the [notification object](#the-notification-object) for the updated notification.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /notifications/34`

```json
{
	"message": "This is my updated notification"
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_notifications_item(id: 32, data: { message: "This is my updated notification" }) {
		id
		message
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateNotification } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateNotification('4', {
		status: 'archive',
	})
);
```

</template>
</SnippetToggler>

## Update Multiple Notifications

Update multiple existing notifications.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /notifications`

```json
{
	"keys": notification_id_array,
	"data": partial_notification_object
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	update_notifications_items(ids: [ID!]!, data: update_directus_notifications_input): [directus_notifications]
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateNotifications } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(updateNotifications(notification_id_array, partial_notification_object));
```

</template>
</SnippetToggler>

#### Query Parameters

Supports all [global query parameters](/reference/query).

#### Request Body

`keys` **Required**\
Array of primary keys of the notifications you'd like to update.

`data` **Required**\
Any of [the notification object](#the-notification-object)'s properties.

### Response

Returns the [notification objects](#the-notification-object) for the updated notifications.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`PATCH /notifications`

```json
{
	"keys": [15, 64],
	"data": {
		"message": "Updated message!"
	}
}
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	update_notifications_items(ids: [15, 64], data: { message: "Updated message!" }) {
		id
		recipient
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, updateNotifications } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(
	updateNotifications(['1', '2', '3'], {
		status: 'archive',
	})
);
```

</template>
</SnippetToggler>

## Delete a Notification

Delete an existing notification.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /notifications/:id`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_notifications_item(id: ID!): delete_one
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteNotification } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteNotification(notification_id));
```

</template>
</SnippetToggler>

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /notifications/34`

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_notifications_item(id: 32) {
		id
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteNotification } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteNotification('3'));
```

</template>
</SnippetToggler>

## Delete Multiple Notifications

Delete multiple existing notifications.

### Request

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /notifications`

Provide an array of notification IDs as your request body.

</template>
<template #graphql>

`POST /graphql/system`

```graphql
type Mutation {
	delete_notifications_items(ids: [ID!]!): delete_many
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteNotifications } from '@directus/sdk';

const client = createDirectus('directus_project_url').with(rest());

const result = await client.request(deleteNotifications(notification_id_array));
```

</template>
</SnippetToggler>

#### Request Body

An array of notification primary keys

### Response

Empty body.

### Example

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api">
<template #rest>

`DELETE /notifications`

```json
[15, 251, 810]
```

</template>
<template #graphql>

`POST /graphql/system`

```graphql
mutation {
	delete_notifications_items(ids: [15, 251, 810]) {
		ids
	}
}
```

</template>
<template #sdk>

```js
import { createDirectus, rest, deleteNotifications } from '@directus/sdk';

const client = createDirectus('https://directus.example.com').with(rest());

const result = await client.request(deleteNotifications(['4', '5', '6', '7']));
```

</template>
</SnippetToggler>
