---
description:
  Operations are the individual actions in a flow. They enable you to do things like manage data within Directus,
  transform the flow's data, send information off to outside services, set conditional logic, trigger other flows, and
  beyond!
readTime: 5 min read
---

# Operations

> Operations are the individual actions in a flow. They enable you to do things like manage data within Directus,
> transform the flow's data, send information off to outside services, set conditional logic, trigger other flows, _and
> beyond!_

::: tip Before You Begin

On this page, we'll explain what each operation does, the value it appends to the data chain, how to make use of its
configuration options, as well as any well as other relevant details. We will assume you have read the documentation on
[Flows](/app/flows) and [Triggers](/app/flows/triggers).

:::

## Condition

![Condition](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/condition-20220603A.webp)

A **Condition** operation lets you choose a **success path** or **failure path** by validating data passed into it with
[Filter Rules](/reference/filter-rules).

**Options**

- **Condition Rules** — Create conditions with [Filter Rules](/reference/filter-rules).

**Payload**

This operation does not generate data. If the filter rule is configured properly, it will append a `null` value on its
`operationKey`, regardless of if the condition was met or not. However, if the filter rule is misconfigured, it will
append an array containing an object you can use to help debug the misconfiguration.

**More Details**

::: warning

When using an [Event Hook](/app/flows/triggers#event-hook) configured to be **Filter (Blocking)**, if your flow ends
with a condition that executes with a `reject` path, it will cancel your database transaction.

:::

## Run Script

<!--
<video autoplay playsinline muted loop controls title="Run Script">
	<source src="" type="video/mp4" />
</video>
-->

This operation lets you add a custom script using vanilla JavaScript or TypeScript. The script will be executed securely
in an isolated sandbox. No interactions take place between the sandbox and the host except for sharing input and output
values. This means, for example, no access to the file system and no ability to do network requests.

**Options**

The operation provides a default function template. The _optional_ `data` parameter lets you pass in the data chain as
an argument.

**Payload**

The function's `return` value will be appended under its `<operationKey>`.

**More Details**

As an example, let's say you have this function in a script operation, named `myScript`.

```JSON
// A key from the data chain
{
  "previousOperation": {
    "value": 5
  }
}
```

Then you add the following logic via Run Script.

```TypeScript
// Your function in the myScript operation
module.exports = function(data) {
  return {
    timesTwo: data.previousOperation.value * 2
  }
}

```

The returned value will be appended under the `myScript` operation key.

```JSON
{
  "previousOperation": {
    "value": 5
  },
  "myScript": {
    "timesTwo": 10
  }
}

```

::: tip

Make sure your `return` value is valid JSON.

:::

::: tip Throwing Errors

If you throw an error in a **Run Script** operation, it will immediately break your flow chain and stop execution of
subsequent flows. If you used a ["Blocking" Event hook](/app/flows/triggers#event-hook), throwing an error will cancel
the original event transaction to the database.

:::

::: tip Node Modules

To prevent unauthorized access to the underlying server, node modules can't be used in the **Run Script** operation. If
you require a third party library for your custom script, you can create a custom
[operation extension](/extensions/operations) instead.

:::

## Create Data

![Create Data](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/create-data-20220603A.webp)

This operation creates item(s) in a collection.

**Options**

- **Collection** — Select the collection you'd like to create items in.
- **Permissions** — Select the scope of permissions used for this operation.
- **Emit Events** — Toggle whether the event is emitted.
- **Payload** — Defines the payload to create item(s) in a collection.

**Payload**

An array with the ID(s) of all items created will be appended under its `<operationKey>`.

**More Details**

::: warning

**Emit Events** toggles the event's _visibility_ throughout Directus. For example, if toggled on, this operation will
trigger relevant event hooks in other flows or custom extensions. If toggled off, the operation will not trigger other
event hooks. Imagine a situation where you have a flow being triggered by `<collection>.items.create` which contains an
operation that then tries to create another item in that `<collection>`. This would throw an infinite loop where the
operation triggers its own flow, endlessly. However, if you toggle **Emit Events** off, then this operation no longer
triggers other event hooks.

:::

::: tip

To learn about payload requirements when creating an item, see [API Reference > Items](/reference/items).

:::

## Delete Data

![Delete Data](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/delete-data-20220603A.webp)

This operation deletes item(s) from a collection.

**Options**

- **Collection** — Select the collection you'd like to delete items from.
- **Permissions** — Set the scope of permissions used for this operation.
- **Emit Events** — Toggle whether the event is emitted.
- **IDs** — Set Item IDs and press enter to confirm. Click the ID to remove.
- **Query** — Select items to delete with a query. To learn more, see [Filter Rules](/reference/filter-rules).

**Payload**

An array with the ID(s) of all items deleted will be appended under its `<operationKey>`.

**More Details**

::: warning

**Emit Events** toggles the event's _visibility_ throughout Directus. For example, if togged on, this operation will
trigger relevant event hooks in other flows or custom extensions. If toggled off, the operation will not trigger other
event hooks. Imagine a situation where you have a flow being triggered by `<collection>.items.delete` which contains an
operation that then tries to delete another item in that `<collection>`. This would throw an infinite loop where the
operation triggers its own flow, endlessly. However, if you toggle **Emit Events** off, then this operation no longer
triggers other event hooks.

:::

## Read Data

![Read Data](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/read-data-20220603A.webp)

This operation reads item(s) from a collection and adds them onto the data chain. You may select Items by their ID or by
running a query.

**Options**

- **Permissions** — Set the scope of permissions used for this operation.
- **Collections** — Select the collection you'd like to read items from.
- **IDs** — Input the ID for items you wish to read and press enter. Click the ID to remove.
- **Query** — Select the items with a query. To learn more, see [Filter Rules](/reference/filter-rules).
- **Emit Events** — Toggle whether the event is emitted.

**Payload**

An array containing all items read will be appended under its `<operationKey>`.

**More Details**

::: warning

**Emit Events** toggles the event's _visibility_ throughout Directus. For example, if togged on, this operation will
trigger relevant event hooks in other flows or custom extensions. If toggled off, the operation will not trigger other
event hooks. Imagine a situation where you have a flow being triggered by `<collection>.items.read` which contains an
operation that then tries to read another item in that `<collection>`. This would throw an infinite loop where the
operation triggers its own flow, endlessly. However, if you toggle **Emit Events** off, then this operation no longer
triggers other event hooks.

:::

## Update Data

![Update Data](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/update-data-20220603A.webp)

This operation updates item(s) in a collection. You may select item(s) to update by their ID or by running a query.

**Options**

- **Collection** — Select the collection on which you'd like to update items in.
- **Permissions** — Set the role that this operation will inherit permissions from.
- **Emit Events** — Toggle whether the event is emitted.
- **IDs** — Input the ID for Item(s) you wish to update and press enter. Click the ID to remove.
- **Payload** — Update Items in a collection, using one of the following formats:
  - Single object with data, to update items specified in **IDs** or **Query** to the same values.
  - Single object with keys and data, to update multiple items to the same values.
  - Array of objects with data including primary keys, to update multiple items to different values.
  - To learn more, see [API > Items](/reference/items).
- **Query** — Select items to update with a query. To learn more, see [Filter Rules](/reference/filter-rules).

**Payload**

An array containing all items updated will be appended under its `<operationKey>`.

**More Details**

::: warning

**Emit Events** toggles the event's _visibility_ throughout Directus. For example, if togged on, this operation will
trigger relevant event hooks in other flows or custom extensions. If toggled off, the operation will not trigger other
event hooks. Imagine a situation where you have a flow being triggered by `<collection>.items.update` which contains an
operation that then tries to update another item in that `<collection>`. This would throw an infinite loop where the
operation triggers its own flow, endlessly updating items. However, if you toggle **Emit Events** off, then this
operation no longer triggers other event hooks.

:::

::: tip

To learn about `payload` requirements when updating an item, see [API Reference > Items](/reference/items).

:::

## JSON Web Token (JWT)

This operation lets you sign and verify a JSON Web Token (JWT) using the
[`jsonwebtoken`](https://www.npmjs.com/package/jsonwebtoken) package.

**Options**

- **Operation** — Select the operation you'd like to perform.
- **Payload** — The string or JSON payload to sign.
- **Token** — The JSON Web Token to verify or decode.
- **Secret** — The secret key used to sign or verify a token.
- **Options** — The options object provided to the operation. For the list of available options, see the
  [documentation of `jsonwebtoken`](https://www.npmjs.com/package/jsonwebtoken#usage).

**Payload**

Based on the operation selected, a JSON Web Token (JWT) or `payload` will be appended under its `<operationKey>`.

## Log to Console

![Log to Console](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/log-to-console-20220603A.webp)

This operation outputs information to the server-side console as well as the [Logs](/app/flows#logs) within the Data
Studio. This is a key tool for troubleshooting flow configuration. A Log operation's key will have a null value on the
data chain.

**Options**

- **Message** — Sets a [log message](/app/flows#logs).

**Payload**

This operation does not generate data for the data chain as its messages are for debugging and troubleshooting. It will
append a `null` value on the `operationKey`.

**More Details**

For more details, see the section on [Logs](/app/flows#logs).

## Send Email

![Send Email](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/send-email-20220603A.webp)

This operation sends off emails.

**Options**

- **To** — Sets the email addresses. Hit `↵` `Enter` (PC) or `return` (Mac) to save the email. Click on a pill to remove
  it.
- **Subject** — Set the subject line.
- **Body** — Use a Markdown or WYSIWYG editor to create the email body.

**Payload**

This operation does not generate data for the data chain. It will append a `null` value on the `operationKey`.

**More Details**

::: tip Batch Emails

You can input an array of emails in the `To` input option to send off multiple emails.

:::

::: tip

If you are testing out this operation from `localhost:8080`, be sure to check your spam box, because your email provider
may send it there automatically.

:::

## Send Notification

![Send Notification](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/send-notification-20220603A.webp)

This operation pushes notifications to Directus Users. If the operation executes successfully, a list containing the IDs
of all sent notifications generated is appended under this operation's key.

**Options**

- **Users** — Define a user by their UUID. Hit `↵` `Enter` (PC) or `return` (Mac) to save it. Click on a pill to remove
  it.
- **Permissions** — Define the role that this operation will inherit permissions from.
- **Title** — Set the title of the notification.
- **Message** — Set the main body of the notification.

**Payload**

This operation does not generate data. It will append a `null` value on its `operationKey`.

**More Details**

::: tip Batch Notifications

You can input an array of UUIDs in the `To` input option to send off multiple notifications.

:::

## Webhook / Request URL

![Webhook / Request URL](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/webhook-20220603A.webp)

This operation makes a request to another URL.

**Options**

- **Method** — Choose to make a GET, POST, PATCH, DELETE, or other type of request.
- **URL** — Define the URL to send the request to.
- **Headers** — Create a new `header:value` to pass along with the request.
- **Request Body** — Set the request body's data.

**Payload**

When an operation completes successfully, the `response` is appended under its `<operationKey>`.

## Sleep

![Sleep](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/sleep-20220603A.webp)

This operation creates a delay in the Flow for a given amount of milliseconds, then continues to the next operation.

**Options**

- **Milliseconds** — Define the number of milliseconds to sleep.

**Payload**

This operation does not generate data. It will append a `null` value on its `operationKey`.

## Transform Payload

![Transform Payload](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/transform-payload-20220603A.webp)

This operation lets you custom define your own JSON payload for use in subsequent operations. This enables you to take
multiple sources of data and "tidy them up" into a single payload.

**Options**

- **JSON** — Define JSON to insert into the data chain.

**Payload**

When an operation completes successfully, the value you defined under the **JSON** configuration operation is appended
onto its `operationKey`.

**More Details**

When does the Transform Payload operation come in handy? Let's say you need to create a payload with data from a
`users_collection`, `widgets_collection` and some 3rd party resource which processes the data. You can add a
[Read Data](#read-data) operation for `collection_a`, another Read Data operation for `collection_b`, and a
[Webhook](#webhook--request-url) operation for the third party resource.

Then you could stitch together all this data to create a new JSON object, like so:

```
{
	"note": "You can add a hard-coded value!",
	"name": "{{users_collection.username}}",
	"widget_id": "{{widgets_collection.id}}",
	"results": "{{webhookKey.subnestedValue}}"
}
```

## Trigger Flow

![Trigger Flow](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/trigger-flow-20220603A.webp)

This operation starts another flow and _(optionally)_ passes data into it. It should be used in combination with the
[Another Flow](/app/flows/triggers#another-flow) trigger.

**Options**

- **Flow** — Define a flow by its primary key UUID.
- **Payload** — Defines a JSON `payload` to pass into `$trigger` on the flow it triggered.

**Payload**

If you've configured a **Response Body** in the trigger of the other flow, this will be appended under this
`operationKey`. If no **Response Body** is configured, `null` is appended under this `operationKey`.

**More Details**

::: tip Flows for-loops

If you pass an array to the other flow, the other flow will run once for each item in the array.

:::
