---
description: A guide on how to build custom hooks in Directus.
readTime: 7 min read
---

# Custom API Hooks <small></small>

> Custom API Hooks allow running custom logic when a specified event occurs within your project. There are different
> types of events to choose from.

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

Your hook can trigger on a variety of different events. An event is defined by its type and its name.

There are five event types to choose from:

- [Filter](#filter)
- [Action](#action)
- [Init](#init)
- [Schedule](#schedule)
- [Embed](#embed)

Use filter hooks when you want the hook to fire before the event. Use action hooks when you want the hook to fire after
the event.

### Filter

Filter hooks act on the event's payload before the event is fired. They allow you to check, modify, or cancel an event.

Below is an example of canceling a `create` event by throwing a standard Directus exception.

```js
export default ({ filter }, { exceptions }) => {
	const { InvalidPayloadException } = exceptions;

	filter('items.create', async (input) => {
		if (LOGIC_TO_CANCEL_EVENT) {
			throw new InvalidPayloadException(WHAT_IS_WRONG);
		}

		return input;
	});
};
```

The filter register function receives two parameters:

- The event name
- A callback function that is executed whenever the event fires.

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
- A callback function that is executed whenever the event fires.

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
- A callback function that is executed whenever the event fires.

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

### Filter Events

| Name                          | Payload                              | Meta                                        |
| ----------------------------- | ------------------------------------ | ------------------------------------------- |
| `request.not_found`           | `false`                              | `request`, `response`                       |
| `request.error`               | The request errors                   | --                                          |
| `database.error`              | The database error                   | `client`                                    |
| `auth.login`                  | The login payload                    | `status`, `user`, `provider`                |
| `auth.jwt`                    | The auth token                       | `status`, `user`, `provider`, `type`        |
| `auth.create`<sup>[1]</sup>   | The created user                     | `identifier`, `provider`, `providerPayload` |
| `auth.update`<sup>[2]</sup>   | The updated auth token<sup>[3]</sup> | `identifier`, `provider`, `providerPayload` |
| `authenticate`                | The empty accountability object      | `req`                                       |
| `(<collection>.)items.query`  | The items query                      | `collection`                                |
| `(<collection>.)items.read`   | The read item                        | `query`, `collection`                       |
| `(<collection>.)items.create` | The new item                         | `collection`                                |
| `(<collection>.)items.update` | The updated item                     | `keys`, `collection`                        |
| `(<collection>.)items.delete` | The keys of the item                 | `collection`                                |
| `<system-collection>.create`  | The new item                         | `collection`                                |
| `<system-collection>.update`  | The updated item                     | `keys`, `collection`                        |
| `<system-collection>.delete`  | The keys of the item                 | `collection`                                |

<sup>[1]</sup> Available for `ldap`, `oauth2`, `openid` and `saml` driver.

<sup>[2]</sup> Available for `ldap`, `oauth2` and `openid` driver.

<sup>[3]</sup> Available for `oauth2` and `openid` driver, only if set by provider.

::: tip System Collections

`<system-collection>` should be replaced with one of the system collection names `activity`, `collections`,
`dashboards`, `fields`, `files` (except create/update), `flows`, `folders`, `notifications`, `operations`, `panels`,
`permissions`, `presets`, `relations`, `revisions`, `roles`, `settings`, `shares`, `users` or `webhooks`.

:::

### Action Events

| Name                          | Meta                                                |
| ----------------------------- | --------------------------------------------------- |
| `server.start`                | `server`                                            |
| `server.stop`                 | `server`                                            |
| `response`                    | `request`, `response`, `ip`, `duration`, `finished` |
| `auth.login`                  | `payload`, `status`, `user`, `provider`             |
| `files.upload`                | `payload`, `key`, `collection`                      |
| `(<collection>.)items.read`   | `payload`, `query`, `collection`                    |
| `(<collection>.)items.create` | `payload`, `key`, `collection`                      |
| `(<collection>.)items.update` | `payload`, `keys`, `collection`                     |
| `(<collection>.)items.delete` | `keys`, `collection`                                |
| `(<collection>.)items.sort`   | `collection`, `item`, `to`                          |
| `<system-collection>.create`  | `payload`, `key`, `collection`                      |
| `<system-collection>.update`  | `payload`, `keys`, `collection`                     |
| `<system-collection>.delete`  | `keys`, `collection`                                |

::: tip System Collections

`<system-collection>` should be replaced with one of the system collection names `activity`, `collections`,
`dashboards`, `fields`, `files` (except create/update), `flows`, `folders`, `notifications`, `operations`, `panels`,
`permissions`, `presets`, `relations`, `revisions`, `roles`, `settings`, `shares`, `users` or `webhooks`.

:::

### Init Events

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

## Register Function

The register function receives an object containing the type-specific register functions as the first parameter:

- `filter` — Listen for a filter event
- `action` — Listen for an action event
- `init` — Listen for an init event
- `schedule` — Execute a function at certain points in time
- `embed` — Inject custom JavaScript or CSS within the Data Studio

The second parameter is a context object with the following properties:

- `services` — All API internal services
- `exceptions` — API exception objects that can be used for throwing "proper" errors
- `database` — Knex instance that is connected to the current database
- `getSchema` — Async function that reads the full available schema for use in services
- `env` — Parsed environment variables
- `logger` — [Pino](https://github.com/pinojs/pino) instance.
- `emitter` — [Event emitter](https://github.com/directus/directus/blob/main/api/src/emitter.ts) instance that can be
  used to trigger custom events for other extensions.

::: warning Event loop

When implementing custom events using the emitter make sure you never directly or indirectly emit the same event your
hook is currently handling as that would result in an infinite loop!

:::

## Examples:

### Sync with External

```js
import axios from 'axios';

export default ({ filter }, { services, exceptions }) => {
	const { MailService } = services;
	const { ServiceUnavailableException, ForbiddenException } = exceptions;

	// Sync with external recipes service, cancel creation on failure
	filter('items.create', async (input, { collection }, { schema, database }) => {
		if (collection !== 'recipes') return input;

		const mailService = new MailService({ schema, knex: database });

		try {
			await axios.post('https://example.com/recipes', input);
			await mailService.send({
				to: 'person@example.com',
				template: {
					name: 'item-created',
					data: {
						collection: collection,
					},
				},
			});
		} catch (error) {
			throw new ServiceUnavailableException(error);
		}

		input.syncedWithExample = true;

		return input;
	});
};
```

### Add Sentry monitoring

```js
import { defineHook } from '@directus/extensions-sdk';
import * as Sentry from '@sentry/node';
import '@sentry/tracing';

export default defineHook(({ init }, { env }) => {
	const { SENTRY_DSN } = env;
	Sentry.init({
		dsn: SENTRY_DSN,
	});

	init('routes.before', ({ app }) => {
		app.use(Sentry.Handlers.requestHandler());
		console.log('-- Sentry Request Handler Added --');
	});

	init('routes.custom.after', ({ app }) => {
		app.use(Sentry.Handlers.errorHandler());
		console.log('-- Sentry Error Handler Added --');
	});
});
```
