---
description: A guide on how you can create a panel to display data from an external API like Vonage.
contributors: Tim Butterfield, Kevin Lewis
---

# Create A Panel To Display External API Data With Vonage

Panels are used in dashboards as part of the Insights module, and typically allow users to better-understand data held
in their Directus collections. In this guide, you will instead fetch data from an external API and display it in a table
as part of a panel.

<img src="https://marketing.directus.app/assets/31ac7437-99ed-44fe-9b75-b21c92198fda.png" alt="Table with header Messages shows several items with status, sent delative date, a recipient ID, and a provider">

Panels can only talk to internal Directus services, and can't reliably make external web requests because browser
security protections prevent these cross-origin requests from being made. To create a panel that can interact with
external APIs, this guide will create a bundle of an endpoint (that can make external requests) and a panel (that uses
the endpoint).

## Before You Start

You will need a Directus project - check out our [quickstart guide](https://docs.directus.io/getting-started/quickstart)
if you don't already have one. You will also need a
[Vonage Developer API account](https://developer.vonage.com/sign-up), taking note of your API Key and Secret.

## Create Bundle

Open a console to your preferred working directory and initialize a new extension, which will create the boilerplate
code for your operation.

```shell
npx create-directus-extension@latest
```

A list of options will appear (choose bundle), and type a name for your extension (for example,
`directus-extension-bundle-vonage-activity`).

Now the boilerplate bundle has been created, navigate to the directory with
`cd directus-extension-bundle-vonage-activity` and open the directory in your code editor.

## Add an Endpoint to the Bundle

In your terminal, run `npm run add` to create a new extension in this bundle. A list of options will appear (choose
endpoint), and type a name for your extension (for example, `directus-endpoint-vonage`). For this guide, select
JavaScript.

This will add an entry to the `directus:extension` metadata in your `package.json` file.

## Build the Endpoint

As there is a more detailed guide on
[building an authenticated custom endpoint to proxy external APIs](/guides/extensions/endpoints-api-proxy-twilio), this
guide will be more brief in this section.

Open the `src/directus-endpoint-vonage/index.js` file and replace it with the following:

```js
import { createError } from '@directus/errors';

const ForbiddenError = createError('VONAGE_FORBIDDEN', 'You need to be authenticated to access this endpoint');

export default {
	id: 'vonage',
	handler: (router, { env }) => {
		const { VONAGE_API_KEY, VONAGE_API_SECRET } = env;
		const baseURL = 'https://api.nexmo.com';
		const token = Buffer.from(`${VONAGE_API_KEY}:${VONAGE_API_SECRET}`).toString('base64');
		const headers = { Authorization: `Basic ${token}` };

		router.get('/records', async (req, res) => {
			if (req.accountability == null) throw new ForbiddenError();

			try {
				const url = baseURL + `/v2/reports/records?account_id=${VONAGE_API_KEY}&${req._parsedUrl.query}`;
				const response = await fetch(url, { headers });

				if (response.ok) {
					res.json(await response.json());
				} else {
					res.status(response.status).send(response.statusText);
				}
			} catch (error) {
				res.status(500).send(response.statusText);
			}
		});
	},
};
```

This extension introduces the `/vonage/records` endpoint to your application. Make sure to add the `VONAGE_API_KEY` and
`VONAGE_API_SECRET` to your environment variables.

## Add a View to the Bundle

In your terminal, run `npm run add` to create a new extension in this bundle. A list of options will appear (choose
panel), and type a name for your extension (for example, `directus-panel-vonage-activity`). For this guide, select
JavaScript.

This will add an entry to the `directus:extension` metadata in your `package.json` file.

## Configure the View

Panels have two parts - the `index.js` configuration file, and the `panel.vue` view. The first part is defining what
information you need to render the panel in the configuration.

Open `index.js` and change the `id`, `name`, `icon`, and `description`.

```js
id: 'panel-vonage-activity',
name: 'Vonage Reports',
icon: 'list_alt',
description: 'View recent Vonage SMS activity.',
```

Make sure the `id` is unique between all extensions including ones created by 3rd parties - a good practice is to
include a professional prefix. You can choose an icon from the library [here](https://fonts.google.com/icons).

The Panel will accept configuration options. The Vonage API supports `date_start`, `date_end`, `status`, `direction`
(incoming/outgoing), and `product` type (SMS/Messages).

For the product type, add a selection field with the options `SMS` and `MESSAGES`:

```js
{
	field: 'type',
	name: 'Product Type',
	type: 'string',
	meta: {
		width: 'half',
		interface: 'select-dropdown',
		options: {
			choices: [
				{ text: 'SMS', value: 'SMS' },
				{ text: 'Messages', value: 'MESSAGES' }
			],
		},
	},
},
```

Add another selection field for the ‘direction’ of the messages, inbound and outbound.

```js
{
	field: 'direction',
	name: 'Direction',
	type: 'string',
	meta: {
		width: 'half',
		interface: 'select-dropdown',
		options: {
			choices: [
				{ text: 'Outbound', value: 'outbound' },
				{ text: 'Inbound', value: 'inbound' }
			],
		}
	}
},
```

It would be useful to control the scope of data for those who transact larger amounts of messages. Add the following
option for the user to select a range:

```js
{
	field: 'range',
	type: 'dropdown',
	name: '$t:date_range',
	schema: { default_value: '1 day' },
	meta: {
		interface: 'select-dropdown',
		width: 'half',
		options: {
			choices: [
				{ text: 'Past 5 Minutes', value: '5 minutes' },
				{ text: 'Past 15 Minutes', value: '15 minutes' },
				{ text: 'Past 30 Minutes', value: '30 minutes' },
				{ text: 'Past 1 Hour', value: '1 hour' },
				{ text: 'Past 4 Hours', value: '4 hours' },
				{ text: 'Past 1 Day', value: '1 day' },
				{ text: 'Past 2 Days', value: '2 days' }
			]
		}
	}
},
```

Vonage has the ability to include the message in the response. This will be useful to provide as a preview upon click
but for larger datasets may impact the performance of the API. Create an option to toggle this on/off:

```js
{
	field: 'includeMessage',
	name: 'Include Message',
	type: 'boolean',
	meta: {
		interface: 'boolean',
		width: 'half',
	},
	schema: {
		default_value: false,
	}
},
```

Lastly, add the option to limit the messages to a specific state such as delivered or failed. The default option is
`Any`:

```js
{
	field: 'status',
	name: 'Status',
	type: 'string',
	schema: {
		default_value: 'any',
	},
	meta: {
		width: 'half',
		interface: 'select-dropdown',
		options: {
			choices: [
				{ text: 'Any', value: 'any' },
				{ text: 'Delivered', value: 'delivered' },
				{ text: 'Expired', value: 'expired' },
				{ text: 'Failed', value: 'failed' },
				{ text: 'Rejected', value: 'rejected' },
				{ text: 'Accepted', value: 'accepted' },
				{ text: 'buffered', value: 'buffered' },
				{ text: 'Unknown', value: 'unknown' },
				{ text: 'Deleted', value: 'deleted' }
			]
		}
	}
},
```

After the `options` section, there is the ability to limit the width and height of the panel. Since this panel will hold
a lot of data, set these to `24` for the width and `18` for the height:

```js
minWidth: 24,
minHeight: 18,
```

The output of these options will look like this:

<img src="https://marketing.directus.app/assets/053298df-a5ff-4fd5-85ec-ff0f78bb64ca.png" alt="Form shows product type dropdown, direction dropdown, date range dropdown, included message checkbox, and status dropdown." style="padding: 2px 12px;">

## Prepare the View

Open the `panel.vue` file and you will see the starter template and script. Skip to the script section and import the
following packages:

```js
import { useApi } from '@directus/extensions-sdk';
import { adjustDate } from '@directus/shared/utils';
import { formatISO, formatDistanceToNow, parseISO } from 'date-fns';
import { ref, watch } from 'vue';
```

In the `props`, `showHeader` is one of the built-in properties which you can use to alter your panel if a header is
showing. Remove the text property and add all the options that were created in the previous file:

```js
props: {
	showHeader: {
		type: Boolean,
		default: false,
	},
	type: {
		type: String,
		default: '',
	},
	direction: {
		type: String,
		default: '',
	},
	range: {
		type: String,
		default: '',
	},
	includeMessage: {
		type: Boolean,
		default: false,
	},
	status: {
		type: String,
		default: '',
	},
},
```

After the `props`, create a `setup(props)` section and create the variables needed:

```js

setup(props) {
	const api = useApi();
	const activityData = ref([]);
	const now = ref(new Date());
	const isLoading = ref(true);
	const errorMessage = ref();
},

```

Create a `fetchData` function that will use the information provided to construct the query parameters and perform the
API query. The response is written to the `activityData` variable.

Use the `isLoading` variable to hide or show the progress spinner to indicate that the query is running:

```js
async function fetchData() {
	isLoading.value = true;
	activityData.value = [];

	const dateStart = adjustDate(now.value, props.range ? `-${props.range}` : '-1 day');

	const params = {
		product: props.type || 'SMS',
		direction: props.direction || 'outbound',
		include_message: props.includeMessage.toString(),
		date_start: dateStart ? formatISO(dateStart) : '',
		status: props.status || 'any',
	};

	if (props.status) params.status = props.status;

	const url_params = new URLSearchParams(params);

	try {
		const response = await api.get(`/vonage/records?${url_params.toString()}`);
		activityData.value = response.data.records;
	} catch {
		errorMessage.value = 'Internal Server Error';
	} finally {
		isLoading.value = false;
	}
}

fetchData();
```

The endpoint `/vonage/records` comes from the custom extension created in an earlier step. When `fetchData()` is called,
the `activityData` variable is updated with the result.

If any of the properties are changed, the function will need to update the activity data again. Use the following code:

```js
watch(
	[() => props.type, () => props.direction, () => props.range, () => props.includeMessage, () => props.status],
	fetchData
);
```

At the end of the script, return the required variables and functions for use in the Vue template:

```js
return { activityData, isLoading, errorMessage, formatDistanceToNow, parseISO };
```

## Build the View

Back to the template section, remove all the content between the template tags, then add a fallback notice if some
essential information is missing. Start with this:

```vue
<template>
	<div class="messages-table" :class="{ 'has-header': showHeader }">
		<v-progress-circular v-if="isLoading" class="is-loading" indeterminate />
		<v-notice v-else-if="errorMessage" type="danger">{{ errorMessage }}</v-notice>
		<v-notice v-else-if="activityData.length == 0" type="info">No Messages</v-notice>
		<!-- Table goes here -->
	</div>
</template>
```

The `v-progress-circular` is a loading spinner that is active while the `isLoading` variable is true. After that, there
is a `danger` notice if `errorMessage` contains a value, then an `info` notice if there aren't any messages in the data.

Next, build a table to present the data:

```vue
<table cellpadding="0" cellspacing="0" border="0">
	<thead>
		<tr>
			<th v-if="direction == 'outbound'">Status</th>
			<th v-if="direction == 'outbound'">Sent</th>
			<th v-else>Received</th>
			<th v-if="includeMessage">Message</th>
			<th v-if="direction == 'outbound'">Recipient</th>
			<th v-else>From</th>
			<th>Provider</th>
		</tr>
	</thead>
	<tbody>
		<tr v-for="message in activityData" :key="message.message_id">
			<td v-if="direction == 'outbound'" class="ucwords">{{ message.status }}</td>
			<td class="nowrap">
				{{ formatDistanceToNow(parseISO(message.date_finalized ? message.date_finalized : message.date_received)) }} ago
			</td>
			<td v-if="includeMessage" class="message">{{ message.message_body }}</td>
			<td v-if="direction == 'outbound'">{{ message.to }}</td>
			<td v-else>{{ message.from }}</td>
			<td class="ucwords">{{ type == 'MESSAGES' ? message.provider : message.network_name }}</td>
		</tr>
	</tbody>
</table>
```

The `inbound` and `outbound` structure is a little different and needs different headings. Use `v-if` with the
`direction` property to change the headers as needed.

Using `date-fns`, the date can be formatted into a user-friendly way. For an activity stream, showing the distance from
now is more helpful.

Lastly, replace the CSS at the bottom with this:

```vue
<style scoped>
.messages-table { padding: 12px; height: 100%; overflow: scroll; }
.messages-table table { width: 100%; min-width: 600px; }
.messages-table table tr td,
.messages-table table tr th { vertical-align: top; border-top: var(--theme--border-width) solid var(--border-subdued); padding: 10px; }
.ucwords { text-transform: capitalize; }
.nowrap { white-space: nowrap; }
.message { min-width: 260px; }
.messages-table table tr th { font-weight: bold; text-align: left; font-size: 0.8em; text-transform: uppercase; line-height: 1; padding: 8px 10px; }
.text.has-header { padding: 0 12px; }
.is-loading { position: absolute; left: calc(50% - 14px); top: calc(50% - 28px); }
</style>
```

Both extensions are now complete. Build the extensions with the latest changes from the root of the bundle:

```
npm run build
```

## Add Extensions to Directus

When Directus starts, it will look in the `extensions` directory for any subdirectory starting with
`directus-extension-`, and attempt to load them.

To install an extension, copy the entire directory with all source code, the `package.json` file, and the `dist`
directory into the Directus extensions `directory`. Make sure the directory with your bundle has a name that starts with
`directus-extension`. In this case, you may choose to use `directus-extension-bundle-vonage-activity`.

Restart Directus to load the extensions.

:::info Required files

Only the `package.json` and `dist` directory are required inside of your extension directory. However, adding the source
code has no negative effect.

:::

## Use the Panel

From an Insights dashboard, choose **Vonage Reports** from the list.

Fill in the configuration fields as needed:

1. Choose the Product Type (Messages or SMS)
2. Choose the Direction (inbound or outbound messages)
3. Choose a time frame to fetch the data
4. Include or Exclude the message itself
5. (SMS only) Only show messages with a status.

Save the panel and dashboard. It will look something like this:

<img src="https://marketing.directus.app/assets/31ac7437-99ed-44fe-9b75-b21c92198fda.png" alt="Table with header Messages shows several items with status, sent delative date, a recipient ID, and a provider">

## Summary

With this panel, Messages and SMS recently sent through Vonage are listed on your dashboards. You can alter your custom
endpoint extension to create more panels for other Vonage APIs.

## Complete Code

### Endpoint

`index.js`

```js
import { createError } from '@directus/errors';

const ForbiddenError = createError('VONAGE_FORBIDDEN', 'You need to be authenticated to access this endpoint');

export default {
	id: 'vonage',
	handler: (router, { env }) => {
		const { VONAGE_API_KEY, VONAGE_API_SECRET } = env;
		const baseURL = 'https://api.nexmo.com';
		const token = Buffer.from(`${VONAGE_API_KEY}:${VONAGE_API_SECRET}`).toString('base64');
		const headers = { Authorization: `Basic ${token}` };

		router.get('/records', async (req, res) => {
			if (req.accountability == null) throw new ForbiddenError();

			try {
				const url = baseURL + `/v2/reports/records?account_id=${VONAGE_API_KEY}&${req._parsedUrl.query}`;
				const response = await fetch(url, { headers });

				if (response.ok) {
					res.json(await response.json());
				} else {
					res.status(response.status).send(response.statusText);
				}
			} catch (error) {
				res.status(500).send(response.statusText);
			}
		});
	},
};
```

### Panel

`index.js`

```js
import PanelComponent from './panel.vue';

export default {
	id: 'panel-vonage-sms-activity',
	name: 'Vonage Reports',
	icon: 'list_alt',
	description: 'View recent SMS activity.',
	component: PanelComponent,
	options: [
		{
			field: 'type',
			name: 'Product Type',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: 'SMS', value: 'SMS' },
						{ text: 'Messages', value: 'MESSAGES' },
					],
				},
			},
		},
		{
			field: 'direction',
			name: 'Direction',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: 'Outbound', value: 'outbound' },
						{ text: 'Inbound', value: 'inbound' },
					],
				},
			},
		},
		{
			field: 'range',
			type: 'dropdown',
			name: '$t:date_range',
			schema: {
				default_value: '1 day',
			},
			meta: {
				interface: 'select-dropdown',
				width: 'half',
				options: {
					choices: [
						{ text: 'Past 5 Minutes', value: '5 minutes' },
						{ text: 'Past 15 Minutes', value: '15 minutes' },
						{ text: 'Past 30 Minutes', value: '30 minutes' },
						{ text: 'Past 1 Hour', value: '1 hour' },
						{ text: 'Past 4 Hours', value: '4 hours' },
						{ text: 'Past 1 Day', value: '1 day' },
						{ text: 'Past 2 Days', value: '2 days' },
					],
				},
			},
		},
		{
			field: 'includeMessage',
			name: 'Include Message',
			type: 'boolean',
			meta: {
				interface: 'boolean',
				width: 'half',
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'status',
			name: 'Status',
			type: 'string',
			schema: {
				default_value: 'any',
			},
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: 'Any', value: 'any' },
						{ text: 'Delivered', value: 'delivered' },
						{ text: 'Expired', value: 'expired' },
						{ text: 'Failed', value: 'failed' },
						{ text: 'Rejected', value: 'rejected' },
						{ text: 'Accepted', value: 'accepted' },
						{ text: 'buffered', value: 'buffered' },
						{ text: 'Unknown', value: 'unknown' },
						{ text: 'Deleted', value: 'deleted' },
					],
				},
			},
		},
	],
	minWidth: 24,
	minHeight: 18,
};
```

`panel.vue`

```vue
<template>
	<div class="messages-table" :class="{ 'has-header': showHeader }">
		<v-progress-circular v-if="isLoading" class="is-loading" indeterminate />
		<v-notice v-else-if="errorMessage" type="danger">{{ errorMessage }}</v-notice>
		<v-notice v-else-if="activityData.length == 0" type="info">No Messages</v-notice>
		<table v-else cellpadding="0" cellspacing="0" border="0">
			<thead>
				<tr>
					<th v-if="direction == 'outbound'">Status</th>
					<th v-if="direction == 'outbound'">Sent</th>
					<th v-else>Received</th>
					<th v-if="includeMessage">Message</th>
					<th v-if="direction == 'outbound'">Recipient</th>
					<th v-else>From</th>
					<th>Provider</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="message in activityData" :key="message.message_id">
					<td v-if="direction == 'outbound'" class="ucwords">{{ message.status }}</td>
					<td class="nowrap">
						{{ formatDistanceToNow(parseISO(message.date_finalized ? message.date_finalized : message.date_received)) }}
						ago
					</td>
					<td v-if="includeMessage" class="message">{{ message.message_body }}</td>
					<td v-if="direction == 'outbound'">{{ message.to }}</td>
					<td v-else>{{ message.from }}</td>
					<td class="ucwords">{{ type == 'MESSAGES' ? message.provider : message.network_name }}</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script>
import { useApi } from '@directus/extensions-sdk';
import { adjustDate } from '@directus/utils';
import { formatISO, formatDistanceToNow, parseISO } from 'date-fns';
import { ref, watch } from 'vue';
export default {
	props: {
		showHeader: {
			type: Boolean,
			default: false,
		},
		type: {
			type: String,
			default: '',
		},
		direction: {
			type: String,
			default: '',
		},
		range: {
			type: String,
			default: '',
		},
		includeMessage: {
			type: Boolean,
			default: false,
		},
		status: {
			type: String,
			default: '',
		},
	},
	setup(props) {
		const api = useApi();
		const activityData = ref([]);
		const now = ref(new Date());
		const isLoading = ref(true);
		const errorMessage = ref();

		async function fetchData() {
			isLoading.value = true;
			activityData.value = [];

			const dateStart = adjustDate(now.value, props.range ? `-${props.range}` : '-1 day');

			const params = {
				product: props.type || 'SMS',
				direction: props.direction || 'outbound',
				include_message: props.includeMessage.toString(),
				date_start: dateStart ? formatISO(dateStart) : '',
				status: props.status || 'any',
			};

			if (props.status) params.status = props.status;

			const url_params = new URLSearchParams(params);

			try {
				const response = await api.get(`/vonage/records?${url_params.toString()}`);
				activityData.value = response.data.records;
			} catch {
				errorMessage.value = 'Internal Server Error';
			} finally {
				isLoading.value = false;
			}
		}

		fetchData();

		watch(
			[() => props.type, () => props.direction, () => props.range, () => props.includeMessage, () => props.status],
			fetchData
		);

		return { activityData, isLoading, errorMessage, formatDistanceToNow, parseISO };
	},
};
</script>

<style scoped>
.messages-table {
	padding: 12px;
	height: 100%;
	overflow: scroll;
}
.messages-table table {
	width: 100%;
	min-width: 600px;
}
.messages-table table tr td,
.messages-table table tr th {
	vertical-align: top;
	border-top: var(--theme--border-width) solid var(--border-subdued);
	padding: 10px;
}
.ucwords {
	text-transform: capitalize;
}
.nowrap {
	white-space: nowrap;
}
.message {
	min-width: 260px;
}
.messages-table table tr th {
	font-weight: bold;
	text-align: left;
	font-size: 0.8em;
	text-transform: uppercase;
	line-height: 1;
	padding: 8px 10px;
}
.text.has-header {
	padding: 0 12px;
}
.is-loading {
	position: absolute;
	left: calc(50% - 14px);
	top: calc(50% - 28px);
}
</style>
```
