# Custom API Endpoints <small></small>

> Custom API Endpoints register new API routes which can be used to infinitely extend the core functionality of the
> platform.

## 1. Setup the Boilerplate

Custom endpoints are dynamically loaded from within your project's `/extensions/endpoints` folder. Keep in mind that the
extensions directory is configurable within your env file, and may be located elsewhere.

Each endpoint is registered using a registration function within a scoped directory. For example, to create a custom
`/custom/my-endpoint/` endpoint, you would add the following function to `/extensions/endpoints/my-endpoint/index.js`.

```js
module.exports = function registerEndpoint(router) {
	router.get('/', (req, res) => res.send('Hello, World!'));
};
```

You can also create several scoped endpoints within a single function:

```js
// /custom/my-endpoint/
// /custom/my-endpoint/intro
// /custom/my-endpoint/goodbye
module.exports = function registerEndpoint(router) {
	router.get('/', (req, res) => res.send('Hello, World!'));
	router.get('/intro', (req, res) => res.send('Nice to meet you.'));
	router.get('/goodbye', (req, res) => res.send('Goodbye!'));
};
```

## 2. Develop your Custom Endpoint

The `registerEndpoint` function receives two parameters: `router` and `context`. Router is an express Router instance
that is scoped to `/custom/<extension-name>`, while `context` holds the following properties:

- `services` — All API internal services.
- `exceptions` — API exception objects that can be used to throw "proper" errors.
- `database` — Knex instance that is connected to the current database.
- `env` — Parsed environment variables.

## 3. Restart the API

To deploy your endpoint, simply restart the API by running:

```bash
npx directus start
```

## Full Example:

```js
// extensions/endpoints/recipes/index.js

module.exports = function registerEndpoint(router, { services, exceptions }) {
	const { ItemsService } = services;
	const { ServiceUnavailableException } = exceptions;

	router.get('/', (req, res, next) => {
		const recipeService = new ItemsService('recipes', { schema: req.schema, accountability: req.accountability });

		recipeService
			.readByQuery({ sort: 'name', fields: ['*'] })
			.then((results) => res.json(results))
			.catch((error) => {
				return next(new ServiceUnavailableException(error.message));
			});
	});
};
```
