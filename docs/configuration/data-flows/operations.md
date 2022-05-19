# Operations

> Intro about these Operations.

[[toc]]

## Condition

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Route a flow based on `if` / `else` logic. That means if the condition is met, the flow will move forward with the
success operation. Otherwise, the failure operation will be initiated.

### Options

- **Condition Rules** — Creates conditions with [Filter Rules](/configuration/filter-rules).

## Create Data

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Creates Items in the database.

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

Output something to the server-side console. A key tool for troubleshooting data flow configuration.

### Options

- **Message** — Sets message to log.

### Config Tips/Details

```CLI

Trigger: {{$trigger}}

```

## Send Email

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Sends emails to other humans. Variables can be used so that an array of emails could be fetched from a previous step in
data flows.

### Options

- **To** — Sets the email addresses. Hit `↵` to confirm save the email(s). Click emails to remove them.
- **Subject** — Set subject line.
- **Body** — Provides WYSIWYG editor to create email body.

:::tip Sending emails locally

If you are testing out this Operation from `localhost:8080`, be sure to check your spam box as you email provider may
send it there automatically.

:::

## Send Notification <!-- Still Not working for me -->

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Send a notification to app user(s).

### Options

- **Users** — <!-- The @ does not autofill users.... idk the syntax -->
- **Title** — Sets the notification title.
- **Message** — Sets the main body of the notification.

### Config Tips/Details

## Read Data

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Read Items from the Database and adds them to the Data Flow Object for access by subsequent operations.

### Options

- **Mode** — Provides dropdown menu to read one Item, multiple Items, or Items by query.
- **Permissions** — Defines Role that this data operation will inherit read permissions from.
- **Collections** — Select the Collection to read Items from.
- **IDs** — Input ID for Item(s) you wish to read and press enter.
- **Query** — Read Items from a query made with [Filter Rules](/configuration/filter-rules).

## Webhook / Request URL

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Makes a request to a URL.

### Options

- **Method** — Choose to make a GET or POST request.
- **URL** — Define the URL to send request to.
- **Headers** — Create new `header:value` to pass along with the request.
- **Data** — <!-- Not sure how this works yet. -->

## Sleep

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Pauses for a given amount of milliseconds before executing the next Operation in the Data Flow. This does not affect
other app functions, just the subsequent Operations in the Data Flow.

### Options

- **Milliseconds** — Defines the number of milliseconds to pause.

## Transform Payload

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Alters the Flow's JSON payload. Allows you to insert custom-defined JSON into the Data Flow Object.

### Options

- **JSON** — Defines JSON to insert into the Data Flow Object for this Operation.

## Trigger Flow <!-- Can't get it to work -->

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Starts another flow.

### Options

- **Flow** —
- **Data** —
