---
description: Build your first custom layout extension.
contributors: Tim Butterfield, Kevin Lewis
---

# Create Your First Layout Extension

Layouts are used to query your collection and visualize the data in a meaningful way. This guide will provide you with
the skills to create custom layouts that will utilize the built-in API and UI functions to query the current collection
and output the results.

## Install Dependencies

Open a console to your preferred working directory and initialize a new extension, which will create the boilerplate
code for your interface.

```shell
npx create-directus-extension@latest
```

A list of options will appear (choose layout), and type a name for your extension (for example,
`directus-layout-example`). For this guide, select JavaScript.

Now that the boilerplate has been created, open the directory in your code editor.

## Build the Structure

Open the extension directory that was created in the previous steps then open the directory called `src`. This is where
the source code is located - `index.js` and `layout.vue`. Any new files that are required, must go in this directory.

This layout will currently only load an empty page with the title “Custom Layout” followed by the name of the collection
that you have assigned this custom layout to.

![A mostly-empty layout that reads "name: custom layout, collection: test"](https://marketing.directus.app/assets/96f01ff4-0574-4388-8060-5ca598744648)

In most cases, a layout will visualize the data within a collection. This guide will show you how to fetch records with
the internal API and render them on the page.

## Access Data Using Internal APIs

To start interacting with Directus, you will need to import various functions that will bridge the gap between the empty
page and the data.

Open the `index.js` file and change the id to a unique value. This is usually your layout name such as example-layout.
Then, change the `name` of the layout. This is visible in the list of layout options when changing a collection’s
layout. If you want to change the icon, use the material-icons library to find the name of the icon and replace it in
this file.

Import the `useItems` and `useCollection` stores to this file by importing the functions from the Directus Extensions
SDK. Add the following line underneath the ref import from vue and include `toRefs` from vue.

```js
import { toRefs } from 'vue';
import { useItems, useCollection } from '@directus/extensions-sdk';
```

In the `setup()` method, copy and paste the following code which defines all the constants needed to fetch the items for
the current collection and uses the built-in search and filters from the Directus UI.

```js
const { collection, filter, search } = toRefs(props);
const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

const { items, loading, error } = useItems(collection, {
	sort: primaryKeyField.field,
	limit: '-1',
	fields: fieldsInCollection,
	filter,
	search,
});
```

_Note the parameters being set in `useItems()`. Change this to suit your needs._

Return the constants so they can be used in the layout. Add the following underneath the constants:

```js
return {
	info,
	primaryKeyField,
	items,
	loading,
	filter,
	search,
	fieldsInCollection,
	error,
};
```

Lastly, add props inside the setup brackets to give us access to the layout properties such as `collection`, `search`
and `filters`.

```js
setup() { // [!code --]
setup(props) { // [!code ++]
```

## Set Up the Vue Component

The `layout.vue` file is where you will build the output of the layout using Vue.js. Before you can start on the HTML,
there are a few changes needed in the JavaScript.

To use the data that is passed to this template, the variables must be declared in the `props`. Add the following to the
object:

```js
items: Array,
loading: Boolean,
error: Array,
search: {
	type: String,
	default: null,
},
```

### Render Data

Update the `template`:

```vue
<template>
	<div v-if="!loading">
		<p>Collection: {{ collection }}</p>

		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Email</th>
					<th>&nbsp;</th>
				</tr>
			</thead>
			<tbody>
			</tbody>
		</table>
	</div>
</template>
```

Within the `<tbody>`, you must output my array of items using a for loop on a `<tr>` tag. The table row will be repeated
for each item.

```html
<tbody>
	<tr v-for="item in items" :key="item.id"> // [!code ++]
		<td>{{ item.name }}</td> // [!code ++]
		<td>{{ item.email }}</td> // [!code ++]
		<td><a :href="`/content/${collection}/${item.id}`">View Details</a></td> // [!code ++]
	</tr> // [!code ++]
</tbody>
```

The third column contains a link to view the details of the record.

Build the interface with the latest changes.

```
npm run build
```

## Add Layout To Directus

When Directus starts, it will look in the `extensions` directory for any subdirectory starting with
`directus-extension-`, and attempt to load them.

To install an extension, copy the entire directory with all source code, the `package.json` file, and the `dist`
directory into the Directus `extensions` directory. Make sure the directory with your extension has a name that starts
with `directus-extension`. In this case, you may choose to use `directus-extension-layout-example`.

Restart Directus to load the extension.

:::info Required files

Only the `package.json` and `dist` directory are required inside of your extension directory. However, adding the source
code has no negative effect.

:::

## Use The Layout

To use your new layout in Directus, you will need a table that already contains the fields `id`, `name` and `email`:

1. Open a collection
2. If the right side menu is closed, click on the Layout Options icon.
3. Click on the dropdown and choose your new layout from the list.

![Two screenshots. On the left is the layout dropdown showing that custom layout is selected. On the right is the table showing data from the layout.](https://marketing.directus.app/assets/ef0c6c19-ef1d-45bd-a66d-df8f581b98a4)

## Summary

You have created a custom layout which uses the built-in functions to fetch all items for the current collection and
provide search and filter options. Spend time designing the output of your layout to suit your needs. Use your browser’s
development console to see how the API is called.

## Complete Code

`index.js`

```js
import { toRefs } from 'vue';
import { useItems, useCollection } from '@directus/extensions-sdk';
import LayoutComponent from './layout.vue';

export default {
	id: 'timio23-custom-layout',
	name: 'Custom Layout',
	icon: 'box',
	component: LayoutComponent,
	slots: {
		options: () => null,
		sidebar: () => null,
		actions: () => null,
	},
	setup(props) {
		const { collection, filter, search } = toRefs(props);
		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const { items, loading, error } = useItems(collection, {
			sort: primaryKeyField.field,
			limit: '-1',
			fields: '*',
			filter,
			search,
		});

		return {
			info,
			primaryKeyField,
			items,
			loading,
			filter,
			search,
			fieldsInCollection,
			error,
		};
	},
};
```

`layout.vue`

```vue
<template>
	<div v-if="!loading">
		<p>Collection: {{ collection }}</p>

		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Email</th>
					<th>&nbsp;</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="item in items" :key="item.id">
					<td>{{ item.name }}</td>
					<td>{{ item.email }}</td>
					<td><a :href="`/content/${collection}/${item.id}`">View Details</a></td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script>
export default {
	inheritAttrs: false,
	props: {
		collection: {
			type: String,
			required: true,
		},
		items: Array,
		loading: Boolean,
		error: Array,
		search: {
			type: String,
			default: null,
		},
	}
};
</script>
```
