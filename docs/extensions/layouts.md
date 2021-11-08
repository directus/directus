# Custom Layouts <small></small>

> Custom Layouts allow for building new ways to view or interact with Items via the Collection Detail pages.
> [Learn more about Layouts](/getting-started/glossary/#layouts).

## 1. Setup the Boilerplate

Every layout is a standalone "package" that contains at least a metadata file and a Vue component. We recommend using
the following file structure:

```
src/
	index.js
	layout.vue
```

### src/index.js

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

- `id` — The unique key for this layout. It is good practice to scope proprietary layouts with an author prefix.
- `name` — The human-readable name for this layout.
- `icon` — An icon name from the material icon set, or the extended list of Directus custom icons.
- `component` — A reference to your Vue component.

::: tip TypeScript

See
[the TypeScript definition](https://github.com/directus/directus/blob/20355fee5eba514dd75565f60269311187010c66/app/src/layouts/types.ts#L4-L9)
for more info on what can go into this object.

:::

### src/layout.vue

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

The props you can use in a layout are:

- `collection` — The current collection's name.
- `selection` (sync) - Any currently selected items.
- `layout-options` (sync) - The user's current saved layout options.
- `layout-query` (sync) - The user's layout query parameters. (eg: sort, limit, etc)
- `filters` (sync) - The user's currently active filters.
- `search-query` (sync) - The user's current search query.

## 2. Install Dependencies

Set up a package.json file by running:

```bash
npm init -y
```

To be read by the Admin App, your custom layouts's Vue component must first be bundled into a single `index.js` file. We
recommend bundling your code using the directus-extension CLI from our `@directus/extensions-sdk` package. The CLI
internally uses a Rollup configuration tailored specifically to bundling Directus extensions. To install the Extension
SDK, run this command:

```bash
npm i -D @directus/extensions-sdk
```

For the directus-extension CLI to recognize the extension type, the input path and the output path, add this field to
the root of the `package.json` file:

```json
"directus:extension": {
	"type": "layout",
	"path": "dist/index.js",
	"source": "src/index.js",
	"host": "^9.0.0-rc.87",
	"hidden": false
}
```

## 3. Develop Your Custom Layout

The layout itself is simply a Vue component, which provides a blank canvas for creating anything you need.

## 4. Build and Deploy

To build the layout for use within Directus, run:

```bash
npx directus-extension build
```

Finally, move the output from your layout's `dist` folder into your project's `/extensions/layouts/my-custom-layout`
folder. Keep in mind that the extensions directory is configurable within your env file, and may be located elsewhere.
