# Create a Custom Layout

> Custom layouts allow you to create new ways of browsing or viewing data on the Collection Detail
> page.

## 1. Setup the Boilerplate

Every layout is a standalone "package" that contains at least a metadata file and a Vue component.
We recommend using the following file structure:

```
src/
	index.js
	layout.vue
```

### src/index.js

```js
import LayoutComponent from './layout.vue';

export default {
	id: 'custom',
	name: 'Custom',
	component: LayoutComponent,
};
```

-   `id` — The unique key for this layout. It is good practice to scope proprietary layouts with an
    author prefix.
-   `name` — The human-readable name for this layout.
-   `component` — A reference to your Vue component.

<!-- prettier-ignore-start -->
::: tip
See
[the TypeScript definition](https://github.com/directus/directus/blob/20355fee5eba514dd75565f60269311187010c66/app/src/layouts/types.ts#L4-L9)
for more info on what can go into this object.
:::
<!-- prettier-ignore-end -->

### src/layout.vue

```vue
<template>
	<div>My Custom Layout</div>
</template>

<script>
export default {};
</script>
```

The props you can use in an layout are:

-   `collection` — The current collection's name.
-   `selection` (sync) - Any currently selected items.
-   `layout-options` (sync) - The user's current saved layout options.
-   `layout-query` (sync) - The user's layout query parameters. (eg: sort, limit, etc)
-   `filters` (sync) - The user's currently active filters.
-   `search-query` (sync) - The user's current search query.

## 2. Install Dependencies and Configure the Buildchain

Set up a package.json file by running:

```bash
npm init -y
```

To be read by the Admin App, your custom layouts's Vue component must first be bundled into a single
`index.js` file. We recommend bundling your code using Rollup. To install this and the other
development dependencies, run this command:

```bash
npm i -D rollup rollup-plugin-commonjs rollup-plugin-node-resolve rollup-plugin-terser rollup-plugin-vue@5.0.0 @vue/compiler-sfc vue-template-compiler
```

You can then use the following Rollup configuration within `rollup.config.js`:

```js
import { terser } from 'rollup-plugin-terser';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import vue from 'rollup-plugin-vue';

export default {
	input: 'src/index.js',
	output: {
		format: 'es',
		file: 'dist/index.js',
	},
	plugins: [terser(), resolve(), commonjs(), vue()],
};
```

## 3. Develop Your Custom Layout

The layout itself is simply a Vue component, which provides an blank canvas for creating anything
you need.

## 4. Build and Deploy

To build the layout for use within Directus, run:

```bash
npx rollup -c
```

Finally, move the output from your layout's `dist` folder into your project's `/extensions/layouts`
folder. Keep in mind that the extensions directory is configurable within your env file, and may be
located elsewhere.
