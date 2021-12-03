# Custom API Hooks <small></small>

> Custom API Hooks allow running custom logic when a specified event occurs within your project. Types of API hooks are
> Actions, Filters, Init, and Schedule.

[[toc]]

## Types of Hooks

- [Action](#action)
- [Filter](#filter)
- [Init](#init)
- [Schedule](#schedule)

Use filter hooks when you want the hook to fire before the event. Use action hooks when you want the hook to fire after
the event.

Hooks can impact performance when not carefully implemented. Filter hooks happen before the event fires, making them
much more susceptible to performance issues. Hooks on `read` actions can also impact performance since a single request
can result in many database reads.

### Action

An action event executes after a defined event and receives data related to the event. Use actions hooks when you need
to automate responses to CRUD events on items or server actions.

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

### Filter

Filter hooks act on the event's payload before the event is fired. They allow you to check, modify, or cancel an event.

Below is an example of canceling a `create` event by throwing a standard Directus exception.

```js
module.exports = function registerHook({ filter }, { exceptions }) {
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

### Init

An init event executes at a defined point within the lifecycle of Directus. Use init event objects to inject logic into
internal services.

The init register function receives two parameters:

- The event name
- A callback function that is executed whenever the event fires.

The callback function itself receives one parameter:

- An event-specific meta object

### Schedule

A schedule event executes at certain points in time rather than when Directus performs a specific action. This is
supported through [`node-cron`](https://www.npmjs.com/package/node-cron). To set up a scheduled event, provide a cron
statement as the first parameter to the `schedule()` function. For example `schedule('15 14 1 * *', <...>)` (at 14:15 on
day-of-month 1) or `schedule('5 4 * * sun', <...>)` (at 04:05 on Sunday). See example below:

```js
const axios = require('axios');

module.exports = function registerHook({ schedule }) {
	schedule('*/15 * * * *', async () => {
		await axios.post('http://example.com/webhook', { message: 'Another 15 minutes passed...' });
	});
};
```

## Available Events

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
| `(<collection>.)items.delete` | `payload`, `collection`                             |
| `<system-collection>.create`  | `payload`, `key`, `collection`                      |
| `<system-collection>.update`  | `payload`, `keys`, `collection`                     |
| `<system-collection>.delete`  | `payload`, `collection`                             |

::: tip System Collections

`<system-collection>` should be replaced with one of the system collection names `activity`, `collections`, `fields`,
`folders`, `permissions`, `presets`, `relations`, `revisions`, `roles`, `settings`, `users` or `webhooks`.

:::

### Filter Events

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

## Creating a Hook

### 1. Create a Hook File

Custom hooks are dynamically loaded from within your extensions folder. By default, this directory is located at
`/extensions`, but it can be configured within your project's env file to be located anywhere. The hook-id is the name
of your hook.

#### Default Standalone Hook Location

```
/extensions/hooks/<hook-id>/index.js
```

### 2. Register your Hook

The `registerHook` function receives an object containing the type-specific register functions as the first parameter:

- `filter` — Listen for a filter event
- `action` — Listen for an action event
- `init` — Listen for an init event
- `schedule` — Execute a function at certain points in time

A second parameter is a context object with the following properties:

- `services` — All API internal services
- `exceptions` — API exception objects that can be used for throwing "proper" errors
- `database` — Knex instance that is connected to the current database
- `getSchema` — Async function that reads the full available schema for use in services
- `env` — Parsed environment variables
- `logger` — [Pino](https://github.com/pinojs/pino) instance.

Each custom hook is registered to its event scope using a function with the following format:

```js
const axios = require('axios');

module.exports = function registerHook({ action }) {
	action('items.create', () => {
		axios.post('http://example.com/webhook');
	});
};
```

### 3. Develop your Custom Hook

Trigger your custom hook with any of the platform's many API events.

Event names consist of multiple scopes delimited by a dot:

```
<scope>.<scope>...
// eg: items.create
// eg: users.update
// eg: auth.login
// eg: routes.custom.before
```

Using the example from step 2, `action()` is the hook type and it receives two arguments. `items.create` is the API
event that should trigger the hook. It also receives a callback function that says what the hook should do when the API
event occurs.

```js
const axios = require('axios');

module.exports = function registerHook({ action }) {
	action('items.create', () => {
		axios.post('http://example.com/webhook');
	});
};
```

### 4. Restart the API

To deploy your hook, restart the API by running:

```bash
npx directus start
```

### Full Example

`extensions/hooks/sync-with-external/index.js`:

```js
const axios = require('axios');

module.exports = function registerHook({ filter }, { services, exceptions }) {
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
