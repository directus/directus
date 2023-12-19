---
description: A guide on how to build custom Layouts in Directus.
readTime: 4 min read
---

# Custom Layouts

> Custom Layouts allow for building new ways to view or interact with Items via the Collection Detail pages. They are
> developed using Vue.js. [Learn more about Layouts](/user-guide/overview/glossary#layouts).

## Extension Entrypoint

The entrypoint of your layout is the `index` file inside the `src/` folder of your extension package. It exports a
configuration object with options to configure the behavior of your layout. When loading your layout, this object is
imported by the Directus host.

Example of an entrypoint:

```js
import { ref } from 'vue';
import LayoutComponent from './layout.vue';

export default {
	id: 'custom',
	name: 'Custom',
	icon: 'box',
	component: LayoutComponent,
	slots: {
		options: () => null,
		sidebar: () => null,
		actions: () => null,
	},
	setup() {
		const name = ref('Custom Layout');

		return { name };
	},
};
```

#### Available Options

- `id` — The unique key for this layout. It is good practice to scope proprietary layouts with an author prefix.
- `name` — The human-readable name for this layout.
- `icon` — An icon name from the [material icon set](/user-guide/overview/glossary#material-icons), or the extended list
  of Directus custom icons.
- `component` — A reference to your layout component.
- `slots` — Additional components to be added by your layout.
  - `options` — A reference to an options component.
  - `sidebar` — A reference to a sidebar component.
  - `actions` — A reference to an actions component.
- `setup` — A function to setup reactive state to be shared by the layout component and the other components. It
  receives a `props` object as the first parameter and a `context` object containing an `emit()` function as the second
  parameter.

## Layout Component

The layout component is the part of your extension that will be rendered by the Directus App whenever your layout should
be used to show the items of a collection. This layout component has to be Vue component. The most straightforward way
to write a Vue component is to use the Vue Single File Component syntax.

Example of a layout component using the Vue SFC syntax:

```vue
<template>
	<div>
		<p>Name: {{ name }}</p>
		<p>Collection: {{ collection }}</p>
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
		name: {
			type: String,
			required: true,
		},
	},
};
</script>
```

In addition to some predefined props, the component receives the state defined inside the `setup()` function as
individual props. Besides some predefined emits, the component also provides emits for every property returned by the
`setup()` function. Those emits are prefixed by `update:`.

These props and emits are available in all components associated with your layout.

#### Available Props

- `collection` — The current collection's name.
- `selection` — Any currently selected items.
- `layoutOptions` — The user's currently saved layout options.
- `layoutQuery` — The user's layout query parameters. (e.g., sort, limit, etc)
- `filter` — The combined active filter.
- `filterUser` — The user's currently active filter.
- `filterSystem` — The system's currently active filter.
- `search` — The user's current search query.
- `selectMode` — A boolean that indicates if the layout should be in select mode.
- `readonly` — A boolean that indicates if the layout should be in readonly mode.
- `resetPreset` — A function to reset the preset.

#### Available Emits

- `update:selection` — Update the currently selected items.
- `update:layoutOptions` — Update the user's currently saved layout options.
- `update:layoutQuery` — Update the user's layout query parameters.

Other than this simple API to communicate with the Directus App and the system to share state between components, the
layout component is a blank canvas, allowing you to create anything you need.

The `@directus/extensions-sdk` package provides some useful composables to help with creating layouts:

- `useSync()` — This function can be used to synchronize a writable ref with a prop and a corresponding emit.
- `useCollection()` — This function can be used to receive information about a collection.
- `useItems()` — This function can be used to fetch items from the API.

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

Learn how to build layouts with our official guides:

<GuidesListExtensions type="Layouts" />

<script setup>
import GuidesListExtensions from '@/components/guides/GuidesListExtensions.vue';
</script>
