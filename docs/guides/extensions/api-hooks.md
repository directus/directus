# Creating a Custom API Hook

> Hooks allow running custom logic when specificed events occur within your project.

## 1. Create a Hook File

Custom hooks are dynamically loaded from within your extensions folder. By default this directory is located at `/extensions`, but it can be configured within your project's env file to be located anywhere. Hooks can be added [standalone](#) or via an [extension bundle](#).

### Default Standalone Hook Location
```
/extensions/hooks/<hook-id>/index.js
```

### Default Bundled Hook Location
```
/extensions/bundles/<bundle-id>/hooks/<hook-id>/index.js
```

## 2. Define the Event

Next, you will want to define your event. You can trigger your custom hook with any of the platform's many API events. System events are referenced with the format:

```
<scope>.<action>(.<before>)
// eg: files.create
// eg: server.start
// eg: collections.*
// eg: users.update.before
```

While hooks for _items_ also require the collection to be defined:

```
<scope>.<action>.<collection>(.<before>)
// eg: items.create.articles
// eg: items.update.customers
// eg: items.update.*
// eg: items.create.invoices.before
```

### Scope

The scope determines the API endpoint that is triggered. The `*` wildcard can also be used to include all scopes.

::: System Scope
Currently all system tables are available as event scopes except for `directus_migrations` and `directus_sessions`, which don't have relevant endpoints or services.
:::

### Action

Defines the triggering operation within the specified context (see chart below). The `*` wildcard can also be used to include all actions available to the scope.

### Collection

Events in the "Items" scope also require the collection to be defined. The `*` wildcard can also be used to include all collections.

### Before

Many scopes (see chart below) support an optional `.before` suffix for running a _blocking_ hook prior to the event being fired. This allows you to check and/or modify the event's payload before it is processed.

* `items.create.<collection>` (Non Blocking)
* `items.create.<collection>.before` (Blocking)

### Event Format Options

| Scope         | Actions                           | Collection | Before   |
|---------------|-----------------------------------|------------|----------|
| `items`       | `create`, `update` and `delete`    | Required   | Optional |
| `activity`    | `create`, `update` and `delete`    | No         | Optional |
| `collections` | `create`, `update` and `delete`    | No         | Optional |
| `fields`      | `create`, `update` and `delete`    | No         | Optional |
| `files`       | `create`, `update` and `delete`    | No         | Optional |
| `folders`     | `create`, `update` and `delete`    | No         | Optional |
| `permissions` | `create`, `update` and `delete`    | No         | Optional |
| `presets`     | `create`, `update` and `delete`    | No         | Optional |
| `relations`   | `create`, `update` and `delete`    | No         | Optional |
| `revisions`   | `create`, `update` and `delete`    | No         | Optional |
| `roles`       | `create`, `update` and `delete`    | No         | Optional |
| `settings`    | `create`, `update` and `delete`    | No         | Optional |
| `users`       | `create`, `update` and `delete`    | No         | Optional |
| `webhooks`    | `create`, `update` and `delete`    | No         | Optional |
| `server`      | `start` and `error`†                | No        | No       |
| `auth`        | `success`†, `fail`† and `refresh`†    | No      | No       |
| `request`     | `get`†, `patch`† `post`† and `delete`† | No     | No       |

† TBD

## 3. Register your Hook

Each custom hook is registered to its event scope using a function with the following format:

```js
module.exports = function registerHook() {
	return {
		'items.create.articles': function() {
			axios.post('http://example.com/webhook');
		}
	}
}
```

## 4. Develop your Custom Hook

### Register Function

The register function (eg: `module.exports = function registerHook()`) must return an object where the key is the event, and the value is the handler function itself.

The `registerHook` function receives a context parameter with the following properties:

* `services` — All API interal services [Learn More](#)
* `exceptions` — API exception objects that can be used for throwing "proper" errors [Learn More](#)
* `database` — Knex instance that is connected to the current database [Learn More](#)
* `env` — Parsed environment variables [Learn More](#)

### Event Handler Function

The event handler function (eg: `'items.create.articles': function()`) recieves a context parameter with the following properties:

* `event` — Full event string [Learn More](#)
* `accountability` — Information about the current user [Learn More](#)
* `collection` — Collection that is being modified [Learn More](#)
* `item` — Primary key(s) of the item(s) being modified [Learn More](#)
* `action` — Action that is performed [Learn More](#)
* `payload` — Payload of the request [Learn More](#)

## 5. Restart the API

To deploy your hook, simply restart the API by running:

```bash
npx directus start
```

---

## Full Example:

```js
// extensions/hooks/sync-with-external/index.js

module.exports = function registerHook({ services, exceptions }) {
	const { ServiceUnavailableException, ForbiddenException } = exceptions;

	return {
		// Force everything to be admin-only at all times
		'items.*.*': async function({ item, accountability }) {
			if (accountability.admin !== true) throw new ForbiddenException();
		},
		// Sync with external recipes service, cancel creation on failure
		'items.recipes.create.before': async function(input) {
			try {
				await axios.post('https://example.com/recipes', input);
			} catch (error) {
				throw new ServiceUnavailableException(error);
			}

			input[0].syncedWithExample = true;

			return input;
		}
	}
}
```
