# Triggers

[[toc]]

## Event Hook

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

The Flow is triggered from platform or data events. The Event Hook logic is based around the Directus platform's
[Custom API Hooks](/extensions/hooks/).

- **Type** — Choose the type of Event Hook:
  - **Filter (Blocking)** — Fires "blocking" right before the database transaction is committed, allowing you to tweak
    the payload or even outright prevent the completion.
  - **Action (Non-Blocking)** — Does not block anything. Therefore, this is mostly useful for doing things in response
    to an event, without slowing down the API.
- **Scope** — Sets the specific events which trip this Trigger.
- **Collections** — Sets the Collections which trip this Trigger.
- **Response Body** — Sets the Flow Object Key to use in response body for Filter Hooks.

## Webhook

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Triggered by on an incoming HTTP request to:\
`DIRECTUS-PROJECT-URL/flows/trigger/:this-webhook-trigger-id`.

- **Method** — Choose GET or POST from the dropdown.
- **Asynchronous** — Toggle whether or not the Trigger responds asynchronously.
- **Response Body** — Selects data to return in the webhook response.

## Schedule

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

This Trigger allows you to create Data at scheduled intervals, set with a 6-point cron job syntax.

- **Interval** — Sets the cron interval to schedule Trigger with.

## Another Flow

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

This Trigger is triggered by a [Trigger Flow](/configuration/flows/operations/#another-flow) Operation in another flow,
for chaining.

- **Response Body** — Selects data to return in the response to Trigger Flow.

## Manual

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Triggers on manual click of a button. Based on your configuration, a **Flows** menu will appear in the Sidebar of the
Collection Page and/or Item Page. This will contain a button which starts the Flow when clicked.

- **Collections** — Choose the Collection(s) to add in this Button on to.
- **Location** — Choose to add the button into the Item Page, Collection Page, or both.
- **Asynchronous** — Toggle whether or not the Flow executes asynchronously.
