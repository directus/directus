# Creating a Custom API Endpoint

Custom endpoints are dynamically loaded from your configured extensions folder.

Custom endpoints are registered using a registration function:

```js
// extensions/endpoints/my-endpoint/index.js

module.exports = function registerEndpoint(router) {
	router.get('/', (req, res) => res.send('Hello, World!'));
}
```

The `registerEndpoint` function receives two parameters: `router` and `context`. Router is an express Router
instance that's scoped to `/custom/<extension-name>`. `context` holds the following properties:

* `services` — All API interal services
* `exceptions` — API exception objects that can be used to throw "proper" errors
* `database` — Knex instance that's connected to the current DB
* `env` — Parsed environment variables

---

## Full example:

```js
// extensions/endpoints/recipes/index.js

module.exports = function registerEndpoint(router, { services, exceptions }) {
	const { ItemsService } = services;
	const { ServiceUnavailableException } = exceptions;

	const recipeService = new ItemsService('recipes');

	router.get('/', (req, res) => {
		recipeService
			.readByQuery({ sort: 'name', fields: '*' })
			.then(results => res.json(results))
			.catch(error => { throw new ServiceUnavailableException(error.message) });
	});
}
```
