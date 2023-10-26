---
description: Learn how to use Directus permissions in custom endpoints.
contributors: Tim Butterfield, Kevin Lewis
---

# Use Custom Endpoints to Create a Permissions-Based API Proxy

Endpoints are used in the API to perform certain functions. In this guide, you will use internal Directus permissions
when creating a custom endpoint.

As an example, this guide will proxy the Stripe API, but the same approach can be used for any API.

## Install Dependencies

Open a console to your preferred working directory and initialize a new extension, which will create the boilerplate
code for your operation.

```shell
npx create-directus-extension@latest
```

A list of options will appear (choose endpoint), and type a name for your extension (for example,
`directus-endpoint-stripe`). For this guide, select JavaScript.

Now the boilerplate has been created, install the `stripe` package, and then open the directory in your code editor.

```shell
cd directus-endpoint-stripe
npm install stripe
```

You will also need a Stripe account and API token, and a collection in your Directus project with restricted permissions
and a role which has read and create permissions.

## Build the Endpoint

In the `src` directory open `index.js`. By default, the endpoint root will be the name of the extensions folder which
would be `/directus-endpoint-stripe/`. To change this, replace the code with the following:

```js
import Stripe from 'stripe';

export default {
	id: 'stripe',
	handler: (router) => {
		// Router config goes here
	},
};
```

The `id` becomes the root and must be a unique identifier between all other endpoints.

The Stripe library requires your account's secret key and is best placed in the environment file. To access these
variables, add the `env` context to the handler like so:

```js
handler: (router, { env }) => {
```

Being sensitive information, it’s best practice to control who can access your Stripe account especially if you have
public enrollment in your Directus project. To utilize the existing role system in Directus, add the services context as
well:

```js
handler: (router, { env }) => { // [!code --]
handler: (router, { env, services }) => { // [!code ++]
```

Initialize the `stripe` library and grab the Directus `PermissionsService`:

```js
const secretKey = env.STRIPE_LIVE_SECRET_KEY;
const stripe = new Stripe(secretKey);

const { PermissionsService } = services;
```

Create a route to fetch payments from Stripe, and create a new `PermissionsService`:

```js
router.get('/payments', (req, res) => {
	const permission = new PermissionsService({
		accountability: req.accountability,
		schema: req.schema,
	});
});
```

Now you can check the user’s permission level using the `permission.getAllowedFields()` function which returns false
when users don’t have permission or a list of fields if they do. In most cases this can be used in a simple if
statement.

Bring these together with the Stripe `paymentIntents` function and you can return a list of payments. For those without
permission, respond with the 401 (unauthorized) code.

```js
router.get('/payments', (req, res) => {
	const permission = new PermissionsService({
		accountability: req.accountability,
		schema: req.schema,
	});

	let output = []; // [!code ++]

	if (permission.getAllowedFields('read', env.STRIPE_CUSTOMERS_COLLECTION)) { // [!code ++]
		stripe.paymentIntents // [!code ++]
			.list({ limit: 100 }) // [!code ++]
			.autoPagingEach((payments) => { // [!code ++]
				output.push(payments); // [!code ++]
			}) // [!code ++]
			.then(() => { // [!code ++]
				res.json(output); // [!code ++]
			}); // [!code ++]
	} else { // [!code ++]
		res.sendStatus(401); // [!code ++]
	} // [!code ++]
});
```

Note the use of Stripe’s `autoPagingEach` to help with pagination. This returns each payment individually despite
fetching 100 at a time. Use the `output` variable to save each result and then return the variable to as the endpoint
response.

You can use this pattern for any endpoint offered by the Stripe Node.js library. To get a list of customers:

```js{8}
router.get('/customers', (req, res) => {
	const permission = new PermissionsService({
		accountability: req.accountability,
		schema: req.schema,
	});

	let output = [];
	if(permission.getAllowedFields('read', env.STRIPE_CUSTOMERS_COLLECTION)){
		stripe.customers.list({limit: 100}).autoPagingEach((customer) => {
			output.push(customer);
		}).then(() => {
			res.json(output);
		});
	} else {
		res.sendStatus(401);
	}
});
```

To fetch payments for a single customer, use a parameter in the endpoint. The structure is very similar except for the
parameter in the path (`/:customer_id`) and the additional parameter in the Stripe query:

```js{1,9}
router.get('/payments/:customer_id', (req, res) => {
	const permission = new PermissionsService({
		accountability: req.accountability,
		schema: req.schema,
	});

	let output = [];
	if(permission.getAllowedFields('read', env.STRIPE_CUSTOMERS_COLLECTION)){
		stripe.paymentIntents.list({
			customer: req.params.customer_id,
			limit: 100
		}).autoPagingEach(function(payments) {
			output.push(payments);
		}).then(() => {
			res.json(output);
		});
	} else {
		res.sendStatus(401);
	}
});
```

To create a customer, information to be sent to this endpoint then passed onto Stripe. When dealing with inputs, it’s
important to validate the structure to ensure the required information is sent to Stripe. Create a POST route and use
the permission service to check for 'create' permissions:

```js
router.post('/customers', (req, res) => {
	const permission = new PermissionsService({
		accountability: req.accountability,
		schema: req.schema,
	});

	if (permission.getAllowedFields('create', env.STRIPE_CUSTOMERS_COLLECTION)) {
		if (req.body.email) {
			const customer = {
				email: req.body.email,
			};

			if (req.body.name) {
				customer.name = req.body.name;
			}

			stripe.customers.create(customer).then((response) => {
				res.json(response);
			});
		} else {
			res.sendStatus(400); // Bad Request
		}
	} else {
		res.sendStatus(401);
	}
});
```

The response will be a customer object in Stripe which can be used to write the customer ID back to the collection.

This is now complete and ready for testing. Build the endpoint with the latest changes.

```
npm run build
```

## Add Endpoint to Directus

When Directus starts, it will look in the `extensions` directory for any subdirectory starting with
`directus-extension-`, and attempt to load them.

To install an extension, copy the entire directory with all source code, the `package.json` file, and the `dist`
directory into the Directus `extensions` directory. Make sure the directory with your extension has a name that starts
with `directus-extension`. In this case, you may choose to use `directus-extension-endpoint-stripe`.

For the permissions to work, add the collection from Directus where the permissions are assigned with the variable
`STRIPE_CUSTOMERS_COLLECTION` - ensure the `.env` file has `STRIPE_LIVE_SECRET_KEY` and `STRIPE_CUSTOMERS_COLLECTION`
variables.

Restart Directus to load the extension.

:::info Required files

Only the `package.json` and `dist` directory are required inside of your extension directory. However, adding the source
code has no negative effect.

:::

## Use the Endpoint

Using an application such as Postman, create a new request. The URL will be: `https://example.directus.app/stripe/` (be
sure that you change the URL for your project's URL)

- To view all payments: https://example.directus.app/stripe/payments
- To view all payments for a customer: https://example.directus.app/stripe/payments/CUS_XXX
- To create a customer: POST to https://example.directus.app/stripe/customer with the following payload:

```json
{
	"email": "your-email@example.com",
	"name": "Joe Bloggs"
}
```

## Summary

With this endpoint, you can now query payments and create customers through the Stripe API within Directus using the
built-in credentials of the current user. Now that you know how to create your own routes for an endpoint and protect
them with the Permissions Service, you can discover more endpoints in Stripe and add them to your own.

## Complete Code

`index.js`

```js
import Stripe from 'stripe';

export default {
	id: 'stripe',
	handler: (router, { env, services }) => {
		const secretKey = env.STRIPE_LIVE_SECRET_KEY;
		const stripe = new Stripe(secretKey);

		const { PermissionsService } = services;

		router.get('/payments', (req, res) => {
			const permission = new PermissionsService({
				accountability: req.accountability,
				schema: req.schema,
			});

			let output = [];

			if (permission.getAllowedFields('read', env.STRIPE_CUSTOMERS_COLLECTION)) {
				stripe.paymentIntents
					.list({ limit: 100 })
					.autoPagingEach((payments) => {
						output.push(payments);
					})
					.then(() => {
						res.json(output);
					});
			} else {
				res.sendStatus(401);
			}
		});

		router.get('/payments/:customer_id', (req, res) => {
			const permission = new PermissionsService({
				accountability: req.accountability,
				schema: req.schema,
			});

			let output = [];

			if (permission.getAllowedFields('read', env.STRIPE_CUSTOMERS_COLLECTION)) {
				stripe.paymentIntents
					.list({
						customer: req.params.customer_id,
						limit: 100,
					})
					.autoPagingEach((payments) => {
						output.push(payments);
					})
					.then(() => {
						res.json(output);
					});
			} else {
				res.sendStatus(401);
			}
		});

		router.get('/customers', (req, res) => {
			const permission = new PermissionsService({
				accountability: req.accountability,
				schema: req.schema,
			});

			let output = [];

			if (permission.getAllowedFields('read', env.STRIPE_CUSTOMERS_COLLECTION)) {
				stripe.customers
					.list({ limit: 100 })
					.autoPagingEach((customer) => {
						output.push(customer);
					})
					.then(() => {
						res.json(output);
					});
			} else {
				res.sendStatus(401);
			}
		});

		router.post('/customers', (req, res) => {
			const permission = new PermissionsService({
				accountability: req.accountability,
				schema: req.schema,
			});

			if (permission.getAllowedFields('create', env.STRIPE_CUSTOMERS_COLLECTION)) {
				if (req.body.email) {
					const customer = {
						email: req.body.email,
					};

					if (req.body.name) {
						customer.name = req.body.name;
					}

					stripe.customers.create(customer).then((response) => {
						res.json(response);
					});
				} else {
					res.sendStatus(400); // Bad Request
				}
			} else {
				res.sendStatus(401);
			}
		});
	},
};
```
