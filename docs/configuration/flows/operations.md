# Operations

> When a Flow is triggered, it performs an Operation. Whether you need to manage data within Directus, send information
> off to outside services, set conditional logic or even trigger other Flows, these simple but powerful Operations can
> make it happen.

[[toc]]

:::tip Before You Begin

Please be sure to read the documentation on [Flows](/configuration/flows) and [Triggers](/configuration/flows/triggers).

:::

## Condition

![Condition](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/condition-20220603A.webp)

A Condition routes to the next success or failure Operation based on some conditional `if` / `else` logic defined by a
Filter query. That means if the query condition is met, the Flow will move forward with the success Operation.
Otherwise, the failure Operation will initiate.

- **Condition Rules** — Create conditions with [Filter Rules](/reference/filter-rules).

## Create Data

![Create Data](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/create-data-20220603A.webp)

This Operation creates Item(s) in a Collection.

- **Collection** — Use the dropdown menu to select the Collection you'd like to create Items in.
- **Permissions** — Select the scope of permissions used for this Operation.
- **Emit Events** — Toggle whether the event is emitted.
- **Payload** — Create Item(s) in a Collection. To learn more, see [API > Items](/reference/items/).

:::tip

Make sure the Operation is scoped with the [permissions](/configuration/users-roles-permissions) necessary to create
Items.

:::

## Delete Data

![Delete Data](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/delete-data-20220603A.webp)

This Operation deletes Item(s) from a Collection by ID or query.

- **Permissions** — Set the scope of permissions used for this Operation.
- **Collection** — Use the dropdown menu to select the Collection you'd like to delete Items from.
- **IDs** — Set Item IDs and press enter to confirm. Click the ID to remove.
- **Query** — Select Items to delete with a query. To learn more, see [Filter Rules](/reference/filter-rules).

:::tip

Make sure the Operation is scoped with the [permissions](/configuration/users-roles-permissions) necessary to delete
Items.

:::

## Read Data

![Read Data](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/read-data-20220603A.webp)

This Operation reads Item(s) from a Collection and adds them onto the Flow Object. You may select Items by their ID or
run a query to select the Items you wish to update.

- **Permissions** — Set the scope of permissions used for this Operation.
- **Collections** — Select the Collection from which you'd like to read Items.
- **IDs** — Input the ID for Items you wish to read and press enter. Click the ID to remove.
- **Query** — Select the Items with a query. To learn more, see [Filter Rules](/reference/filter-rules).

## Update Data

![Update Data](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/update-data-20220603A.webp)

This Operation updates Item(s) in a Collection. Similar to Read Data, you may select Items by their ID or run a query to
select the Items you wish to update.

- **Permissions** — Set the Role that this Operation will inherit permissions from.
- **Collections** — Select the Collection from which you'd like to read Items.
- **IDs** — Input the ID for Item(s) you wish to read and press enter. Click the ID to remove.
- **Payload** — Update Items in a Collection. To learn more, see [API > Items](reference/items/).
- **Query** — Select Items to update with a query. To learn more, see [Filter Rules](/reference/filter-rules).

## Log to Console

![Log to Console](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/log-to-console-20220603A.webp)

This Operation outputs something to the server-side console as well as the [Log Panel](/configuration/flows/#logs). This
is a key tool for troubleshooting Flow configuration.

- **Message** — Sets a [log message](/configuration/flows/#logs).

## Send Email

![Send Email](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/send-email-20220603A.webp)

This Operation sends an email. Flow Object keys can be used as variables, which means you can use an array of emails
from a previous step in Flows.

- **To** — Set the email addresses. Hit `↵` to save the email. Click an email to remove it.
- **Subject** — Set the subject line.
- **Body** — Use a WYSIWYG editor to create the email body.

:::tip

If you are testing out this Operation locally from `localhost:8080`, be sure to check your spam box, as your email
provider may send it there automatically.

:::

## Send Notification

![Send Notification](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/send-notification-20220603A.webp)

This Operation sends a notification to an app user.

- **Users** — Define a User by their primary key UUID. Use [Flow keys](/configuration/flows/flows/#the-flow-object) to
  set this dynamically.
- **Permissions** — Define the Role that this Operation will inherit permissions from.
- **Title** — Set the notification title.
- **Message** — Set the main body of the notification.

## Webhook / Request URL

![Webhok / Request URL](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/webhook-20220603A.webp)

This Operation makes a request to another URL.

- **Method** — Choose to make a GET, POST, PATCH, DELETE, or other type of request.
- **URL** — Define the URL to send the request to.
- **Headers** — Create a new `header:value` to pass along with the request.
- **Request Body** — Set the request body data, using any string or JSON.

## Sleep

![Sleep](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/sleep-20220603A.webp)

This Operation pauses Operation Execution on the Flow for a given amount of milliseconds, then continues to the next
Operation.

- **Milliseconds** — Define the number of milliseconds the Operation will pause.

## Transform Payload

![Transform Payload](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/transform-payload-20220603A.webp)

Transform Payload simply creates a new key on the Flow Object with nested JSON data to provide a clean space where you
can combine data from multiple Flow keys into a single object. For example, if you need to use the same data multiple
times _(e.g. send it in a web request and also use it to create an Item in a Collection)_, you can combine the data with
Transform Payload once, then access its Operation key repeatedly.

- **JSON** — Define JSON to insert into the Flow Object.

## Trigger Flow

![Trigger Flow](https://cdn.directus.io/docs/v9/configuration/flows/operations/operations-20220603A/trigger-flow-20220603A.webp)

This Operation starts another Flow and passes data to it. It should be used in combination with the
[Another Flow](/configuration/triggers/#another-flow) Trigger.

- **Flow** — Define a Flow by its primary key UUID.
- **Payload** — Define JSON to insert into the Flow Object.
