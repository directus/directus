---
description: Learn how to expose any package on NPM as a custom operation.
contributors: Nils Twelker, Kevin Lewis
---

# Exposing an NPM Package as a Custom Operation

This guide will show you how to expose an NPM package as a custom operation in Flows. We will use `lodash` here, but the
process should be the same for any package.

## Install Dependencies

Open a console to your preferred working directory and initialize a new extension, which will create the boilerplate
code for your operation.

```shell
npx create-directus-extension@latest
```

A list of options will appear (choose operation), and type a name for your extension (for example,
`directus-operation-lodash`). For this guide, select JavaScript.

Now the boilerplate has been created, install the lodash package, and then open the directory in your code editor.

```shell
cd directus-operation-lodash
npm install lodash
```

## Build the Operation UI

Operations have 2 parts - the `api.js` file that performs logic, and the `app.js` file that describes the front-end UI
for the operation.

Open `app.js` and change the `id`, `name`, `icon`, and `description`.

```js
id: 'operation-lodash-camelcase',
name: 'Lodash Camel Case',
icon: 'electric_bolt',
description: 'Use Lodash Camel Case Function.',
```

Make sure the `id` is unique between all extensions including ones created by 3rd parties - a good practice is to
include a professional prefix. You can choose an icon from the library [here](https://fonts.google.com/icons).

With the information above, the operation will appear in the list like this:

<img src="https://marketing.directus.app/assets/8e5245cb-2454-4c46-8a59-04a325385d61.png" alt="Custom operation featuring the previously set icon, name and description" style="padding:3px 2px 2px;"/>

### Accepting Inputs

The default `options` object in `app.js` has a single text interface called `text`:

```js
options: [
	{
		field: 'text',
		name: 'Text',
		type: 'string',
		meta: {
			width: 'full',
			interface: 'input',
		},
	},
],
```

If your NPM package function requires multiple inputs, you can add them here. The `overview` array defines what is shown
on the card when the operation is not selected.

## Build the API Function

Open the `api.js` file and update the `id` to match the one used in the `app.js` file. Import from your NPM package,
execute your logic, and finish by return any data from the operation into the data chain.

```js
import { defineOperationApi } from '@directus/extensions-sdk';
import { camelCase } from 'lodash'; // [!code ++]

export default defineOperationApi({
	id: 'operation-lodash-camelcase',
	handler: ({ text }) => {
		console.log(text); // [!code --]
		return { // [!code ++]
			text: camelCase(text) // [!code ++]
		}; // [!code ++]
	},
});
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
with `directus-extension`. In this case, you may choose to use `directus-extension-operation-lodash`.

Restart Directus to load the extension.

:::info Required files

Only the `package.json` and `dist` directory are required inside of your extension directory. However, adding the source
code has no negative effect.

:::

## Use the Operation

In the Directus Data Studio, open the Flows section in Settings. Create a new flow with a manual trigger. Select the
collection(s) to include this button on.

Add a new step (operation) by clicking the tick/plus on the card, then choose **Lodash Camel Case** from the list. In
the text box, you can use any of the values from the trigger, or a hardcoded string.

Save the operation, save the Flow, and then trigger the flow by opening the chosen collection, then trigger the manual
flow from the right side toolbar.

## Summary

This operation takes an NPM package (`lodash`) and exposes it as a custom operation extension. You can use the same
technique for other packages to extend on the features of Directus Flows.

## Complete Code

`app.js`

```js
export default {
	id: 'operation-lodash-camelcase',
	name: 'Lodash Camel Case',
	icon: 'electric_bolt',
	description: 'Use Lodash Camel Case Function.',
	overview: ({ text }) => [
		{
			label: 'Text',
			text: text,
		},
	],
	options: [
		{
			field: 'text',
			name: 'Text',
			type: 'string',
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
import { defineOperationApi } from '@directus/extensions-sdk';
import { camelCase } from 'lodash';

export default defineOperationApi({
	id: 'operation-lodash-camelcase',
	handler: ({ text }) => {
		return {
			text: camelCase(text),
		};
	},
});
```
