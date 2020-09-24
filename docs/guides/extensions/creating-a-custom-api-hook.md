# Creating a Custom API Hook

> Hooks allow running custom logic when specificed events occur within your project.

## 1. Create a Hook File

Custom hooks are dynamically loaded from within your extensions folder. By default this directory is located at `/extensions`, but it can be configured within your project's env file to be located anywhere. Hooks can be added [standalone](#) or via an [extension bundle](#).

### Default Standalone Hook Location
```
/extensions/hooks/<hook-id>.js
```

### Default Bundled Hook Location
```
/extensions/bundles/<bundle-id>/hooks/<hook-id>.js
```

## 2. Define the Event's Scope

Next, you will want to define your event scope. You can trigger your custom hook with any of the platform's many API events. Each event is referenced with the following format:

```
<context>.<action>.<collection>.<before>
// eg: items.update.articles.before
```

### Context

The context determines the API endpoint that is triggered.

### Actions

Defines the triggering operation within the specified context. The `*` wildcard can also be used to include all actions available to the context.

### Collection

The `items`, `activity`, `fields`, and `presets` contexts also accept being scoped to one or more specific tables. The `*` wildcard can also be used to include all project collections.

### Before

Most contexts (all except `server` and `auth`) support an optional `.before` suffix for running a _blocking_ hook prior to the event being fired.

:::tip Blocking Hook Filters
The `.before` flag allows you to check and/or modify the event's payload before it is processed.

* `items.create.<collection>` (Non Blocking)
* `items.create.<collection>.before` (Blocking)
:::

### Event Scope Options

| Context       | Actions                        | Collection | Before   |
|---------------|--------------------------------|-------------------|----------|
| `items`       | `create`, `update` and `delete` | Required   | Optional |
| `activity`    | `create`, `update` and `delete` | Optional   | Optional |
| `collections` | `create`, `update` and `delete` | No         | Optional |
| `fields`      | `create`, `update` and `delete` | Optional   | Optional |
| `files`       | `create`, `update` and `delete` | No         | Optional |
| `folders`     | `create`, `update` and `delete` | No         | Optional |
| `permissions` | `create`, `update` and `delete` | No         | Optional |
| `presets`     | `create`, `update` and `delete` | Optional   | Optional |
| `relations`   | `create`, `update` and `delete` | No         | Optional |
| `revisions`   | `create`, `update` and `delete` | No         | Optional |
| `roles`       | `create`, `update` and `delete` | No         | Optional |
| `settings`    | `create`, `update` and `delete` | No         | Optional |
| `users`       | `create`, `update` and `delete` | No         | Optional |
| `webhooks`    | `create`, `update` and `delete` | No         | Optional |
| `server`      | `start` and `error`             | No         | No       |
| `auth`        | `success`, `fail` and `refresh` | No         | No       |

## 3. Register your Hook

Each custom hook is registered to its event scope using a function with the following format:

```js
module.exports = function registerHook() {
	return {
		'item.create.articles': function() {
			axios.post('http://example.com/webhook');
		}
	}
}
```

Register functions return an object with key = event, value = handler function.

The `registerHook` function receives the `context` parameter, which holds the following properties:

* `services` — All API interal services
* `exceptions` — API exception objects that can be used for throwing "proper" errors
* `database` — Knex instance that is connected to the current database
* `env` — Parsed environment variables

Each handler function gets a `context` parameter with the following properties:

* `event` — Full event string
* `accountability` — Information about the current user
    * `admin` — TK
* `collection` — Collection that is being modified
* `item` — Primary key(s) of the item(s) being modified
* `action` — Action that is performed
* `payload` — Payload of the request

---

## Full example:

```js
// extensions/hooks/sync-with-external/index.js

module.exports = function registerHook({ services, exceptions }) {
	const { ServiceUnavailableException, ForbiddenException } = exceptions;

	return {
		// Force everything to be admin-only at all times
		'item.*.*': async function({ item, accountability }) {
			if (accountability.admin !== true) throw new ForbiddenException();
		},
		// Sync with external recipes service, cancel creation on failure
		'item.recipes.create.before': async function(input) {
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
