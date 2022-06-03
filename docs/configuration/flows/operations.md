# Operations

> Operations are the actions performed after the Flow is triggered. Whether you need to access and create Data within
> Directus, send information off to outside services, create time-oriented flows, set conditional logic or even trigger
> other Flows, these simple but powerful tasks can make it happen.

[[toc]]

## Condition

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Routes to the next flow based on some conditional `if` / `else` logic defined by a Filter query. That means if the query
condition is met, the flow will move forward with the success Operation. Otherwise, the failure Operation will be
initiated.

### Options

- **Condition Rules** — Creates conditions with [Filter Rules](/configuration/filter-rules).

## Create Data

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Creates Items in a Collection.

### Options

- **Collection** — Provides a dropdown to set the Collection to initialize data write.
- **Permissions** — Sets the scope of permissions used for this write operation.
- **Emit Events** — <!-- Not sure what this is -->
- **Payload** — Creates the Item to write into the database using JSON with keys that match the Collection Fields.

:::tip

Make sure the Operation is set with the proper write permissions.

:::

## Log to Console

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Output something to the console. This will appear in both the server side and in-app Sidebar Console Log. This is key
tool to help troubleshoot Flow configuration.

### Options

- **Message** — Input a [log](#configuration/flows/flows/logs) message.

## Send Email

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Sends emails to other humans. Variables can be used so that an array of emails could be fetched from a previous step in
Flows.

### Options

- **To** — Sets email addresses. Hit `↵` to save the email. Click an email to remove it.
- **Subject** — Set subject line.
- **Body** — Provides WYSIWYG editor to create email body.

:::tip Sending emails locally

If you are testing out this Operation from `localhost:8080`, be sure to check your spam box as your email provider may
send it there automatically.

:::

## Send Notification

<!-- Still Not working for me -->

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Send a notification to app user(s).

### Options

- **Users** — <!-- The @ does not autofill users.... idk the syntax -->
- **Title** — Sets the notification title.
- **Message** — Sets the main body of the notification.

## Read Data

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Read Item(s) from the Database and adds them onto the Flow Object.

### Options

- **Mode** — Provides dropdown menu to read one Item, multiple Items, or Items by query.
- **Permissions** — Defines Role that this data operation will inherit read permissions from.
- **Collections** — Select the Collection to read Items from.
- **IDs** — Input ID for Item(s) you wish to read and press enter.
- **Query** — Filter Items with a query. See [Filter Rules](/configuration/filter-rules).

## Webhook / Request URL

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Makes a request to a URL.

### Options

- **Method** — Choose to make a GET or POST request.
- **URL** — Define the URL to send request to.
- **Headers** — Create new `header:value` to pass along with the request.
- **Data** — Defines any data to send off in the webhook.

## Sleep

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Pauses Operation Execution in the Flow for a given amount of milliseconds before moving to the next Operation.

### Options

- **Milliseconds** — Defines the number of milliseconds to pause.

## Transform Payload

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Alters the Flow's JSON payload. Allows you to insert custom-defined JSON into the Flow Object.

### Options

- **JSON** — Defines JSON to insert into the Flow Object for this Operation.

## Trigger Flow

<!-- Can't get it to work -->

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

This Operation starts another Flow. It should be used in combination with the
[Another Flow](/configuration/triggers/#another-flow) Trigger.

### Options

- **Flow** —
- **Data** —
