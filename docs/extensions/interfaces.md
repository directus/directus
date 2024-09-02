---
description: A guide on how to build custom Interfaces in Directus.
readTime: 4 min read
---

# Custom Interfaces

> Custom Interfaces allow you to create new ways of viewing or interacting with field data on the Item Detail page. They
> are developed using Vue.js. [Learn more about Interfaces](/user-guide/overview/glossary#interfaces).

## Extension Entrypoint

The entrypoint of your interface is the `index` file inside the `src/` folder of your extension package. It exports a
configuration object with options to configure the behavior of your interface. When loading your interface, this object
is imported by the Directus host.

Example of an entrypoint:

```js
import InterfaceComponent from './interface.vue';

export default {
	id: 'custom',
	name: 'Custom',
	icon: 'box',
	description: 'This is my custom interface!',
	component: InterfaceComponent,
	options: null,
	types: ['string'],
};
```

#### Available Options

- `id` — The unique key for this interface. It is good practice to scope proprietary interfaces with an author prefix.
- `name` — The human-readable name for this interface.
- `icon` — An icon name from the [material icon set](/user-guide/overview/glossary#material-icons), or the extended list
  of Directus custom icons.
- `description` — A short description (<80 characters) of this interface shown in the App.
- `component` — A reference to your interface component.
- `options` — The options of your interface. Can be either an options object or a dedicated Vue component.
- `types` — An array of supported [types](/user-guide/overview/glossary#types).
- `localTypes` — An array of local types. Accepts `standard`, `file`, `files`, `m2o`, `o2m`, `m2m`, `m2a`,
  `presentation`, `translations` and `group`. Defaults to `standard`.
- `group` — The group this interface is shown at when creating a field. Accepts `standard`, `selection`, `relational`,
  `presentation`, `group` or `other`. Defaults to `other`.
- `relational` — A boolean that indicates if this interface is a relational interface.
- `recommendedDisplays` — An array of display names which are recommended to be used with this interface.

## Interface Component

The interface component is the part of your extension that will be rendered by the Directus App whenever your interface
should be used to input some value into a field. This interface component has to be Vue component. The most
straightforward way to write a Vue component is to use the Vue Single File Component syntax.

Example of an interface component using the Vue SFC syntax:

```vue
<template>
	<input :value="value" @input="handleChange($event.target.value)" />
</template>

<script>
export default {
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		return { handleChange };

		function handleChange(value) {
			emit('input', value);
		}
	},
};
</script>
```

The current value of the field is provided to the component via the `value` prop. If the value was changed inside your
component, it should be emitted to the Directus App by using the `input` emit.

#### Available Props

- `value` — The value of the field.
- `width` — The layout width of the field. Either `half`, `half-right`, `full`, or `fill`.
- `type` — The type of the field.
- `collection` — The collection name of the field.
- `field` — The key of the field.
- `primaryKey` — The current item's primary key.

#### Available Emits

- `input` — Update the value of the field.
- `setFieldValue` - Used to set the value of other fields.

Other than this simple API to communicate with the Directus App, the interface component is a blank canvas, allowing you
to create anything you need.

::: warning Vue Version

The Directus App uses Vue 3. There might be 3rd party libraries that aren't yet compatible with Vue 3.

:::

## Accessing Internal Systems

To access internal systems like the API or the stores, you can use the `useApi()` and `useStores()` composables exported
by the `@directus/extensions-sdk` package. They can be used inside a `setup()` function like this:

```js
import { useApi, useStores } from '@directus/extensions-sdk';

export default {
	setup() {
		const api = useApi();

		const { useCollectionsStore } = useStores();
		const collectionsStore = useCollectionsStore();

		// ...
	},
};
```

::: tip Vue Options API

If you prefer to use the Vue Options API, you can inject the `api` and `stores` properties directly.

:::

## Guides

Learn how to build interfaces with our official guides:

<GuidesListExtensions type="Interfaces" />

<script setup>
import GuidesListExtensions from '@/components/guides/GuidesListExtensions.vue';
</script>
