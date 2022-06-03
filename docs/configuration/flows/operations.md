# Operations

> Operations are the actions performed after the Flow is triggered. Whether you need to access and create Data within
> Directus, send information off to outside services, create time-oriented Flows, set conditional logic or even trigger
> other Flows, these simple but powerful tasks can make it happen.

[[toc]]

:::tip Before You Begin

Please be sure to read the documentation on [Flows](/configuration/flows/flows) and [Triggers](flows/triggers).

:::

## Condition

![Condition](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/condition-20220603A.webp)

Routes to the next success or failure Operation based on some conditional `if` / `else` logic defined by a Filter query.
That means if the query condition is met, the Flow will move forward with the success Operation. Otherwise, the failure
Operation will be initiated.

- **Condition Rules** — Create conditions with [Filter Rules](/configuration/filter-rules).

## Create Data

![Create Data](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/create-data-20220603A.webp)

Creates some Item(s) in a Collection.

- **Collection** — Use the dropdown to select a Collection to create Items in.
- **Permissions** — Set the scope of permissions used for this Operation.
- **Emit Events** — Toggle whether the event is emitted.
- **Payload** — Create Item(s) in a Collection. To learn more, see [API > Items](reference/items/).

:::tip

Make sure the Operation is scoped with the [permissions](configuration/users-roles-permissions) necessary to create
Items.

:::

## Delete Data

![Delete Data](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/delete-data-20220603A.webp)

Deletes some Item(s) from a Collection by ID or query.

- **Permissions** — Set the scope of permissions used for this Operation.
- **Collection** — Use the dropdown to set the Collection to delete Items from.
- **IDs** — Set Item IDs and press enter to confirm. Click the ID to remove.
- **Query** — Select Items to delete with a query. To learn more, see [Filter Rules](/configuration/filter-rules).

:::tip

Make sure the Operation is scoped with the [permissions](configuration/users-roles-permissions) necessary to delete
Items.

:::

## Read Data

![Read Data](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/read-data-20220603A.webp)

Reads Item(s) form a Collection and adds them onto the Flow Object. You may select Items by their ID or run a query to
select the Items you wish to update.

- **Permissions** — Set the scope of permissions used for this Operation.
- **Collections** — Select the Collection to read Items from.
- **IDs** — Input ID for Item(s) you wish to read and press enter. Click the ID to remove.
- **Query** — Select Items with a query. To learn more, see [Filter Rules](/configuration/filter-rules).

## Update Data

![Update Data](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/update-data-20220603A.webp)

Updates Item(s) in a Collection. You may select Items by their ID or run a query to select the Items you wish to update.

- **Permissions** — Defines Role that this Operation will inherit permissions from.
- **Collections** — Select the Collection to read Items from.
- **IDs** — Input ID for Item(s) you wish to read and press enter. Click the ID to remove.
- **Payload** — Updates Item(s) in a Collection. To learn more, see [API > Items](reference/items/).
- **Query** — Select Items to update with a query. To learn more, see [Filter Rules](/configuration/filter-rules).

## Log to Console

![Log to Console](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/log-to-console-20220603A.webp)

Output something to the console. This will appear in both the server side and in-app Sidebar Console Log. This is a key
tool to help troubleshoot Flow configuration.

- **Message** — Sets a [log message](#configuration/flows/flows/logs).

:::tip

This will be delivered to your in-app Log Panel and also logged to the server-side console.

:::

## Send Email

![Send Email](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/send-email-20220603A.webp)

Sends email(s). Flow Object keys can be used as variables. This means an array of emails from a previous step in Flows
could be used.

- **To** — Sets email addresses. Hit `↵` to save the email. Click an email to remove it.
- **Subject** — Set subject line.
- **Body** — Provides WYSIWYG editor to create email body.

:::tip

If you are testing out this Operation locally from `localhost:8080`, be sure to check your spam box as your email
provider may send it there automatically.

:::

## Send Notification

![Send Notification](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/send-notification-20220603A.webp)

Sends a notification to an app user.

- **Users** — Defines a User by their primary key UUID. Use [Flow keys](/configuration/flows/flows/#the-flow-object) to
  set this dynamically.
- **Permissions** — Defines Role that this Operation will inherit permissions from.
- **Title** — Sets the notification title.
- **Message** — Sets the main body of the notification.

## Webhook / Request URL

![Webhok / Request URL](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/webhook-20220603A.webp)

Makes a request to another URL.

- **Method** — Choose to make a GET, POST, PATCH, DELETE, or other type of request.
- **URL** — Define the URL to send request to.
- **Headers** — Create new `header:value` to pass along with the request.
- **Request Body** — Set request body data. Use any string or JSON.

## Sleep

![Sleep](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/sleep-20220603A.webp)

Pauses Operation Execution on the Flow for a given amount of milliseconds. Then continues to the next Operation.

- **Milliseconds** — Define the number of milliseconds to pause.

## Transform Payload

![Transform Payload](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/transform-payload-20220603A.webp)

Transform Payload simply creates a new key on the Flow Object with nested JSON data. This provides a clean space where
you can combine data from multiple Flow keys all into one object. So for example, if you needed to use the same data
multiple times _(e.g. send it in a web request and also use it to create an Item in a Collection)_, you can combine the
data one time with Transform Payload, then use its Operation key again and again.

- **JSON** — Define JSON to insert into the Flow Object.

## Trigger Flow

![Trigger Flow](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/trigger-flow-20220603A.webp)

This Operation starts another Flow and passes data to it. It should be used in combination with the
[Another Flow](/configuration/triggers/#another-flow) Trigger.

- **Flow** — Define a Flow by its primary key UUID.
- **Payload** — Define JSON to insert into the Flow Object.
