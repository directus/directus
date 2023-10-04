---
description: Learn how to create a custom searchable dropdown with items from another collection.
contributors: Tim Butterfield, Kevin Lewis
---

# Create A Searchable Dropdown With Items From Another Collection

Interfaces provide a meaningful way for users to provide data. This guide will show you how to create a dropdown menu
that is searchable for data from another collection.

![A dropdown showing a number of values](https://marketing.directus.app/assets/46b4070d-fd77-4ee3-b08b-654519dda031)

## Install Dependencies

Open a console to your preferred working directory and initialize a new extension, which will create the boilerplate
code for your interface.

```shell
npx create-directus-extension@latest
```

A list of options will appear (choose interface), and type a name for your extension (for example,
`directus-interface-m2o-searchable-dropdown`). For this guide, select JavaScript.

Now the boilerplate has been created, open the directory in your code editor.

## Specify Configuration

Interfaces have 2 parts, the `index.js` configuration file, and the `interface.vue` view. The first part is defining
what information you need to render the interface in the configuration.

```js
import InterfaceSelectDropdownM2O from './interface.vue';

export default {
	id: 'm2o-searchable-dropdown',
	name: 'M2O Searchable Dropdown',
	type: 'interface',
	description: 'A dropdown field with the ability to search the contents of another collection',
	icon: 'arrow_drop_down_circle',
	component: InterfaceSelectDropdownM2O,
	options: null,
	types: ['uuid', 'string', 'text', 'integer', 'bigInteger'],
	localTypes: ['m2o'],
	group: 'relational',
	relational: true,
	recommendedDisplays: ['related-values'],
};
```

Make sure the `id` is unique between all extensions including ones created by 3rd parties - a good practice is to
include a professional prefix. You can choose an icon from the library [here](https://fonts.google.com/icons).

The value of `types` will need to account for the different possibilities of id fields. Sometimes this will be an INT or
BIGINT when using incremental IDs, or this could be GUID which is stored as a `String` or `UUID`.

`localTypes` is unique to relational fields. Some interfaces can have `o2m` and `m2o`. This interface can only be used
for `m2o`. `group` will allow us to add this interface alongside other relational interfaces.

Setting `relational: true` will force Directus to only offer this interface on a relational field. Finally,
`recommendedDisplays` are a way of pinning one or more displays to the top of the list when the user is setting up the
field.

Currently the options object is `null`. An interface can have a set customization options - here, the user must provide
the field to display and search. For this guide, use `system-display-template` which is the built-in field selector.

```js
options: ({ relations }) => {
	const collection = relations.m2o?.related_collection;
	return [
		{
			field: 'template',
			name: 'Field to Show',
			meta: {
				interface: 'system-display-template',
				options: {
					collectionName: collection,
				},
				width: 'half',
			},
		},
	];
},
```

Add a `placeholder` field to allow the user to add their own placeholder. Make sure to place this within the return list
alongside the template field:

```js
{
	field: 'placeholder',
	type: 'string',
	name: 'Placeholder',
	meta: {
		interface: 'input',
		width: 'half',
		options: {
			placeholder: 'Enter a placeholder',
		},
	},
},
```

When using data from another collection, sometimes it is useful to include the ability to filter the usable data. Use
the following to add the built-in filter builder.

```js
{
	field: 'filter',
	name: '$t:filter',
	type: 'json',
	meta: {
		interface: 'system-filter',
		options: {
			collectionName: collection,
		},
	},
},
```

## Build the View

The `interface.vue` file contains the barebones code required for an interface to work. Import dependencies from Vue and
the Directus Extensions SDK right before `export default`:

```js
import { ref, computed } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';
```

Inside the `props` object, add the following fields:

```js
props: {
	field: {
		type: String,
		required: true,
	},
	collection: {
		type: String,
		required: true,
	},
	value: {
		type: [String, Number],
		default: null,
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	placeholder: {
		type: String,
		default: 'Select an item',
	},
	template: {
		type: String,
		default: 'name',
	},
	filter: {
		type: Object,
		default: null,
	},
},
```

- `field` is the current field that is using the interface. This is defined by the user when setting up their
  collection. You will need the field variable to read and write the value.
- `collection` is the name given to the table, this is also required when reading and writing the value.
- `value` is the current value for this field. In a new record this will be null. For existing records, you will need
  this variable to show what option is selected.

The `placeholder`, `template`, and `filter` properties were defined in the `index.js` file.

In the `setup` method, include `props` and `emit`. Add the following constants to gather all the functions and
information that are needed:

```js
emits: ['input'],
setup(props, { emit }) {
	const api = useApi();
	const { useCollectionsStore, useRelationsStore, useFieldsStore } = useStores();
	const collectionsStore = useCollectionsStore();
	const relationsStore = useRelationsStore();
	const fieldsStore = useFieldsStore();
	const { relatedCollection } = useRelation();
	const displayField = props.template.replace('{{','').replace('}}','');

	const primaryKey = fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection.value.collection);

	let awaitingSearch = false;
	const results = ref([]);
	const searchQuery = ref('');

	// Further code here
},
```

Create a function to fetch the results from the relational collection using the code below. This will use the imported
API to make a query on the related collection, then save the response into the `results` constant.

If a value is already saved to this field, this will also query the related collection for the information to output to
the user.

```js
async function fetchResults() {
	try {
		const response = await api.get(`/items/${relatedCollection.value.collection}`, {
			params: {
				limit: -1,
				filter: props.filter,
				search: searchQuery.value && searchQuery.value != props.value ? searchQuery.value : '',
			},
		});

		results.value = response.data.data;

		if (props.value != null && searchQuery.value == '') {
			const fetchName = await api.get(`/items/${relatedCollection.value.collection}/${props.value}`);
			searchQuery.value = outputFields(fetchName.data.data);
		}
	} catch (err) {
		console.warn(err);
	}
}

fetchResults();
```

This function must run as soon as the record is opened, so be sure to call it immediately after it's defined, inside of
the `setup` function.

To be able to use the information gathered here, return the functions and constants. Add the following line at the
bottom of `setup`:

```js
return { results, setDropdown, searchQuery, displayField, onInput, primaryKey, outputFields };
```

_Note: there are some returned functions that haven't been created yet._

Below the return statement, add the following functions:

```js
// Iterates over keys and values inside provided item, then replaces the template with the corresponding values.
function outputFields(item) {
	var displayTemplate = props.template;
	var replace = '';

	Object.keys(item).forEach((key) => {
		replace = '{{' + key + '}}';
		displayTemplate = displayTemplate.replace(replace, item[key]);
	});

	return displayTemplate;
}

// Prevents API calls until the user has stopped typing for half a second. The delay can be changed to suit your needs.
function onInput() {
	if (!awaitingSearch.value) {
		setTimeout(() => {
			fetchResults();
			awaitingSearch.value = false;
		}, 500); // 0.5 sec delay
	}

	awaitingSearch.value = true;
}

// Saves the selected item to the field and change the value inside the dropdown to the selected item. Call fetchResults again to rebuild the dropdown and allow a different selection.
function setDropdown(item) {
	if (item == null) {
		searchQuery.value = item;
		props.value = item;
		emit('input', item);
	} else {
		searchQuery.value = outputFields(item);
		props.value = item[primaryKey.field];
		emit('input', item[primaryKey.field]);
	}

	fetchResults();
}

// Fetch the related collection’s name and its fields.
function useRelation() {
	const relation = computed(() => {
		return relationsStore.getRelationsForField(props.collection, props.field)?.[0];
	});

	const relatedCollection = computed(() => {
		if (!relation.value?.related_collection) return null;
		return collectionsStore.getCollection(relation.value.related_collection);
	});

	return { relatedCollection };
}
```

### Create the Template

Inside the `template` tag, add the following code which uses Directus' provided components. For the `v-input`, pass the
`searchQuery`, `disabled` and `placeholder` values and include the `onInput` function on the `@update:model-value`
event.

There is also a `v-icon` to prompt the user to dropdown the field and close the dropdown when open.

```vue
<v-menu attached :disabled="disabled" :close-on-content-click="true">
	<template #activator="{ active, activate }">
		<v-input
			v-model="searchQuery"
			:disabled="disabled"
			:placeholder="placeholder"
			:class="{ 'has-value': value }"
			:nullable="false"
			@focus="activate"
			@update:model-value="onInput"
		>
			<template #append>
				<v-icon v-if="value !== null" clickable name="close" @click="setDropdown(null)" />
				<v-icon
					v-else
					clickable
					name="expand_more"
					class="open-indicator"
					:class="{ open: active }"
					@click="activate"
				/>
			</template>
		</v-input>
	</template>

	<!-- Further code here -->
</v-menu>
```

Replace the comment inside the `v-menu` with the following content. This uses built-in components called `v-list` and
`v-list-item`.

```vue
<div class="content" :class="width">
	<v-list class="list">
		<template>
			<v-list-item @click="$emit('input', null)" :disabled="value === null">
				<v-list-item-content>Deselect</v-list-item-content>
				<v-list-item-icon>
					<v-icon name="close" />
				</v-list-item-icon>
			</v-list-item>
			<v-divider />
		</template>

		<v-list-item
			v-for="(item, index) in results"
			:key="item[primaryKey.field] + index"
			:active="value === item[primaryKey.field]"
			:disabled="item.disabled"
			@click="setDropdown(item)"
		>
			<v-list-item-content>
				<span class="item-text">{{ outputFields(item) }}</span>
			</v-list-item-content>
		</v-list-item>
	</v-list>
</div>
```

The first list item is a deselection option to null the field, followed by a list item loop. Inside the loop is the list
item content where `outputFields` is called to render the template with values.

The click event on the list items calls the function called `setDropdown`. This assigns the value to this field and
closes the dropdown.

Build the interface with the latest changes.

```
npm run build
```

## Add Interface to Directus

When Directus starts, it will look in the `extensions` directory for any subdirectory starting with
`directus-extension-`, and attempt to load them.

To install an extension, copy the entire directory with all source code, the `package.json` file, and the `dist`
directory into the Directus `extensions` directory. Make sure the directory with your extension has a name that starts
with `directus-extension`. In this case, you may choose to use `directus-extension-interface-m2o-searchable-dropdown`.

Restart Directus to load the extension.

:::info Required files

Only the `package.json` and `dist` directory are required inside of your extension directory. However, adding the source
code has no negative effect.

:::

## Use the Interface

The interface will appear in the list of available interfaces. Create a new field and select the interface from the list
and create options.

![An interface configuration showing the new M2O Dropdown with Search option](https://marketing.directus.app/assets/95195049-82f4-4494-8ed7-9a1a2dcd184d)

## Summary

With this interface, you have learned how to use input fields to configure your interface, including display template,
standard input and a filter builder. You also learned how to fetch data from the related collection, emitting values to
the database and use built-in components to easily build the interactive field.

## Complete Code

`index.js`

```js
import InterfaceSelectDropdownM2O from './interface.vue';

export default {
	id: 'select-dropdown-m2o-search',
	name: 'M2O Dropdown with Search',
	icon: 'arrow_drop_down_circle',
	description: 'Show options from API',
	component: InterfaceSelectDropdownM2O,
	types: ['uuid', 'string', 'text', 'integer', 'bigInteger'],
	localTypes: ['m2o'],
	group: 'relational',
	relational: true,
	options: ({ relations }) => {
		const collection = relations.m2o?.related_collection;
		console.log(collection);
		return [
			{
				field: 'template',
				name: 'Field to Show',
				meta: {
					interface: 'system-display-template',
					options: {
						collectionName: collection,
					},
					width: 'half',
				},
			},
			{
				field: 'placeholder',
				type: 'string',
				name: 'Placeholder',
				meta: {
					interface: 'input',
					width: 'half',
					options: {
						placeholder: 'Enter a placeholder',
					},
				},
			},
			{
				field: 'filter',
				name: '$t:filter',
				type: 'json',
				meta: {
					interface: 'system-filter',
					options: {
						collectionName: collection,
					},
				},
			},
		];
	},
	recommendedDisplays: ['related-values'],
};
```

`interface.vue`

```vue
<template>
	<v-menu attached :disabled="disabled" :close-on-content-click="true">
		<template #activator="{ active, activate }">
			<v-input
				v-model="searchQuery"
				:disabled="disabled"
				:placeholder="placeholder"
				:class="{ 'has-value': value }"
				:nullable="false"
				@focus="activate"
				@update:model-value="onInput"
			>
				<template #append>
					<v-icon v-if="value !== null" clickable name="close" @click="setDropdown(null)" />
					<v-icon
						v-else
						clickable
						name="expand_more"
						class="open-indicator"
						:class="{ open: active }"
						@click="activate"
					/>
				</template>
			</v-input>
		</template>

		<div class="content" :class="width">
			<v-list class="list">
				<v-list-item :disabled="value === null" @click="$emit('input', null)">
					<v-list-item-content>Deselect</v-list-item-content>
					<v-list-item-icon>
						<v-icon name="close" />
					</v-list-item-icon>
				</v-list-item>
				<v-divider />

				<v-list-item
					v-for="(item, index) in results"
					:key="item[primaryKey.field] + index"
					:active="value === item[primaryKey.field]"
					:disabled="disabled"
					@click="setDropdown(item)"
				>
					<v-list-item-content>
						<span class="item-text">{{ outputFields(item) }}</span>
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</div>
	</v-menu>
</template>

<script lang="ts">
import { ref, computed } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';
export default {
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		value: {
			type: [String, Number],
			default: null,
		},
		placeholder: {
			type: String,
			default: 'Select an item',
		},
		template: {
			type: String,
			default: 'name',
		},
		width: {
			type: String,
			required: true,
		},
		filter: {
			type: Object,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const api = useApi();
		const { useCollectionsStore, useRelationsStore, useFieldsStore } = useStores();
		const collectionsStore = useCollectionsStore();
		const relationsStore = useRelationsStore();
		const fieldsStore = useFieldsStore();
		const { relatedCollection } = useRelation();
		const displayField = props.template.replace('{{','').replace('}}','');

		const primaryKey = fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection.value.collection);

		let awaitingSearch = false;
		const results = ref([]);
		const searchQuery = ref('');

		async function fetchResults(){
			try {
				const response = await api.get(
					`/items/${relatedCollection.value.collection}`, {
						params: {
							limit: -1,
							filter: props.filter,
							search: (searchQuery.value && searchQuery.value != props.value?searchQuery.value:''),
						},
					}
				);

				results.value = response.data.data;

				if(props.value != null && searchQuery.value == ''){
					const fetchName = await api.get(`/items/${relatedCollection.value.collection}/${props.value}`);
					searchQuery.value = outputFields(fetchName.data.data);
				}
			} catch (err) {
				console.warn(err);
			}
		}

		fetchResults();

		return { results, setDropdown, searchQuery, displayField, onInput, primaryKey, outputFields };

		function outputFields(item){
			let displayTemplate = props.template;
			let replace = '';

			Object.keys(item).forEach(key => {
				replace = '{{'+key+'}}';
				displayTemplate = displayTemplate.replace(replace,item[key]);
			});

			return displayTemplate;
		}

		function onInput() {
			if (!awaitingSearch) {
				setTimeout(() => {
					fetchResults();
					awaitingSearch = false;
				}, 500); // 0.5 sec delay
			}

			awaitingSearch = true;
		}

		function setDropdown(item) {
			if(item == null){
				searchQuery.value = item;
				emit('input', item);
			} else {
				searchQuery.value = outputFields(item);
				emit('input', item[primaryKey.field]);
			}

			fetchResults();
		}

		function useRelation() {
			const relation = computed(() => {
				return relationsStore.getRelationsForField(props.collection, props.field)?.[0];
			});

			const relatedCollection = computed(() => {
				if (!relation.value?.related_collection) return null;
				return collectionsStore.getCollection(relation.value.related_collection);
			});

			return { relatedCollection };
		}
	},
};
</script>
```
