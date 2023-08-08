---
description: Learn how to use a hook to validate phone numbers before allowing them in the database.
contributors: Tim Butterfield, Kevin Lewis
---

# Use Hooks To Validate Phone Numbers With Twilio

Hooks allow you to trigger your own code when events are emitted from Directus. This guide will show you how to prevent
a record from saving if a phone number is not valid using the Twilio Lookup API.

## Install Dependencies

Open a console to your preferred working directory, then install the Directus Extensions SDK, which will create the
boilerplate code for your display.

```
npm i create-directus-extension
npm init directus-extension
```

A list of options will appear (choose hook), and type a name for your extension (for example,
`directus-hook-phone-validation`). For this guide, select JavaScript.

Now the hook has been created, go into the current directory and build the extension. This must be performed whenever
your changes are ready to be deployed.

```
cd directus-hook-phone-validation
npm run build
```

Install twilio from npm as a dependency by running the following command:

```
npm install twilio
```

Note, if you intend to create more than one hook using the Twilio package, consider adding it to the Directus project
dependencies instead to improve performance.

## Build the Hook

Create a collection called Customers with a text field called `phone_number`. This hook will be used to validate the
filename when a record is saved.

Open the `index.js` file inside the src directory. Delete all the existing code and proceed.

Create an initial export. This hook will need to intercept the save function with `filter` and include `env` for the
environment variables and `exceptions` to throw an error when validation fails:

```js
export default ({ filter }, { env, exceptions }) => {
};
```

Inside the function, define the invalid payload function from the exceptions scope:

```js
export default ({ filter }, { env, exceptions }) => {
	const { InvalidPayloadException } = exceptions; // [!code ++]
};
```

Next, capture the `items.create` stream using `filter` and include the `input` and `collection` associated with the
stream:

```js
filter('items.create', async (input, { collection }) => {
});
```

When using filters and actions, it’s important to remember this will capture **all** events so you should set some
restrictions. Inside the filter, exclude anything that’s not in the customers collection.

```js
filter('items.create', async (input, { collection }) => {
	if (collection !== 'customers') return input; // [!code ++]
});
```

Prevent saving an event if the `phone_number` is `undefined`, by reporting this back to the user. Add this line
underneath the collections exception.

```js
if (input.phone_number === undefined) {
	throw new InvalidPayloadException('No Phone Number has been provided');
}
```

Set up your Twilio phone number lookup:

```js
const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

client.lookups.v2.phoneNumbers(input.phone_number).fetch()
.then(function(phone_number) {

});
```

`env` looks inside the Directus environment variables for `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`. In order to
start using this hook, these variables must be added to the `.env` file.

The lookup is performed with the `phone_number` from the input object.

Inside the callback, provide a response for when the phone number is invalid, otherwise continue as normal. Twilio
provides a very helpful boolean response called `valid`.

Use this to throw an exception if `false`, or return the input to the stream and end the hook if `true`:

```js
client.lookups.v2.phoneNumbers(input.phone_number).fetch()
.then(function(phone_number) {
	if(!phone_number.valid){  // [!code ++]
		throw new InvalidPayloadException('Phone Number is not valid');  // [!code ++]
	}  // [!code ++]
	return input;  // [!code ++]
});
```

Build the hook with the latest changes.

```
npm run build
```

## Add Hook to Directus

In order to use this hook in Directus, you must first install the dependency into your project.

1. In the Directus extensions directory, open the hooks directory and make a new directory called
   `directus-hook-phone-validation`.
2. From the hook’s directory, open the **dist** folder and copy the `index.js` file into the directory.
3. Restart Directus to load the extension.

## Summary

With Twilio now integrated in this hook, whenever a record attempts to save for the first time, this hook will validate
the phone number with Twilio and respond with true or false. If false, the record is prevented from saving until a valid
phone number is supplied. Now that you know how to interact with the Twilio API, you can investigate other endpoints
that Twilio has to offer.

## Complete Code

`index.js`

```js
export default ({ filter }, { env, exceptions }) => {
	const { InvalidPayloadException } = exceptions;

	filter('items.create', async (input, { collection }) => {

		if (collection !== 'customers') return input;
		if (input.phone_number === undefined) {
			throw new InvalidPayloadException('No Phone Number has been provided');
		}

		const accountSid = env.TWILIO_ACCOUNT_SID;
		const authToken = env.TWILIO_AUTH_TOKEN;
		const client = require('twilio')(accountSid, authToken);

		client.lookups.v2.phoneNumbers(input.phone_number).fetch().then(function(phone_number) {
			if(!phone_number.valid){
				throw new InvalidPayloadException('Phone Number is not valid');
			}
			return input;
		});
	});
};
```
