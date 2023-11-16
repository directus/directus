---
description: Learn how to proxy a third-party API with a custom endpoint, requiring a valid user account.
contributors: Tim Butterfield, Kevin Lewis
---

# Use Custom Endpoints to Create an Authenticated API Proxy

Endpoints are used in the API to perform certain functions.

Accessing a 3rd party API via a proxy in Directus has many advantages such as allowing multiple Directus users to access
a service via a single 3rd party auth token, simplifying front-end extensions by accessing 3rd party APIs using the
local API endpoint and credentials, and eliminating Cross-Origin issues.

As an example, this guide will proxy the Twilio API, but the same approach can be used for any API.

## Install Dependencies

Open a console to your preferred working directory and initialize a new extension, which will create the boilerplate
code for your operation.

```shell
npx create-directus-extension@latest
```

A list of options will appear (choose endpoint), and type a name for your extension (for example,
`directus-endpoint-twilio`). For this guide, select JavaScript.

Now the boilerplate has been created, open the directory in your code editor.

## Build the Endpoint

In the `src` directory open `index.js`. By default, the endpoint root will be the name of the extensions folder which
would be `/directus-endpoint-twilio/`. To change this, replace the code with the following:

```js
export default {
	id: 'twilio',
	handler: (router) => {
		// Router config goes here
	},
};
```

The `id` becomes the root and must be a unique identifier between all other endpoints.

The Twilio API requires a Twilio Account SID and API Token and are best placed in the environment file. To access these
variables, add the `env` context to the handler like so:

```js
handler: (router, { env }) => {
```

Create variables for Twilio and construct the request headers object for Basic Authentication:

```js
const twilioHost = 'https://api.twilio.com';
const twilioSid = env.TWILIO_ACCOUNT_SID;
const twilioToken = env.TWILIO_AUTH_TOKEN;

const token = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');

const headers = {
	Authorization: `Basic ${token}`,
};
```

_Note: the client initialization values are unique to Twilio. Other 3rd Party services may authentication differently,
such as Bearer token._

The standard way to create an API route is to specify the method and the path. Rather than recreate every possible
endpoint that Twilio has, use a wildcard (\*) to run this function for every route for each supported method.

```js
router.get('/*', async (req, res) => {
	try {
		const response = await fetch(new URL(req.url, twilioHost), { headers });

		if (response.ok) {
			res.json(await response.json());
		} else {
			res.status(response.status);
			res.send(response.statusText);
		}
	} catch (error) {
		res.status(500);
		res.send(error.message);
	}
});

router.post('/*', async (req, res) => {
	try {
		const response = await fetch(new URL(req.url, twilioHost), {
			method: 'POST',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(req.body),
		});

		if (response.ok) {
			res.json(await response.json());
		} else {
			res.status(response.status);
			res.send(response.statusText);
		}
	} catch (error) {
		res.status(500);
		res.send(error.message);
	}
});
```

Each route includes the request (`req`) and response (`res`). The request has useful information that was provided by
the user or application such as the URL, method, authentication and other HTTP headers. In this case, the URL needs to
be combined with the twilio host to perform an API query.

### Ensure User Is Authenticated

As Twilio is an API that requires authentication and costs money to use, you should also require authentication for your
endpoint. Without this, any person on the internet could use it.

A client is unauthenticated if `req.accountability.user` is `null`, use this check to protect both methods:

```js
router.get('/*', async (req, res) => {
	if (req.accountability?.user == null) { // [!code ++]
		res.status(403); // [!code ++]
		return res.send(`You don't have permission to access this.`); // [!code ++]
	} // [!code ++]

	try {
		const response = await fetch(new URL(req.url, twilioHost), { headers });

		if (response.ok) {
			res.json(await response.json());
		} else {
			res.status(response.status);
			res.send(response.statusText);
		}
	} catch (error) {
		res.status(500);
		res.send(error.message);
	}
});

router.post('/*', async (req, res) => {
	if (req.accountability?.user == null) { // [!code ++]
		res.status(403); // [!code ++]
		return res.send(`You don't have permission to access this.`); // [!code ++]
	} // [!code ++]

	try {
		const response = await fetch(new URL(req.url, twilioHost), {
			method: 'POST',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(req.body),
		});

		if (response.ok) {
			res.json(await response.json());
		} else {
			res.status(response.status);
			res.send(response.statusText);
		}
	} catch (error) {
		res.status(500);
		res.send(error.message);
	}
});
```

This is now complete and ready for testing. Build the endpoint with the latest changes.

```
npm run build
```

## Add Endpoint to Directus

When Directus starts, it will look in the `extensions` directory for any subdirectory starting with
`directus-extension-`, and attempt to load them.

To install an extension, copy the entire directory with all source code, the `package.json` file, and the `dist`
directory into the Directus `extensions` directory. Make sure the directory with your extension has a name that starts
with `directus-extension`. In this case, you may choose to use `directus-extension-endpoint-twilio`.

Ensure the `.env` file has `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` variables.

Restart Directus to load the extension.

:::info Required files

Only the `package.json` and `dist` directory are required inside of your extension directory. However, adding the source
code has no negative effect.

:::

## Use the Endpoint

Using an application such as Postman, create a new request. The URL will be: `https://example.directus.app/twilio/` (be
sure that you change the URL for your project's URL)

Visit the Twilio docs and find an endpoint - for example
[Send an SMS Message](https://www.twilio.com/docs/sms/api/message-resource).

Make sure to select CURL as the coding language and this will output the URL to use. Copy the URL without the host and
paste it to the end of your Directus endpoint, making sure to replace the `$TWILIO_ACCOUNT_SID` with your account SID.

It will look something like:

`https://example.directus.app/twilio/2010-04-01/Accounts/XXXXX_YOUR_SID_XXXXX/Messages.json`

Change the method to as required (in this case POST) and add the following json to the body:

```json
{
	"From": "+0123456789",
	"Body": "Hi from Directus",
	"To": "+0123456780"
}
```

Change the `From` number to the number used by your Twilio account and change the `To` number to your personal number
then send the query.

You should receive the direct response from Twilio.

## Summary

With this endpoint, you now have access to the Twilio API within Directus using the built-in credentials of the current
user. Now that you know how to create a proxy to Twilio, you can create proxies for other 3rd party services and
simplify your other extensions.

## Complete Code

`index.js`

```js
export default {
	id: 'twilio',
	handler: (router, { env }) => {
		const twilioHost = 'https://api.twilio.com';
		const twilioSid = env.TWILIO_ACCOUNT_SID;
		const twilioToken = env.TWILIO_AUTH_TOKEN;

		const token = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');

		const headers = {
			Authorization: `Basic ${token}`,
		};

		router.get('/*', async (req, res) => {
			if (req.accountability?.user == null) {
				res.status(403);
				return res.send(`You don't have permission to access this.`);
			}

			try {
				const response = await fetch(new URL(req.url, twilioHost), { headers });

				if (response.ok) {
					res.json(await response.json());
				} else {
					res.status(response.status);
					res.send(response.statusText);
				}
			} catch (error) {
				res.status(500);
				res.send(error.message);
			}
		});

		router.post('/*', async (req, res) => {
			if (req.accountability?.user == null) {
				res.status(403);
				return res.send(`You don't have permission to access this.`);
			}

			try {
				const response = await fetch(new URL(req.url, twilioHost), {
					method: 'POST',
					headers: {
						...headers,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(req.body),
				});

				if (response.ok) {
					res.json(await response.json());
				} else {
					res.status(response.status);
					res.send(response.statusText);
				}
			} catch (error) {
				res.status(500);
				res.send(error.message);
			}
		});
	},
};
```
