---
description: 'Learn how to proxy a third-party API with a custom endpoint.'
contributors: Tim Butterfield, Kevin Lewis
---

# Use Custom Endpoints to Create an API Proxy

Endpoints are used in the API to perform certain functions.

Accessing a 3rd party API via a proxy in Directus has many advantages such as allowing multiple Directus users to access
a service via a single 3rd party auth token, simplifying front-end extensions by accessing 3rd party APIs using the
local API endpoint and credentials, and eliminating Cross-Origin issues.

As an example, this guide will proxy the Twilio API, but the same approach can be used for any API.

## Install Dependencies

Open a console to your preferred working directory and initialize a new extension, which will create the
boilerplate code for your operation.

```
npx create-directus-extension
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

To perform the API query, add the `axios` package which is included in Directus.

```js
const axios = require('axios');
```

Create variables for the Twilio auth details, and then create a new `axios` instance with them:

```js
const twilio_host = "https://api.twilio.com";
const twilio_sid = env.TWILIO_ACCOUNT_SID;
const twilio_token = env.TWILIO_AUTH_TOKEN;

const twilio_api = axios.create({
	baseURL: twilio_host,
	auth: {
		username: twilio_sid,
		password: twilio_token,
	},
});
```

_Note: the client initialization values are unique to Twilio. Other 3rd Party services may authentication differently,
such as Bearer token._

The standard way to create an API route is to specify the method and the path. Rather than recreate every possible
endpoint that Twilio has, use a wildcard (\*) to run this function for every route for each supported method.

```js
router.get('/*', (req, res) => {
	twilio_api.get(req.url).then((response) => {
		res.json(response.data);
	}).catch((error) => {
		res.send(error);
	});
});

router.post('/*', (req, res) => {
	twilio_api.post(req.url, new URLSearchParams(req.body)).then((response) => {
		res.json(response.data);
	}).catch((error) => {
		res.send(error);
	});
});

```

Each route includes the request (`req`) and response (`res`). The request has useful information that was provided by
the user or application such as the URL, method, authentication and other HTTP headers. In this case, the URL needs to
be combined with the twilio host to perform an API query.

This is now complete and ready for testing. Build the endpoint with the latest changes.

```
npm run build
```

## Add Endpoint to Directus

1. In the Directus extensions directory, open the operations directory and make a new directory called
   `directus-endpoint-twilio`.
2. From the operation's directory, open the **dist** folder and copy the `index.js` file into the directory.
3. Update the .env file and add the `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` variables.
4. Restart Directus to load the extension.

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

```js
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
		const axios = require('axios');
		const twilio_host = "https://api.twilio.com";
		const twilio_sid = env.TWILIO_ACCOUNT_SID;
		const twilio_token = env.TWILIO_AUTH_TOKEN;
		const twilio_from = env.TWILIO_PHONE_NUMBER;
		const twilio_api = axios.create({
		 	baseURL: twilio_host,
			auth: {
				username: twilio_sid,
				password: twilio_token,
			},
		});

		router.get('/*', (req, res) => {
			twilio_api.get(req.url).then((response) => {
				res.json(response.data);
			}).catch((error) => {
				res.send(error);
			});
		});

		router.post('/*', (req, res) => {
			twilio_api.post(req.url, new URLSearchParams(req.body)).then((response) => {
				res.json(response.data);
			}).catch((error) => {
				res.send(error);
			});
		});
	},
};
```
