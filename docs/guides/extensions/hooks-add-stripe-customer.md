---
description: Learn how to use a hook to add Stripe customers when items are created.
contributors: Tim Butterfield, Kevin Lewis
---

# Use Hooks to Create Stripe Customers

Hooks allow you to trigger your own code under certain conditions. This tutorial will show you how to create a Stripe account when an item is created in Directus and write the customer ID back to the record.

## Install Dependencies

Open a console to your preferred working directory, then install the Directus Extensions SDK, which will create the boilerplate code for your display.

```
npm i create-directus-extension
npm init directus-extension
```

A list of options will appear (choose hook), and type a name for your extension (for example, `directus-hook-create-stripe-customer`). For this guide, select JavaScript.

Now the hook has been created, go into the current directory and build the extension. This must be performed whenever your changes are ready to be deployed.

```
cd directus-hook-create-stripe-customer
npm run build
```

Install stripe from npm as a dependency by running the following command:

```
npm install stripe
```

Note, if you intend to create more than one hook using the stripe package, consider adding it to the Directus project dependencies instead to improve performance.

## Build the Hook

Create a collection called Customers with a field called `stripe_id` and the following required fields: `first_name`, `last_name` and `email_address` (unique). This hook will be used to create a new customer in Stripe whenever a new customer is created in Directus.

Open the `index.js` file inside the src directory. Delete all the existing code and proceed.

Create an initial export. This hook will need to intercept the save function with `action` and include `env` for the environment variables and `services` to write back to the record:

```js
export default ({ action }, { env, services }) => {
};
```

Inside the function, define the internal `ItemsService` Directus API function from the `services` scope. Also include the `MailService` to send yourself an email if the Stripe API fails.


```js
export default ({ action }, { env, services }) => {
	const { MailService, ItemService } = services; // [!code ++]
};
```

Next, capture the `items.create` stream using `action` and pull out the `key`, `collection`, and `payload`:

```js
action('items.create', async ({ key, collection, payload }, { schema }) => {
});
```

When using filters and actions, it’s important to remember this will capture __all__ events so you should set some restrictions. Inside the action, exclude anything that’s not in the customers collection.

```js
action('items.create', async ({ key, collection, payload }, { schema }) => {
	if (collection !== 'customers') return; // [!code ++]
});
```

Require and initialize the stripe package:

```js
const stripe = require(stripe)(env.STRIPE_TOKEN);
```

`env` looks inside the Directus environment variables for `STRIPE_TOKEN`. In order to start using this hook, this variable must be added to your `.env` file. This can be found in the developers area on your Stripe dashboard.

Create a new customer with the customer's name and email as the input values.

```js
stripe.customers.create({
	name: `${payload.first_name} ${payload.last_name}`,
	email: payload.email_address,
}).then(customer => {
}).catch(error => {
});
```

If successful, update the record with the new customer id from stripe. The API call returns the customer object into the `customer` variable, be sure to look up what other data is included in this response.

Use the `ItemService` to update the customer record. Initialize the service and perform the API query:

```js
stripe.customers.create({
}).then(customer => {
	const customers = new ItemsService(collection, { schema: schema });  // [!code ++]
	customers.updateByQuery({ filter: { id: key } }, { stripe_id: customer.id }, { emitEvents: false }); // [!code ++]
}).catch(error => {
});
```

By setting `emitEvents` to `false`, the `items.update` event will not trigger, which prevents flows or hooks from running as a result of this item update.

Add an exception if the Stripe API fails.

```js
stripe.customers.create({
}).then(customer => {
}).catch(error => {
	mailService.send({  // [!code ++]
		to: 'sharedmailbox@directus.io',  // [!code ++]
		from: 'noreply@directus.io',  // [!code ++]
		subject: `An error has occurred with Stripe API`,  // [!code ++]
		text: "The following error occurred for "+payload.first_name+" "+payload.last_name+" when attempting to create an account in Stripe.\r\n\r\n"+error+"\r\n\r\nPlease investigate.\r\n\r\nID: "+key+"\r\nEmail: "+payload.email_address,  // [!code ++]
	});  // [!code ++]
});
```

Build the hook with the latest changes.

```
npm run build
```

## Add Hook to Directus

In order to use this hook in Directus, you must first install the dependency into your project. 

1. In the Directus extensions directory, open the hooks directory and make a new directory called `directus-hook-create-stripe-customer`.
2. From the hook’s directory, open the __dist__ folder and copy the `index.js` file into the directory.
3. Restart Directus to load the extension.

## Summary

With Stripe now integrated in this hook, whenever a new customer is created, this hook will create a customer in Stripe and write back the customer ID to Directus. Now that you know how to interact with the Stripe API, you can investigate other endpoints that Stripe has to offer.

---

## Complete Code

`index.js`

```js
export default ({ action }, { env, services }) => {
	const { MailService, ItemService } = services;
	action('items.create', async ({ key, collection, payload }, { schema }) => {
		if (collection !== 'customers') return;
		const stripe = require(stripe)(env.STRIPE_TOKEN);
		stripe.customers.create({
			name: `${payload.first_name} ${payload.last_name}`,
			email: payload.email_address,
		}).then(customer => {
			const customers = new ItemsService(collection, { schema: schema });
			customers.updateByQuery({ filter: { id: key } }, { stripe_id: customer.id }, { emitEvents: false });
		}).catch(error => {
			mailService.send({
				to: 'sharedmailbox@directus.io',
				from: 'noreply@directus.io',
				subject: `An error has occurred with Stripe API`,
				text: "The following error occurred for "+payload.first_name+" "+payload.last_name+" when attempting to create an account in Stripe.\r\n\r\n"+error+"\r\n\r\nPlease investigate.\r\n\r\nID: "+key+"\r\nEmail: "+payload.email_address,
			});
		});
	});
};
```