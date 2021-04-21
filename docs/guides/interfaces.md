# Custom Interfaces <small></small>

> Custom Interfaces allow you to create new ways of viewing or interacting with field data on the Item Detail page.
> [Learn more about Interfaces](/concepts/interfaces/).

## 1. Setup the Boilerplate

Every interface is a standalone "package" that contains at least a metadata file and a Vue component. We recommend using
the following file structure:

```
src/
	index.js
	interface.vue
```

### src/index.js

```js
import InterfaceComponent from './interface.vue';

export default {
	id: 'custom',
	name: 'Custom',
	description: 'This is my custom interface!',
	icon: 'box',
	component: InterfaceComponent,
	types: ['string'],
};
```

- `id` — The unique key for this interface. It is good practice to scope proprietary interfaces with an author prefix.
- `name` — The human-readable name for this interface.
- `description` — A short description (<80 characters) of this interface shown in the App.
- `icon` — An icon name from the material icon set, or the extended list of Directus custom icons.
- `component` — A reference to your Vue component.
- `types` — An array of supported [types](/concepts/types/).
- `groups` — An array of field-groups. Accepts `standard`, `file`, `files`, `m2o`, `o2m`, `m2a`, `translations`.
  Defaults to `standard`.

::: tip TypeScript

See
[the TypeScript definition](https://github.com/directus/directus/blob/20355fee5eba514dd75565f60269311187010c66/app/src/interfaces/types.ts#L5-L18)
for more info on what can go into this object.

:::

### src/interface.vue

```vue
<template>
	<input :value="value" @input="handleChange($event.target.value)" />
</template>

<script>
export default {
	props: {
		value: String,
	},
	methods: {
		handleChange(value) {
			this.$emit('input', value);
		},
	},
};
</script>
```

#### Available Props

- `value` — The value of the field.
- `width` — The layout width of the field. Either `half`, `half-right`, `full`, or `fill`.
- `type` — The type of the field.
- `collection` — The collection name of the field.
- `field` — The key of the field.
- `primaryKey` — The current item's primary key.

## 2. Install Dependencies and Configure the Buildchain

Set up a package.json file by running:

```bash
npm init -y
```

To be read by the Admin App, your custom interface's Vue component must first be bundled into a single `index.js` file.
We recommend bundling your code using Rollup. To install this and the other development dependencies, run this command:

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

## 3. Develop your Custom Interface

The interface itself is simply a Vue component, which provides an blank canvas for creating anything you need.

## 4. Build and Deploy

To build the interface for use within Directus, run:

```bash
npx rollup -c
```

Finally, move the output from your interface's `dist` folder into your project's
`/extensions/interfaces/my-custom-interface` folder. Keep in mind that the extensions directory is configurable within
your env file, and may be located elsewhere.
