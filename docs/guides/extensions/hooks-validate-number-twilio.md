---
description: Learn how to use a hook to validate phone numbers before allowing them in the database.
contributors: Tim Butterfield, Kevin Lewis
---

# Use Hooks to Validate Phone Numbers With Twilio

Hooks allow you to trigger your own code when events are emitted from Directus. This guide will show you how to prevent
a record from saving if a phone number is not valid using the Twilio Lookup API.

## Install Dependencies

Open a console to your preferred working directory and initialize a new extension, which will create the boilerplate
code for your display.

```shell
npx create-directus-extension@latest
```

A list of options will appear (choose hook), and type a name for your extension (for example,
`directus-hook-phone-validation`). For this guide, select JavaScript.

Now the boilerplate has been created, install the twilio package, and then open the directory in your code editor.

```
cd directus-hook-phone-validation
npm install twilio @directus/errors
```

## Build the Hook

Create a collection called Customers with a text field called `phone_number`. This hook will be used to validate the
item when a record is saved.

Open the `index.js` file inside the src directory. Delete all the existing code and start with the import of the Twilio
library and the invalid payload error:

```js
import twilio from 'twilio';
import { InvalidPayloadError } from "@directus/errors";
```

Create an initial export. This hook will need to intercept the save function with `filter` and include `env` for the
environment variables:

```js
export default ({ filter }, { env }) => {};
```

Next, capture the `items.create` stream using `filter` and include the `input` and `collection` associated with the
stream:

```js
filter('items.create', async (input, { collection }) => {});
```

When using filters and actions, it’s important to remember this will capture **all** events so you should set some
restrictions. Inside the filter, exclude anything that’s not in the customers collection.

```js
filter('items.create', async (input, { collection }) => {
	if (collection !== 'customers') return input; // [!code ++]
});
```

Prevent saving an event if the `phone_number` is `undefined`, by reporting this back to the user. Add this line
underneath the collection restriction.

```js
if (input.phone_number === undefined) {
	throw new InvalidPayloadError({ reason: 'No Phone Number has been provided' });
}
```

Set up your Twilio phone number lookup:

```js
const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

client.lookups.v2
	.phoneNumbers(input.phone_number)
	.fetch()
	.then((phoneNumber) => {});
```

`env` looks inside the Directus environment variables for `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`. In order to
start using this hook, these variables must be added to the `.env` file.

The lookup is performed with the `phone_number` from the input object.

Inside the callback, provide a response for when the phone number is invalid, otherwise continue as normal. Twilio
provides a very helpful boolean response called `valid`.

Use this to throw an error if `false`, or return the input to the stream and end the hook if `true`:

```js
client.lookups.v2
	.phoneNumbers(input.phone_number)
	.fetch()
	.then((phoneNumber) => {
		if (!phoneNumber.valid) { // [!code ++]
			throw new InvalidPayloadError({ reason: 'Phone Number is not valid' }); // [!code ++]
		} // [!code ++]
// [!code ++]
		return input; // [!code ++]
	});
```

Build the hook with the latest changes.

```
npm run build
```

## Add Hook to Directus

When Directus starts, it will look in the `extensions` directory for any subdirectory starting with
`directus-extension-`, and attempt to load them.

To install an extension, copy the entire directory with all source code, the `package.json` file, and the `dist`
directory into the Directus `extensions` directory. Make sure the directory with your extension has a name that starts
with `directus-extension`. In this case, you may choose to use `directus-extension-hook-phone-validation`.

Ensure the `.env` file has `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` variables.

Restart Directus to load the extension.

:::info Required files

Only the `package.json` and `dist` directory are required inside of your extension directory. However, adding the source
code has no negative effect.

:::

## Summary

With Twilio now integrated in this hook, whenever a record attempts to save for the first time, this hook will validate
the phone number with Twilio and respond with true or false. If false, the record is prevented from saving until a valid
phone number is supplied. Now that you know how to interact with the Twilio API, you can investigate other endpoints
that Twilio has to offer.

## Complete Code

`index.js`

```js
import { InvalidPayloadError } from "@directus/errors";

export default ({ filter }, { env }) => {
	filter('items.create', async (input, { collection }) => {
		if (collection !== 'customers') return input;

		if (input.phone_number === undefined) {
			throw new InvalidPayloadError({ reason: 'No Phone Number has been provided' });
		}

		const accountSid = env.TWILIO_ACCOUNT_SID;
		const authToken = env.TWILIO_AUTH_TOKEN;
		const client = new twilio(accountSid, authToken);

		client.lookups.v2
			.phoneNumbers(input.phone_number)
			.fetch()
			.then((phoneNumber) => {
				if (!phoneNumber.valid) {
					throw new InvalidPayloadError({ reason: 'Phone Number is not valid' });
				}

				return input;
			});
	});
};
```
