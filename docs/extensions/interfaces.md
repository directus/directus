# Custom Interfaces <small></small>

> Custom Interfaces allow you to create new ways of viewing or interacting with field data on the Item Detail page.
> [Learn more about Interfaces](/getting-started/glossary/#interfaces).

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
	emits: ['input'],
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

## 2. Install Dependencies

Set up a package.json file by running:

```bash
npm init -y
```

To be read by the Admin App, your custom interface's Vue component must first be bundled into a single `index.js` file.
We recommend bundling your code using the directus-extension CLI from our `@directus/extensions-sdk` package. The CLI
internally uses a Rollup configuration tailored specifically to bundling Directus extensions. To install the Extension
SDK, run this command:

```bash
npm i -D @directus/extensions-sdk
```

For the directus-extension CLI to recognize the extension type, the input path and the output path, add this field to
the root of the `package.json` file:

```json
"directus:extension": {
	"type": "interface",
	"path": "dist/index.js",
	"source": "src/index.js",
	"host": "^9.0.0-rc.87",
	"hidden": false
}
```

## 3. Develop your Custom Interface

The interface itself is simply a Vue component, which provides an blank canvas for creating anything you need.

## 4. Build and Deploy

To build the interface for use within Directus, run:

```bash
npx directus-extension build
```

Finally, move the output from your interface's `dist` folder into your project's
`/extensions/interfaces/my-custom-interface` folder. Keep in mind that the extensions directory is configurable within
your env file, and may be located elsewhere.
