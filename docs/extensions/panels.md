---
description: A guide on how to build custom Panels in Directus.
readTime: 3 min read
---

# Custom Panels

> Panels are modular units of data visualization that exist within the
> [Insights module](/user-guide/insights/dashboards). Each panel exists within a Dashboard and can be positioned and
> resized as needed. They are developed using Vue.js. [Learn more about Panels](/user-guide/overview/glossary#panels).

## Extension Entrypoint

The entrypoint of your panel is the `index` file inside the `src/` folder of your extension package. It exports a
configuration object with options to configure the behavior of your panel. When loading your panel, this object is
imported by the Directus host.

Example of an entrypoint:

```js
import PanelComponent from './panel.vue';

export default {
	id: 'custom',
	name: 'Custom',
	icon: 'box',
	description: 'This is my custom panel!',
	component: PanelComponent,
	options: [
		{
			field: 'text',
			name: 'Text',
			type: 'string',
			meta: {
				interface: 'input',
				width: 'full',
			},
		},
	],
	minWidth: 12,
	minHeight: 8,
};
```

#### Available Options

- `id` — The unique key for this panel. It is good practice to scope proprietary panels with an author prefix.
- `name` — The human-readable name for this panel.
- `icon` — An icon name from the [material icon set](/user-guide/overview/glossary#material-icons), or the extended list
  of Directus custom icons.
- `description` — A short description (<80 characters) of this panel shown in the App.
- `component` — A reference to your panel component.
- `options` — The options of your panel. Can be either an options object or a dedicated Vue component.
- `minWidth` - The minimum width in grid units of your panel on a dashboard.
- `minHeight` - The minimum height in grid units of your panel on a dashboard.

## Panel Component

The panel component is the part of your extension that will be rendered by the Directus App whenever your panel should
be used for data visualization in a dashboard within the Insights module. This panel component has to be Vue component.
The most straightforward way to write a Vue component is to use the Vue Single File Component syntax.

Example of a panel component using the Vue SFC syntax:

```vue
<template>
	<div class="text" :class="{ 'has-header': showHeader }">
		{{ text }}
	</div>
</template>

<script>
export default {
	props: {
		showHeader: {
			type: Boolean,
			default: false,
		},
		text: {
			type: String,
			default: '',
		},
	},
};
</script>

<style scoped>
.text {
	padding: 12px;
}

.text.has-header {
	padding: 0 12px;
}
</style>
```

#### Available Props

- `showHeader` **boolean** — Whether the header is shown. Useful for alternative styling based on the extra/reduced
  space.
- `dashboard` **uuid** - The UUID string of the dashboard containing the panel.
- `id` **uuid** - The UUID string of the panel.
- `height` **number** - The current configured height of the panel.
- `width` **number** - The current configured width of the panel.
- `now` **Date** - The Date object as of the moment of viewing the dashboard containing the panel.

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

Learn how to build panels with our official guides:

<GuidesListExtensions type="Panels" />

<script setup>
import GuidesListExtensions from '@/components/guides/GuidesListExtensions.vue';
</script>
