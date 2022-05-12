# Triggers

## Event Filter <!-- Can't make sense of this one. Seems like it should be used with both read and validate operations? -->

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Triggers before an event is fired to check, modify, or cancel the event.

### Config Options

- **Event** — Defines the event.

### Config Tips/Details

## Event Action

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Triggers after an event is fired, to automate responses to the event.

## Config Options

- **Event** — Defines the event.

### Config Tips/Details

## Event Init <!-- Can't get it to work. Don't fully understand the internal events app.before, routes.after, etc... -->

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

- Description: Triggered by broader internal services where custom logic can be injected.

### Config Options

- **Event** — Provides dropdown to select an internal event.

### Config Tips/Details

## Operation <!-- Can't make it work -->

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

- Description: Triggered by an operation in a different flow, to chain or reuse flows.

### Config Options

- _No options available._

### Config Tips/Details

## Schedule

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

- Description: Triggers at certain points of time.

### Config Options

- Interval — Sets an interval to schedule event with 6-point cron job syntax.

### Config Tips/Details

<!--Elaborate on the 6 points and link to wikipedia or sthg.-->

## Webhook <!-- Halfway works! Not sure what response body does.... Can't see it in network. -->

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Triggers based on an incoming HTTP request. The request should take the form `/flows/trigger/:this-webhook-trigger-id'

### Config Options

- Method — Choose GET or POST from the dropdown.
- Response Body — <!-- Not sure what this is for. -->

### Config Tips/Details

## Manual

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

- Description: Triggers on manual click of a button.

### Config Options

-

### Config Tips/Details

- _No options available._
