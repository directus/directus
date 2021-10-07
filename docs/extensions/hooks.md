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

Next, you will want to define your event. You can trigger your custom hook with any of the platform's many API events.
An event is defined by its type and its name.

Event names consist of multiple scopes delimited by a dot:

```
<scope>.<scope>...
// eg: items.create
// eg: users.update
// eg: auth.login
// eg: routes.custom.before
```

There are four event types to choose from.

### Filter

A filter event executes prior to the event being fired. This allows you to check and/or modify the event's payload
before it is processed.

It also allows you to cancel an event based on the logic within the hook. The following example shows how you can cancel
an event by throwing a standard Directus exception:

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

The first parameter of the filter register function is the event name. The second parameter is the modifiable payload.
The third argument is an event-specific meta object. The fourth argument is a context object with the following
properties:

- `database` — The current database transaction
- `schema` — The current API schema in use
- `accountability` — Information about the current user

#### Available Events

| Name                          | Payload              | Meta                                 |
| ----------------------------- | -------------------- | ------------------------------------ |
| `request.not_found`           | `false`              | `request`, `response`                |
| `request.error`               | The request errors   | --                                   |
| `database.error`              | The database error   | `client`                             |
| `auth.login`                  | The login payload    | `status`, `user`, `provider`         |
| `auth.jwt`                    | The auth token       | `status`, `user`, `provider`, `type` |
| `(<collection>.)items.read`   | The read item        | `collection`                         |
| `(<collection>.)items.create` | The new item         | `collection`                         |
| `(<collection>.)items.update` | The updated item     | `keys`, `collection`                 |
| `(<collection>.)items.delete` | The keys of the item | `collection`                         |
| `<system-collection>.create`  | The new item         | `collection`                         |
| `<system-collection>.update`  | The updated item     | `keys`, `collection`                 |
| `<system-collection>.delete`  | The keys of the item | `collection`                         |

::: tip System Collections

`<system-collection>` should be replaced with one of the system collection names `activity`, `collections`, `fields`,
`folders`, `permissions`, `presets`, `relations`, `revisions`, `roles`, `settings`, `users` or `webhooks`.

:::

::: warning Performance

Filters can impact performance when not carefully implemented, as they are executed in a blocking manner.

:::

### Action

An action event executes after a certain event and receives some data related to the event.

The first parameter of the action register function is the event name. The second argument is an event-specific meta
object. The third argument is a context object with the following properties:

- `database` — The current database transaction
- `schema` — The current API schema in use
- `accountability` — Information about the current user

#### Available Events

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
| `(<collection>.)items.delete` | `payload`, `collection`                             |
| `<system-collection>.create`  | `payload`, `key`, `collection`                      |
| `<system-collection>.update`  | `payload`, `keys`, `collection`                     |
| `<system-collection>.delete`  | `payload`, `collection`                             |

::: tip System Collections

`<system-collection>` should be replaced with one of the system collection names `activity`, `collections`, `fields`,
`folders`, `permissions`, `presets`, `relations`, `revisions`, `roles`, `settings`, `users` or `webhooks`.

:::

::: warning Performance

`read` actions can impact performance when not carefully implemented, as a single request can result in a large amount
of database reads.

:::

### Init

An init event executes at a certain point within the lifecycle of Directus. Init events can be used to inject logic into
internal services.

The first parameter of the init register function is the event name. The second parameter is an event-specific meta
object.

#### Available Events

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

### Schedule

A schedule event executes at certain points in time. This is supported through
[`node-cron`](https://www.npmjs.com/package/node-cron). To set this up, provide a cron statement as the first argument
to the `schedule()` function, for example `schedule('15 14 1 * *', <...>)` (at 14:15 on day-of-month 1) or
`schedule('5 4 * * sun', <...>)` (at 04:05 on Sunday). See example below:

```js
const axios = require('axios');

export default ({ schedule }) => {
	schedule('*/15 * * * *', async () => {
		await axios.post('http://example.com/webhook', { message: 'Another 15 minutes passed...' });
	});
};
```

## Register Function

The register function receives an object containing the type-specific register functions as the first parameter:

- `filter` — Listen for a filter event
- `action` — Listen for an action event
- `init` — Listen for an init event
- `schedule` — Execute a function at certain points in time

The second parameter is a context object with the following properties:

- `services` — All API internal services
- `exceptions` — API exception objects that can be used for throwing "proper" errors
- `database` — Knex instance that is connected to the current database
- `getSchema` — Async function that reads the full available schema for use in services
- `env` — Parsed environment variables
- `logger` — [Pino](https://github.com/pinojs/pino) instance.

## Example: Sync with External

```js
const axios = require('axios');

export default ({ filter }, { services, exceptions }) => {
	const { MailService } = services;
	const { ServiceUnavailableException, ForbiddenException } = exceptions;

	// Sync with external recipes service, cancel creation on failure
	filter('items.create', async (input, { collection }, { schema }) => {
		if (collection !== 'recipes') return input;

		const mailService = new MailService({ schema });

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
