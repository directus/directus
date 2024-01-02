---
description: A guide on how to build custom Display Extensions in Directus.
readTime: 4 min read
---

# Custom Displays

> Displays are small inline components that allow you to create new ways of viewing field values throughout the App.
> They are developed using Vue.js. [Learn more about Displays](/user-guide/overview/glossary#displays).

## Extension Entrypoint

The entrypoint of your display is the `index` file inside the `src/` folder of your extension package. It exports a
configuration object with options to configure the behavior of your display. When loading your display, this object is
imported by the Directus host.

Example of an entrypoint:

```js
import DisplayComponent from './display.vue';

export default {
	id: 'custom',
	name: 'Custom',
	icon: 'box',
	description: 'This is my custom display!',
	component: DisplayComponent,
	options: null,
	types: ['string'],
};
```

#### Available Options

- `id` — The unique key for this display. It is good practice to scope proprietary displays with an author prefix.
- `name` — The human-readable name for this display.
- `icon` — An icon name from the [material icon set](/user-guide/overview/glossary#material-icons), or the extended list
  of Directus custom icons.
- `description` — A short description (<80 characters) of this display shown in the App.
- `component` — A reference to your display component.
- `options` — The options of your display. Can be either an options object or a dedicated Vue component.
- `types` — An array of supported [types](/user-guide/overview/glossary#types).
- `localTypes` — An array of local types. Accepts `standard`, `file`, `files`, `m2o`, `o2m`, `m2m`, `m2a`,
  `presentation`, `translations` and `group`. Defaults to `standard`.
- `fields` — If this option is set, the display will fetch relational fields. Can either be an array of fields or a
  function that returns an array of fields.

## Display Component

The display component is the part of your extension that will be rendered by the Directus App whenever your display
should be used to show the value of a field. This display component has to be Vue component. The most straightforward
way to write a Vue component is to use the Vue Single File Component syntax.

Example of a display component using the Vue SFC syntax:

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

The current value of the field is provided to the component via the `value` prop. If you use the `fields` option to
fetch relational fields, the `value` prop will be an object with the requested fields as keys and their respective
values.

#### Available Props

- `value` — The value of the field.
- `interface` - The interface of the field.
- `interfaceOptions` - The options for the field's interface.
- `type` — The type of the field.
- `collection` — The collection name of the field.
- `field` — The key of the field.

Other than this simple API to communicate with the Directus App, the display component is a blank canvas, allowing you
to create anything you need.

::: warning Vue Version

The Directus App uses Vue 3. There might be 3rd party libraries that aren't yet compatible with Vue 3.

:::

### Functional Component

Instead of defining the component inside a Vue SFC file, you can use a functional component. This allows you to make
simple displays that don't need a full component rendered:

```js
export default {
	id: 'custom',
	name: 'Custom',
	icon: 'box',
	description: 'This is my custom display!',
	component: function ({ value }) {
		return value.toLowerCase();
	},
	options: null,
	types: ['string'],
};
```

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

Learn how to build displays with our official guides:

<GuidesListExtensions type="Displays" />

<script setup>
import GuidesListExtensions from '@/components/guides/GuidesListExtensions.vue';
</script>
