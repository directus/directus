---
description: Learn how to create a display extension to summarize relational data.
contributors: Tim Butterfield, Kevin Lewis
---

# Use Displays To Summarize Relational Items

Displays provide a meaningful way for users to consume data. This guide will show you how to create a display that
queries another table and returns the `SUM` or `COUNT` of a column.

![In a table, a new field called 'Test Junction' is shown. The values are '5 items' and '2 items'.](https://marketing.directus.app/assets/c1965f6c-dfa3-461a-bda9-e3767f9d40be)

## Install Dependencies

Open a console to your preferred working directory and initialize a new extension, which will create the boilerplate
code for your display.

```shell
npx create-directus-extension@latest
```

A list of options will appear (choose display), and type a name for your extension (for example,
`directus-display-sum-count`). For this guide, select JavaScript.

Now the boilerplate has been created, open the directory in your code editor.

## Specify Configuration

Displays have 2 parts, the `index.js` configuration file, and the `display.vue` view. The first part allows you to
configure options and the appearance when selecting the display for a field.

Open the `index.js` file and update the existing information relevant to this display. Since you are working with
relational fields, you need to change `types` value and add `localTypes` as well. This will ensure this display will
only be available for relational fields.

```js
import DisplayComponent from './display.vue';
import { useStores } from '@directus/extensions-sdk';

export default {
	id: 'directus-display-count-sum',
	name: 'Count or Sum a Column',
	icon: '123',
	description: 'Count the related records or display the sum of the select column',
	component: DisplayComponent,
	options: null,
	types: ['alias', 'string', 'uuid', 'integer', 'bigInteger', 'json'],
	localTypes: ['m2m', 'm2o', 'o2m', 'translations', 'm2a', 'file', 'files'],
	fields: (options) => {
		return [];
	},
};
```

Make sure the `id` is unique between all extensions including ones created by 3rd parties - a good practice is to
include a professional prefix. You can choose an icon from the library [here](https://fonts.google.com/icons).

With the information above, the display will appear in the list like this:

![A new display option is shown - Related Values.](https://marketing.directus.app/assets/128e9282-a988-4e8f-9775-ec6cfe208525)

Currently the options object is `null`. To provide the option to include months, update the `options` object with the
following code:

```js
options: null, // [!code --]
options: ({ editing, relations }) => { // [!code ++]
	return []; // [!code ++]
}, // [!code ++]
```

Before the `options` `return` value, add the following constants to retrieve the related collection and the field store
and determine if the related collection uses a junction table:

```js
const relatedCollection =
	relations.o2m?.meta.junction_field != null ? relations.m2o?.related_collection : relations.o2m?.collection;

const junction_table = relations.o2m?.meta.junction_field != null ? relations.o2m?.collection : null;
const { useFieldsStore } = useStores();
const fieldsStore = useFieldsStore();
```

After the constants, add an `if` statement to disable the field selection dropdown while the relational field is still
being created. The variable called `editing` was included in the function which will equal `+` during this state. Use
the `presentation-notice` interface to display a message while this display is unavailable.

```js
if (editing === '+') {
	const fieldSelection = {
		interface: 'presentation-notice',
		options: {
			text: 'Please complete the field before attempting to configure the display.',
		},
		width: 'full',
	};
} else {
}
```

In the `else` block, use the `fieldStore` to fetch all the fields from the related collection into the `field_choices`
array, then create a selection dropdown interface with the choices set to `field_choices`:

```js
if (editing === '+') {
} else {
	const fields = fieldsStore.getFieldsForCollection(relatedCollection); // [!code ++]
	const field_choices = []; // [!code ++]
// [!code ++]
	fields.forEach((field) => { // [!code ++]
		field_choices.push({ // [!code ++]
			text: field.meta.field, // [!code ++]
			value: junction_table ? `${relations.o2m.meta.junction_field}.${field.meta.field}` : field.meta.field, // [!code ++],
		}); // [!code ++]
	}); // [!code ++]
// [!code ++]
	const fieldSelection = { // [!code ++]
		interface: 'select-dropdown', // [!code ++]
		options: { // [!code ++]
			choices: field_choices, // [!code ++]
		}, // [!code ++]
		width: 'full', // [!code ++]
	}; // [!code ++]
}
```

Inside the returned array, output all of the options to use with this display. For the field called `column`, set meta
to `fieldSelection`. The rest can be added as normal.

```js
return [
	{
		field: 'column',
		name: 'Choose a column',
		meta: fieldSelection,
	},
	{
		field: 'sum',
		type: 'boolean',
		name: 'Calculate Sum',
		meta: {
			interface: 'boolean',
			options: {
				label: 'Yes',
			},
			width: 'half',
		},
	},
	{
		field: 'prefix',
		type: 'string',
		name: 'Prefix',
		meta: {
			interface: 'input',
			options: {
				font: 'monospace',
			},
			width: 'half',
		},
	},
	{
		field: 'suffix',
		type: 'string',
		name: 'Suffix',
		meta: {
			interface: 'input',
			options: {
				font: 'monospace',
			},
			width: 'half',
		},
	},
];
```

Now that options are set up, use the `options.column` to set the scope for the fields at the very bottom of this script.
This section determines what fields are included in the `props.value`. For example, if you set this to `['*']`, all the
fields for the related collection will be included. For best performance, set this to the field chosen in the options.

```js
fields: (options) => {
    return [];  // [!code --]
    return [options.column] // [!code ++]
},
```

Note, displays will fetch related collection values for each row on the page. Fetching more that you need will impact
the performance of Directus.

Here is a preview of how this appears in Directus:

![New display options showing a select field for column, a checkbox for calculate sum, and text fields for prefix and suffix.](https://marketing.directus.app/assets/1ac7ce81-f5ae-43a7-a1a1-18590fdfa404)

## Build the View

The `display.vue` file contains the barebones code required for a display to work. The value is imported in the `props`
section, then output in the template:

```vue
<template>
	<div>Value: {{ value }}</div>
</template>

<script>
export default {
	props: {
		value: {
			type: String,
			default: null,
		},
	},
};
</script>
```

Before the export, import the vue `ref` object:

```js
import { ref } from 'vue';
```

Import the new display options in the `props` object:

```js
props: {
	value: {
		type: String,
		default: null,
	},
	column: { // [!code ++]
		type: String, // [!code ++]
		default: null, // [!code ++]
	}, // [!code ++]
	sum: { // [!code ++]
		type: Boolean, // [!code ++]
		default: false, // [!code ++]
	}, // [!code ++]
	prefix: { // [!code ++]
		type: String, // [!code ++]
		default: null, // [!code ++]
	}, // [!code ++]
	suffix: { // [!code ++]
		type: String, // [!code ++]
		default: null, // [!code ++]
	}, // [!code ++]
},
```

Create a `setup` section after the `props` and include the following code:

```js
setup(props) {
	const calculatedValue = ref(0);

	if(props.sum){
		props.value.forEach(item => {
			const columns = props.column.split('.');

			columns.forEach(col => {
				item = item[col];
			});

			calculatedValue.value = calculatedValue.value + parseFloat(item);
		});
	} else {
		calculatedValue.value = props.value.length;
	}

	return { calculatedValue };
},
```

This code calculates the sum or count of the chosen column. The `props.value` will contain an array of objects with the
fields defined in the scope. Make sure to return the constant at the bottom.

Update the template to use the `calculateValue` constant, `prefix` and `suffix` instead of the direct value.

```vue
<template>
	<div>Value: {{ value }}</div> // [!code --]
	<div v-if="calculatedValue">{{ prefix }}{{ calculateValue }}{{ suffix }}</div> // [!code ++]
	<value-null v-else /> // [!code ++]
</template>
```

Build the display with the latest changes.

```
npm run build
```

## Add Display to Directus

When Directus starts, it will look in the `extensions` directory for any subdirectory starting with
`directus-extension-`, and attempt to load them.

To install an extension, copy the entire directory with all source code, the `package.json` file, and the `dist`
directory into the Directus `extensions` directory. Make sure the directory with your extension has a name that starts
with `directus-extension`. In this case, you may choose to use `directus-extension-display-sum-count`.

Restart Directus to load the extension.

:::info Required files

Only the `package.json` and `dist` directory are required inside of your extension directory. However, adding the source
code has no negative effect.

:::

## Use the Display

Now the display will appear in the list of available displays for relational fields. Follow these steps to use the new
display:

1. Create a new relational field and select your new display from the list.
2. After saving the new field, edit the field to configure the display and populate the fields as needed.
3. Save changes and add some data to the table. You will see the relational fields at work in the layout.

![In a table, a new field called 'Test Junction' is shown. The values are '5 items' and '2 items'.](https://marketing.directus.app/assets/c1965f6c-dfa3-461a-bda9-e3767f9d40be)

## Summary

With this display, you have learned how to interact with relational fields and values for a display and use options to
customize the output. Be mindful of how much processing is happening inside a display because it will run for every
single row in the table and will impact the performance of Directus.

## Complete Code

`index.js`

```js
import DisplayComponent from './display.vue';
import { useStores } from '@directus/extensions-sdk';

export default {
	id: 'directus-display-count-sum',
	name: 'Count or Sum Column',
	icon: '123',
	description: 'Count the related records or display the sum of the select column',
	component: DisplayComponent,
	options: ({ editing, relations }) => {
		const relatedCollection =
			relations.o2m?.meta.junction_field != null ? relations.m2o?.related_collection : relations.o2m?.collection;

		const junction_table = relations.o2m?.meta.junction_field != null ? relations.o2m?.collection : null;
		const { useFieldsStore } = useStores();
		const fieldsStore = useFieldsStore();

		let displayTemplateMeta;

		if (editing === '+') {
			 displayTemplateMeta = {
				interface: 'presentation-notice',
				options: {
					text: 'Please complete the field before attempting to configure the display.',
				},
				width: 'full',
			};
		} else {
			const fields = fieldsStore.getFieldsForCollection(relatedCollection);
			const field_choices = [];

			fields.forEach((field) => {
				field_choices.push({
					text: field.meta.field,
					value: junction_table ? `${relations.o2m.meta.junction_field}.${field.meta.field}` : field.meta.field,
				});
			});

			 displayTemplateMeta = {
				interface: 'select-dropdown',
				options: {
					choices: field_choices,
				},
				width: 'full',
			};
		}

		return [
			{
				field: 'column',
				name: 'Choose a column',
				meta: displayTemplateMeta,
			},
			{
				field: 'sum',
				type: 'boolean',
				name: 'Calulate Sum',
				meta: {
					interface: 'boolean',
					options: {
						label: 'Yes',
					},
					width: 'half',
				},
			},
			{
				field: 'prefix',
				type: 'string',
				name: 'Prefix',
				meta: {
					interface: 'input',
					options: {
						font: 'monospace',
					},
					width: 'half',
				},
			},
			{
				field: 'suffix',
				type: 'string',
				name: 'Suffix',
				meta: {
					interface: 'input',
					options: {
						font: 'monospace',
					},
					width: 'half',
				},
			},
		];
	},
	types: ['alias', 'string', 'uuid', 'integer', 'bigInteger', 'json'],
	localTypes: ['m2m', 'm2o', 'o2m', 'translations', 'm2a', 'file', 'files'],
	fields: (options) => {
		return [options.column];
	},
};
```

`display.vue`

```vue
<template>
	<div v-if="calculatedValue">{{ prefix }}{{ calculatedValue }}{{ suffix }}</div>
	<value-null v-else />
</template>

<script>
import { ref } from 'vue';
export default {
	props: {
		value: {
			type: Object,
			default: null,
		},
		column: {
			type: String,
			default: null,
		},
		sum: {
			type: Boolean,
			default: false,
		},
		prefix: {
			type: String,
			default: null,
		},
		suffix: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const calculatedValue = ref(0);

		if(props.sum){
			props.value.forEach(item => {
				const columns = props.column.split('.');

				columns.forEach(col => {
					item = item[col];
				});

				calculatedValue.value = calculatedValue.value + parseFloat(item);
			});
		} else {
			calculatedValue.value = props.value.length;
		}

		return { calculatedValue };
	},
};
</script>
```
