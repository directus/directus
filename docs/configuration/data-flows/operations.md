# Operations

> Intro about these Operations.

[[toc]]

## Log to Console

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Logs a Message to the Console.

### Config Options

- **Message** — Sets message to log.

### Config Tips/Details

```CLI

Trigger: {{$trigger}}

```

## Email <!--Not working for me-->

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Sends emails to other humans.

### Config Options

- **To** — Sets the email addresses.
- **Subject** — Set subject line.
- **Body** — Provides WYSIWYG editor to create email body.
- **Data** — <!-- ???Assuming JSON? What happens to it??? -->

### Config Tips/Details

## Notification

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

- Description: Send a notification to someone.

### Config Options

- **Users** — <!-- The @ does not autofill users.... idk the syntax -->
- **Title** — Sets the notification title.
- **Message** — Sets the main body of the notification.

### Config Tips/Details

<!--Notifications not sending yet... Can we hard code? Dynamic list of emails? SDK? What are the options-->
<!--Can we send notifications to multiple people?-->

## Read <!--Not working for me-->

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

- Description: Read Items from the Database.

### Config Options

- **Mode** — Provides dropdown menu to read one Item, multiple Items, or Items by query.
- **Collection** — Select the Collection to read from.
- **IDs** — <!--Item IDs? syntax? hardcode? SDK?>
- **Query** — <!-- SDK? -->

### Config Tips/Details

<!-- Collection should probably be a dropdown menu, not a form input. -->

## Request

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

- Description: Make a request to a URL.

### Config Options

- **Method** — Choose to make a GET or POST request.
- **URL** — Define the URL to send request to.
- **Headers** — Create new `header:value` to pass along with the request.
- **Data** — <!-- Not sure how this works yet. -->

### Config Tips/Details

## Sleep

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Waits for a given amount of milliseconds before executing the next Operation in the Data Flow.

### Config Options

- **Milliseconds** — Defines the number of milliseconds to pause.

### Config Tips/Details

## Transform

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Inserts JSON into the flow.

### Config Options

- **Method** —

### Config Tips/Details

The JSON field can also support variables.

```JSON
{
    "some_key": {{$trigger}}
}
```

## Trigger <!-- Not working for me. No flow keys available. Tried adding "flow name". Did not mess with the data field.>

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Start another flow.

### Config Options

- **Flow** — <!-- Not sure if supposed to input existing flow name? or....>
- **Data** —

### Config Tips/Details

## Validate <!-- Not working for me. Can't guess exactly what it does either.-->

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Validate an Item with a Filter.

<!-- Which Items>

### Config Options
- **Filter** — <!-- Provides a modified version of the filter utility. -->

- **Item** —

### Config Tips/Details

## Write <!-- Single items works! Did not test writing multiple items.-->

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

- Description: Write Items into the database.

### Config Options

- **Mode** — Defines whether the operation will write in one item or multiple items.
- **Collection** — Provides a dropdown to set the Collection name.
- **Payload** — The Field Values for the Item(s) to write. Create JSON with keys that match the Collection Fields.

### Config Tips/Details
