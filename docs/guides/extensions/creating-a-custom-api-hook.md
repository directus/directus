# Creating a Custom API Hook

Custom hooks are dynamically loaded from your configured extensions folder.

Custom hooks are registered using a registration function:

```js
// extensions/hooks/my-hook/index.js

module.exports = function registerHook() {
	return {
		'item.create.articles': function() {
			axios.post('http://example.com/webhook');
		}
	}
}
```

Register function return an object with key = event, value = handler function.

The `registerHook` function receives one parameter: `context`. `context` holds the following properties:

* `services` — All API interal services
* `exceptions` — API exception objects that can be used to throw "proper" errors
* `database` — Knex instance that's connected to the current DB
* `env` — Parsed environment variables

Each handler function gets a `context` parameter with the following properties:

* `event` — Full event string
* `accountability` — Information about the current user
* `collection` — Collection that's being modified
* `item` — Primary key(s) of the item(s) that's being modified
* `action` — Action that's performed
* `payload` — Payload of the request

Events that are prefixed with `.before` run before the event is completed, and are blocking. These allow you to check / modify the payload before it's processed.

---

## Full example:

```js
// extensions/hooks/sync-with-external/index.js

module.exports = function registerHook({ services, exceptions }) {
	const { ServiceUnavailableException, ForbiddenException } = exceptions;

	return {
		// Force everything to be admin only at all times
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
