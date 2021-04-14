# Custom Displays <small></small>

> Displays are small inline components that allow you to create new ways of viewing field values throughout the App.
> [Learn more about Displays](/concepts/displays/).

## 1. Setup the Boilerplate

Every display is a standalone "package" that contains at least a metadata file and a Vue component. We recommend using
the following file structure:

```
src/
	index.js
	display.vue
```

### src/index.js

```js
import DisplayComponent from './display.vue';

export default {
	id: 'custom',
	name: 'Custom',
	description: 'This is my custom display!',
	icon: 'box',
	handler: DisplayComponent,
	types: ['string'],
};
```

- `id` — The unique key for this display. It is good practice to scope proprietary displays with an author prefix.
- `name` — The human-readable name for this display.
- `description` — A short description (<80 characters) of this display shown in the App.
- `icon` — An icon name from the material icon set, or the extended list of Directus custom icons.
- `handler` — A function, or reference to your Vue component.
- `types` — A CSV of supported [types](/concepts/types/).

::: tip

[See the TypeScript definition](https://github.com/directus/directus/blob/20355fee5eba514dd75565f60269311187010c66/app/src/displays/types.ts#L24-L34)
for more info on what can go into this object.

:::

### src/display.vue

```vue
<template>
	<div>Value: {{ value }}</div>
</template>

<script>
export default {
	props: {
		value: String,
	},
};
</script>
```

The props you can use in an display are:

- `value` — The value of the parent field.
- `interface` - The interface of the parent field.
- `interface-options` - The options for the parent field's interface.
- `type` — The type of the parent field.
- `collection` — The collection name of the parent field.
- `field` — The key of the parent field.

---

Alternatively, you can specify a function for the handler. This allows you to make simple displays that don't need a
full component rendered:

```js
export default {
	id: 'custom',
	name: 'Custom',
	description: 'This is my custom display!',
	icon: 'box',
	handler: function (value) {
		return value.toLowerCase();
	},
	types: ['string'],
};
```

## 2. Install Dependencies and Configure the Buildchain

Set up a package.json file by running:

```bash
npm init -y
```

To be read by the Admin App, your custom display's Vue component must first be bundled into a single `index.js` file. We
recommend bundling your code using Rollup. To install this and the other development dependencies, run this command:

```bash
npm i -D rollup @rollup/plugin-commonjs @rollup/plugin-node-resolve rollup-plugin-terser rollup-plugin-vue@5 vue-template-compiler
```

You can then use the following Rollup configuration within `rollup.config.js`:

```js
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import vue from 'rollup-plugin-vue';

export default {
	input: 'src/index.js',
	output: {
		format: 'es',
		file: 'dist/index.js',
	},
	plugins: [vue(), nodeResolve(), commonjs(), terser()],
};
```

::: tip Building multiple extensions

You can export an array of build configurations, so you can bundle (or even watch) multiple extensions at the same time.
See the [Rollup configuration file documentation](https://rollupjs.org/guide/en/#configuration-files) for more info.

:::

## 3. Develop Your Custom Display

The display itself is simply a function or a Vue component, providing a blank canvas for creating anything you need.

## 4. Build and Deploy

To build the display for use within Directus, run:

```bash
npx rollup -c
```

Finally, move the output from your display's `dist` folder into your project's `/extensions/displays/my-custom-display`
folder. Keep in mind that the extensions directory is configurable within your env file, and may be located elsewhere.
