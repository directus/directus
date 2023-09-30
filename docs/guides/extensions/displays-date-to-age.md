---
description: Learn how to create a display extension to format an item value.
contributors: Tim Butterfield, Kevin Lewis
---

# Use Displays To Format Date As An Age

Displays provide a meaningful way for users to consume data. This guide will show you how to create a display to change
a date of birth to the current age in years and months.

![A table of data is shown with a value reading '22 years 10 months'](https://marketing.directus.app/assets/7d58a582-ace9-47fe-848e-437fa29fe868)

## Install Dependencies

Open a console to your preferred working directory and initialize a new extension, which will create the boilerplate
code for your display.

```shell
npx create-directus-extension@latest
```

A list of options will appear (choose display), and type a name for your extension (for example,
`directus-display-age`). For this guide, select JavaScript.

Now the boilerplate has been created, open the directory in your code editor.

## Specify Configuration

Displays have 2 parts, the `index.js` configuration file, and the `display.vue` view. The first part allows you to
configure options and the appearance when selecting the display for a field.

Open the `index.js` file and update the existing information relevant to this display. Since you are working with dates
and not datetime or strings, you need to change types to `date`. This will ensure this display will only be available if
the field is a date.

```js
import DisplayComponent from './display.vue';

export default {
	id: 'directus-display-age',
	name: 'Display Age',
	icon: 'calendar_month',
	description: 'Display the current age from the date of birth',
	component: DisplayComponent,
	options: null,
	types: ['date'],
};
```

Make sure the `id` is unique between all extensions including ones created by 3rd parties - a good practice is to
include a professional prefix. You can choose an icon from the library [here](https://fonts.google.com/icons).

With the information above, the display will appear in the list like this:

![A new display option is shown - Datetime.](https://marketing.directus.app/assets/3cd68dc3-95ee-4eef-a3c6-17ddaca7aa09)

Currently the options object is `null`. To provide the option to include months, replace the `options` value with the
following object:

```js
options: [
	{
		field: 'show_months',
		type: 'boolean',
		name: 'Show months as well',
		meta: {
			interface: 'boolean',
			options: {
				label: 'Yes',
			},
			width: 'half',
		},
	},
],
```

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

Import the `boolean` needed to toggle the months value in the `props` object:

```js
props: {
	value: {
		type: String,
		default: null,
	},
	show_months: { // [!code ++]
		type: Boolean, // [!code ++]
		default: false, // [!code ++]
	}, // [!code ++]
},
```

Import `date-fns` to manipulate dates in JavaScript. Add the following line above the export:

```js
import { differenceInYears, intervalToDuration, parseISO } from 'date-fns';
```

Create a function to change the date of birth into the person's age and make it available to the template. Create a
`setup` section after the `props` and include the following code:

```js
setup(props) {
	function calculateAge() {
		if (props.show_months) {
			const { years, months } = intervalToDuration({ start: parseISO(props.value), end: new Date() });
			return `${years} years ${months} months`;
		} else {
			const age = differenceInYears(new Date(), parseISO(props.value));
			return `${age} years`;
		}
	}

	return calculateAge;
},
```

This will parse the date into the required format, then check the distance between that date and now. The result is
formatted into a string with the suffix years (and months if enabled).

Update the template to use the `calculateAge` function instead of the direct value:

```vue
<template>
	<div>Value: {{ value }}</div> // [!code --]
	<div>{{ calculateAge() }}</div> // [!code ++]
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
with `directus-extension`. In this case, you may choose to use `directus-extension-display-age`.

Restart Directus to load the extension.

:::info Required files

Only the `package.json` and `dist` directory are required inside of your extension directory. However, adding the source
code has no negative effect.

:::

## Use the Display

Now the display will appear in the list of available displays for a date field. To test, create a new date field and
select this display from the list and make sure to add some data. The results will appear in the layout if you have that
column showing.

![Display age settings showing a checkbox to display months](https://marketing.directus.app/assets/78da9218-2c6e-4356-860c-9fe713081c45)

![A table of data is shown with a value reading '22 years 10 months'](https://marketing.directus.app/assets/7d58a582-ace9-47fe-848e-437fa29fe868)

## Summary

With this display, you have learned how to use a boolean field to configure a display, then create a function to
transform the value using an imported package. Be mindful how much processing is happening inside a display because it
will run for every single row in the table.

## Complete Code

`index.js`

```js
import DisplayComponent from './display.vue';

export default {
	id: 'directus-display-age',
	name: 'Display Age',
	icon: 'calendar_month',
	description: 'Display the current age from the date of birth',
	component: DisplayComponent,
	options: [
		{
			field: 'show_months',
			type: 'boolean',
			name: 'Show Months as well',
			meta: {
				interface: 'boolean',
				options: {
					label: 'Yes',
				},
				width: 'half',
			},
		},
	],
	types: ['date'],
};
```

`display.vue`

```vue
<template>
	<div>{{ calculateAge() }}</div>
</template>

<script>
import { differenceInYears, intervalToDuration, parseISO } from 'date-fns';
export default {
	props: {
		value: {
			type: String,
			default: null,
		},
		show_months: {
			type: Boolean,
			default: false,
		}
	},
	setup(props){
		function calculateAge(){
			if(props.show_months){
				const { years, months } = intervalToDuration({ start: parseISO(props.value), end: new Date()});
				return `${years} years ${months} months`;
			} else {
				const age = differenceInYears(new Date(), parseISO(props.value));
				return `${age} years`;
			}
		}

		return calculateAge;
	},
};
</script>
```
