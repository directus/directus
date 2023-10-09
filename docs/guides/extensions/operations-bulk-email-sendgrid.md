---
description: Learn how to create an operation to send bulk email with SendGrid's Dynamic Templates.
contributors: Tim Butterfield, Kevin Lewis
---

# Use Custom Operations to Send Bulk Email With SendGrid

Operations allow you to trigger your own code in a Flow. This guide will show you how to use the SendGrid SDK to bulk
send emails as an operation in Flows.

![A SendGrid Bulk Email operation in a Flow](https://marketing.directus.app/assets/d6e597b7-f53c-47e7-89de-2eaaa4297bf0.png)

## Install Dependencies

To follow this guide, you will need a SendGrid API Key and access to SendGrid Dynamic Templates.

Open a console to your preferred working directory and initialize a new extension, which will create the boilerplate
code for your operation.

```shell
npx create-directus-extension@latest
```

A list of options will appear (choose operation), and type a name for your extension (for example,
`directus-operation-bulk-sendgrid`). For this guide, select JavaScript.

Now the boilerplate has been created, install the `@sendgrid/mail` package, and then open the directory in your code
editor.

```shell
cd directus-operation-bulk-sendgrid
npm install @sendgrid/mail
```

## Build the Operation UI

Operations have 2 parts - the `api.js` file that performs logic, and the `app.js` file that describes the front-end UI
for the operation.

Open `app.js` and change the `id`, `name`, `icon`, and `description`.

```js
id: 'operation-bulk-sendgrid',
name: 'SendGrid Bulk Email',
icon: 'mail',
description: 'Send bulk emails using SendGrid API.',
```

Make sure the `id` is unique between all extensions including ones created by 3rd parties - a good practice is to
include a professional prefix. You can choose an icon from the library [here](https://fonts.google.com/icons).

With the information above, the operation will appear in the list like this:

<img src="https://marketing.directus.app/assets/4a9c482b-0e69-4070-a2e0-4f8227f1c6c9.png" alt="SendGrid Bulk Email - send bulk emails using SendGrid API. An envelope icon is displayed in the box." style="padding: 2px 6px 4px;">

`options` are the fields presented in the frontend when adding this operation to the Flow. To send an email with
SendGrid, you will need the sending address, a recipient address, a subject and the template id. Replace the placeholder
options with the following:

```js
options: [
	{
		field: 'from',
		name: 'From Address',
		type: 'string',
		meta: {
			width: 'half',
			interface: 'input',
		},
	},
	{
		field: 'recipients',
		name: 'Recipients Object',
		type: 'json',
		meta: {
			width: 'half',
			interface: 'input',
		},
	},
	{
		field: 'email_key',
		name: 'Recipients Email Key',
		type: 'string',
		meta: {
			width: 'half',
			interface: 'input',
		},
	},
	{
		field: 'subject',
		name: 'Subject',
		type: 'string',
		meta: {
			width: 'half',
			interface: 'input',
		},
	},
	{
		field: 'template_data',
		name: 'Dynamic Template Data',
		type: 'json',
		meta: {
			width: 'full',
			interface: 'list',
			options: {
				template: '{{var}}: {{key}}',
				fields: [
					{
						field: 'var',
						name: 'Email Variable',
						type: 'string',
						meta: {
							width: 'half',
							interface: 'input',
							options: {
								font: 'monospace',
							},
						},
					},
					{
							field: 'key',
							name: 'Recipient Object Key',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'input',
								options: {
									font: 'monospace',
								},
							},
					},
				],
			},
		},
	},
	{
		field: 'template_id',
		name: 'SendGrid Template ID',
		type: 'string',
		meta: {
			width: 'full',
			interface: 'input',
		},
	},
],
```

- `from` and `subject` interfaces use an input interface for a simple string.
- `recipients` is set to JSON so it can receive all the recipient’s data such as email address, name, job title or
  anything else that is needed for the email.
- `email` is required for fetching the email address from the recipient object.
- `template_data` uses a list interface (also known as a repeater interface) where the user can specify what variables
  are within the email and what to replace them with. The var value needs to be the object key relative to a single
  recipient object. For example, `first_name` or `building.name`.
- `template_id` field uses a standard input field for the ID from SendGrid. This can be a static ID or dynamically added
  through the workflow.

<img alt="A form shows all of the defined fields above" src="https://marketing.directus.app/assets/a9cd9f44-b2c7-4ab7-912f-db0b693e7915.png" style="padding: 8px 12px 0;">

The `overview` section defines what is visible inside the operation’s card on the Flow canvas. An overview object
contains 2 parameters, `label` and `text`. The label can be any string and does not need to match the field name. The
text parameter can be a variable or just another string.

It will be useful to see the subject and the from address on the card. To do this you must include the fields value from
the options (`subject` and `from`) as properties. Replace the placeholder objects with the following:

```js
overview: ({ subject, from }) => [
	{
		label: 'Subject',
		text: subject,
	},
	{
		label: 'From',
		text: from,
	},
],
```

Now, the overview of the operation looks like this:

<img src="https://marketing.directus.app/assets/63f985a6-e73a-4a2d-9c31-5e6b0c135b58.png" alt="The flow overview card shows a subject and from value." style="max-width: 400px;"/>

## Build the API Function

Open the `api.js` file, update the `id` to match the one used in the `app.js` file, and import the SendGrid package at
the very top:

```js
import sgMail from '@sendgrid/mail'
```

The handler needs to include the fields from the `app.js` options and the environment variables from Directus. Replace
the handler definition with the following:

```js
handler: ({ from, recipients, substitutions, subject, template_id }, { env }
) => {
```

Set up the SendGrid API and message object with the following code:

```js
sgMail.setApiKey(env.SENDGRID_API_KEY);

let msg = {
	from: { email: from },
	personalizations: [],
	template_id: template_id,
};
```

Read more about the SendGrid Dynamic Template API request in the
[SendGrid documentation](https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-templates).

The `recipients` need to be added to the personalization list. Each item needs to follow this structure:

```json
{
	"to": [{ "email": "example@sendgrid.net" }],
	"dynamic_template_data": {
		"key": "value"
	}
}
```

_Note: do not add multiple email addresses inside the `to` object. Instead, each recipient must have their own
personalization object where you can include dynamic template data relevant to that person._

Convert both the recipients and dynamic variables to objects if they are submitted as JSON, and create a function to
parse values from the recipients and return the final value:

```js
const rec = Array.isArray(recipients) ? recipients : JSON.parse(recipients);
const dyn = Array.isArray(template_data) ? template_data : JSON.parse(template_data);

function parseValues(recipient, key) {
	if (key.includes('.')) {
		let value = recipient;
		let fields = key.split('.');

		fields.forEach((f) => {
			if (value != null) value = value[f];
		});

		return value;
	} else {
		return recipient[key];
	}
}
```

For each recipient, build the personalization object and add it to the `msg` variable. This will include the subject as
a dynamic variable. To use this, make sure to change the subject in SendGrid to <span v-pre>`{{{subject}}}`</span> to
receive this value.

```js
rec.forEach((recipient) => {
	let email_address = parseValues(recipient, email_key);

	let personalization = {
		to: [{ email: email_address }],
		dynamic_template_data: {
			subject: subject,
		},
	};

	dyn.forEach((s) => {
		personalization.dynamic_template_data[s.var] = parseValues(recipient, s.key);
	});

	msg.personalizations.push(personalization);
});
```

The `msg` variable is now ready to be sent to SendGrid. Use the following to send the data and return the response to
the workflow:

```js
return sgMail.send(msg);
```

Both files are now complete. Build the operation with the latest changes.

```
npm run build
```

## Add Operation to Directus

When Directus starts, it will look in the `extensions` directory for any subdirectory starting with
`directus-extension-`, and attempt to load them.

To install an extension, copy the entire directory with all source code, the `package.json` file, and the `dist`
directory into the Directus `extensions` directory. Make sure the directory with your extension has a name that starts
with `directus-extension`. In this case, you may choose to use `directus-extension-operation-bulk-sendgrid`.

Ensure the `.env` file has `SENDGRID_API_KEY` variable.

Restart Directus to load the extension.

:::info Required files

Only the `package.json` and `dist` directory are required inside of your extension directory. However, adding the source
code has no negative effect.

:::

## Use the Operation

In the Directus Data Studio, open the Flows section in Settings. Create a new flow with a manual trigger. Select the
collection(s) to include this button on.

Fetch some recipients by adding a **Read Data** operation and include the required fields and filters. Add a new step
(operation) after the Data Read operation by clicking the tick/plus on the card, then choose **SendGrid Bulk Email**
from the list.

<img alt="The full form is filled with values." src="https://marketing.directus.app/assets/028907bb-90db-47cb-994b-589f520d0f41.png" style="padding: 8px;">

- For the **From Address**, type `no-reply@company.com`. This must be the domain registered with SendGrid
- For the **Recipients Object**, use a previous flow operation such as Read Data to fetch all the required recipients as
  an array of objects. Make sure to include fields that will be used in the email. In this example, you will use
  <span v-pre>`{{$last}}`</span>.
- For the **Recipients Email Key**, type the field name that contains the recipient's email address and make sure it’s
  included in the Recipients Object.
- For the **Subject**, add a catchy subject for the email. If you want to personalize the subject, this is best done on
  the template with SendGrid.
- To add **Dynamic Template Data**, click Create New and set the **Email Variable** to the key used in the template and
  the **Recipient Object Key** to the field from the recipient object. In this example, use their first name from a
  field called `first_name` and use it to replace <span v-pre>`{{{name}}}`</span> in the SendGrid template.
- The `SendGrid Template ID` must be supplied. This can be added as a static string or dynamically added from the Flow.

Save the operation, save the Flow, and then trigger the flow by opening the chosen collection, then trigger the manual
flow from the right side toolbar.

## Summary

This operation will send an SendGrid API request to use an email template inside SendGrid along with the supplied
personal information to bulk send an email to the recipients. The response is captured in the logs for reference. Now
that you know how to interact with a third party API, you can investigate other services that can be used in your
workflows.

## Complete Code

`app.js`

```js
export default {
	id: 'operation-bulk-sendgrid',
	name: 'Sendgrid Bulk Email',
	icon: 'mail',
	description: 'Send bulk emails using SendGrid API.',
	overview: ({ subject, from }) => [
		{
			label: 'Subject',
			text: subject,
		},
		{
			label: 'From',
			text: from,
		},
	],
	options: [
		{
			field: 'from',
			name: 'From Address',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
			},
		},
		{
			field: 'recipients',
			name: 'Recipients Object',
			type: 'json',
			meta: {
				width: 'half',
				interface: 'input',
			},
		},
		{
			field: 'email_key',
			name: 'Recipent Email Key',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
			},
		},
		{
			field: 'subject',
			name: 'Subject',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
			},
		},
		{
			field: 'template_data',
			name: 'Dynamic Template Data',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'list',
				options: {
					template: '{{var}}: {{key}}',
					fields: [
						{
							field: 'var',
							name: 'Email Variable',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'input',
								options: {
									font: 'monospace',
								},
							},
						},
						{
							field: 'key',
							name: 'Recipient Object Key',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'input',
								options: {
									font: 'monospace',
								},
							},
						},
					],
				},
			},
		},
		{
			field: 'template_id',
			name: 'SendGrid Template ID',
			type: 'text',
			meta: {
				width: 'full',
				interface: 'input',
			},
		},
	],
};
```

`api.js`

```js
import sgMail from '@sendgrid/mail';

export default {
	id: 'operation-bulk-sendgrid',
	handler: ({ from, email_key, recipients, template_data, subject, template_id }, { env }) => {
		sgMail.setApiKey(env.SENDGRID_API_KEY);

		let msg = {
			from: {
				email: from,
			},
			personalizations: [],
			template_id: template_id,
		};

		const rec = Array.isArray(recipients) ? recipients : JSON.parse(recipients);
		const dyn = Array.isArray(template_data) ? template_data : JSON.parse(template_data);

		function parseValues(recipient, key) {
			if (key.includes('.')) {
				let value = recipient;
				let fields = key.split('.');

				fields.forEach((f) => {
					if (value != null) {
						value = value[f];
					}
				});

				return value;
			} else {
				return recipient[key];
			}
		}

		rec.forEach((recipient) => {
			let email_address = parseValues(recipient, email_key);

			let personalization = {
				to: [{ email: email_address }],
				dynamic_template_data: {
					subject: subject,
				},
			};

			dyn.forEach((s) => {
				personalization.dynamic_template_data[s.var] = parseValues(recipient, s.key);
			});

			msg.personalizations.push(personalization);
		});

		return sgMail.send(msg);
	},
};
```
