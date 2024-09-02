---
description: A guide on how to build custom hooks in Directus.
readTime: 7 min read
---

# Custom API Hooks

> Custom API Hooks allow running custom logic when a specified event occurs within your project. There are different
> types of events to choose from. They are developed using JavaScript / Node.js.

## Extension Entrypoint

The entrypoint of your hook is the `index` file inside the `src/` folder of your extension package. It exports a
register function to register one or more event listeners.

Example of an entrypoint:

```js
export default ({ filter, action }) => {
	filter('items.create', () => {
		console.log('Creating Item!');
	});

	action('items.create', () => {
		console.log('Item created!');
	});
};
```

## Events

Your hook can emit on a variety of different events. An event is defined by its type and its name.

There are five event types to choose from:

- [Filter](#filter)
- [Action](#action)
- [Init](#init)
- [Schedule](#schedule)
- [Embed](#embed)

Use filter hooks when you want the hook to run before the event. Use action hooks when you want the hook to run after
the event.

### Filter

Filter hooks act on the event's payload before the event is emitted. They allow you to check, modify, or cancel an
event.

Below is an example of canceling a `create` event by throwing a Directus error.

```js
import { createError } from '@directus/errors';

const InvalidPayloadError = createError('INVALID_PAYLOAD_ERROR', 'Something went wrong...', 500);

export default ({ filter }) => {
	filter('items.create', async (input) => {
		if (LOGIC_TO_CANCEL_EVENT) {
			throw new InvalidPayloadError();
		}

		return input;
	});
};
```

The filter register function receives two parameters:

- The event name
- A callback function that is executed whenever the event is emitted.

The callback function itself receives three parameters:

- The modifiable payload
- An event-specific meta object
- A context object

The context object has the following properties:

- `database` — The current database transaction
- `schema` — The current API schema in use
- `accountability` — Information about the current user

::: warning Performance

Filters can impact performance when not carefully implemented, as they are executed in a blocking manner. This applies
in particular to filters firing on `read` events, where a single request can result in a large amount of database reads.

:::

### Action

Action hooks execute after a defined event and receive data related to the event. Use action hooks when you need to
automate responses to CRUD events on items or server actions.

The action register function receives two parameters:

- The event name
- A callback function that is executed whenever the event is emitted.

The callback function itself receives two parameters:

- An event-specific meta object
- A context object

The context object has the following properties:

- `database` — The current database transaction
- `schema` — The current API schema in use
- `accountability` — Information about the current user

### Init

Init hooks execute at a defined point within the life cycle of Directus. Use init hook objects to inject logic into
internal services.

The init register function receives two parameters:

- The event name
- A callback function that is executed whenever the event is emitted.

The callback function itself receives one parameter:

- An event-specific meta object

### Schedule

Schedule hooks execute at certain points in time rather than when Directus performs a specific action. This is supported
through [`node-schedule`](https://www.npmjs.com/package/node-schedule).

To set up a scheduled event, provide a cron statement as the first parameter to the `schedule()` function. For example
`schedule('15 14 1 * *', <...>)` (at 14:15 on day-of-month 1) or `schedule('5 4 * * sun', <...>)` (at 04:05 on Sunday).

Below is an example of registering a schedule hook.

```js
import axios from 'axios';

export default ({ schedule }) => {
	schedule('*/15 * * * *', async () => {
		await axios.post('http://example.com/webhook', { message: 'Another 15 minutes passed...' });
	});
};
```

### Embed

Inject custom JavaScript or CSS into the `<head>` and `<body>` tags within the Data Studio.

The embed register function receives two parameters:

- The position to embed, either `head` or `body`.
- The value to embed, either a string or a function that returns a string.

Below is an example of registering embed hooks.

```js
export default ({ embed }, { env }) => {
	// Google Tag Manager Example
	embed(
		'head',
		() => `<!-- Google Tag Manager -->
		<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${env.GTM_ID}');</script>
		<!-- End Google Tag Manager -->`
	);

	// Sentry Example
	embed(
		'head',
		'<script src="https://browser.sentry-cdn.com/7.21.1/bundle.min.js" integrity="sha384-xOL2QebDu7YNMtC6jW2i5RpQ5RcWOyQMTwrWBiEDezpjjXM7mXhYGz3vze77V91Q" crossorigin="anonymous"></script>'
	);

	embed(
		'body',
		() => `<script>
		Sentry.init({
			dsn: "${env.SENTRY_DSN}" // "https://examplePublicKey@o0.ingest.sentry.io/0",
			release: "my-project-name@${env.npm_package_version}",
			integrations: [new Sentry.BrowserTracing()],

			// We recommend adjusting this value in production, or using tracesSampler
			// for finer control
			tracesSampleRate: 1.0,
		});
		</script>`
	);
};
```

## Available Events

::: tabs

== Filter Events

| Name                           | Payload                              | Meta                                        |
| ------------------------------ | ------------------------------------ | ------------------------------------------- |
| `websocket.message`            | The message send over the WebSocket  |                                             |
| `request.not_found`            | `false`                              | `request`, `response`                       |
| `request.error`                | The request errors                   | --                                          |
| `database.error`               | The database error                   | `client`                                    |
| `auth.login`                   | The login payload                    | `status`, `user`, `provider`                |
| `auth.jwt`                     | The auth token                       | `status`, `user`, `provider`, `type`        |
| `auth.create`<sup>[1]</sup>    | The created user                     | `identifier`, `provider`, `providerPayload` |
| `auth.update`<sup>[2]</sup>    | The updated auth token<sup>[3]</sup> | `identifier`, `provider`, `providerPayload` |
| `authenticate`                 | The empty accountability object      | `req`                                       |
| `email.send`                   | The email payload                    | --                                          |
| `(<collection>.)items.query`   | The items query                      | `collection`                                |
| `(<collection>.)items.read`    | The read item                        | `query`, `collection`                       |
| `(<collection>.)items.create`  | The new item                         | `collection`                                |
| `(<collection>.)items.update`  | The updated item                     | `keys`, `collection`                        |
| `(<collection>.)items.promote` | The promoted item                    | `collection`, `item`, `version`             |
| `(<collection>.)items.delete`  | The keys of the item                 | `collection`                                |
| `<system-collection>.query`    | The items query                      | `collection`                                |
| `<system-collection>.read`     | The read item                        | `query`, `collection`                       |
| `<system-collection>.create`   | The new item                         | `collection`                                |
| `<system-collection>.update`   | The updated item                     | `keys`, `collection`                        |
| `<system-collection>.delete`   | The keys of the item                 | `collection`                                |

<sup>[1]</sup> Available for `ldap`, `oauth2`, `openid` and `saml` driver.

<sup>[2]</sup> Available for `ldap`, `oauth2` and `openid` driver.

<sup>[3]</sup> Available for `oauth2` and `openid` driver, only if set by provider.

== Action Events

| Name                           | Meta                                                |
| ------------------------------ | --------------------------------------------------- |
| `websocket.message`            | `message`, `client`                                 |
| `websocket.error`              | `client`, `event`                                   |
| `websocket.close`              | `client`, `event`                                   |
| `websocket.connect`            | `client`                                            |
| `websocket.auth.success`       | `client`                                            |
| `websocket.auth.failure`       | `client`                                            |
| `server.start`                 | `server`                                            |
| `server.stop`                  | `server`                                            |
| `response`                     | `request`, `response`, `ip`, `duration`, `finished` |
| `auth.login`                   | `payload`, `status`, `user`, `provider`             |
| `files.upload`                 | `payload`, `key`, `collection`                      |
| `(<collection>.)items.read`    | `payload`, `query`, `collection`                    |
| `(<collection>.)items.create`  | `payload`, `key`, `collection`                      |
| `(<collection>.)items.update`  | `payload`, `keys`, `collection`                     |
| `(<collection>.)items.promote` | `payload`, `collection`, `item`, `version`          |
| `(<collection>.)items.delete`  | `keys`, `collection`                                |
| `(<collection>.)items.sort`    | `collection`, `item`, `to`                          |
| `<system-collection>.read`     | `payload`, `query`, `collection`                    |
| `<system-collection>.create`   | `payload`, `key`, `collection`                      |
| `<system-collection>.update`   | `payload`, `keys`, `collection`                     |
| `<system-collection>.delete`   | `keys`, `collection`                                |

== Init Events

| Name                   | Meta      |
| ---------------------- | --------- |
| `cli.before`           | `program` |
| `cli.after`            | `program` |
| `app.before`           | `app`     |
| `app.after`            | `app`     |
| `routes.before`        | `app`     |
| `routes.after`         | `app`     |
| `routes.custom.before` | `app`     |
| `routes.custom.after`  | `app`     |
| `middlewares.before`   | `app`     |
| `middlewares.after`    | `app`     |

:::

::: tip System Collections

---

`<system-collection>` should be replaced with one of the
[system collection](/app/data-model/collections#system-collections) names.

---

Directus reads system collection data to perform correctly, both in the Data Studio and the generated APIs. Be careful
when modifying the output of system collection read/query events, as this can cause Directus core functionality to
break.

---

**Event Exceptions**

| Collection    | Detail                                                                   |
| ------------- | ------------------------------------------------------------------------ |
| `collections` | No `read` action event                                                   |
| `fields`      | No `read` action event                                                   |
| `files`       | `create` and `update` events need to be emitted manually on file upload. |
| `relations`   | No `delete` event                                                        |

:::

## Register Function

The register function receives an object containing the type-specific register functions as the first parameter:

- `filter` — Listen for a filter event
- `action` — Listen for an action event
- `init` — Listen for an init event
- `schedule` — Execute a function at certain points in time
- `embed` — Inject custom JavaScript or CSS within the Data Studio

The second parameter is a context object with the following properties:

- `services` — All API internal services
- `database` — Knex instance that is connected to the current database
- `getSchema` — Async function that reads the full available schema for use in services
- `env` — Parsed environment variables
- `logger` — [Pino](https://github.com/pinojs/pino) instance.
- `emitter` — [Event emitter](https://github.com/directus/directus/blob/main/api/src/emitter.ts) instance that can be
  used to emit custom events for other extensions.

::: warning Event loop

When implementing custom events using the emitter make sure you never directly or indirectly emit the same event your
hook is currently handling as that would result in an infinite loop!

:::

## Guides

Learn how to build hooks with our official guides:

<GuidesListExtensions type="Hooks" />

<script setup>
import GuidesListExtensions from '@/components/guides/GuidesListExtensions.vue';
</script>
