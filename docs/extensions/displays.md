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
	component: DisplayComponent,
	types: ['string'],
};
```

- `id` — The unique key for this display. It is good practice to scope proprietary displays with an author prefix.
- `name` — The human-readable name for this display.
- `description` — A short description (<80 characters) of this display shown in the App.
- `icon` — An icon name from the material icon set, or the extended list of Directus custom icons.
- `component` — A reference to your Vue component.
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

Instead of defining the component inside a Vue SFC file, you can use a functional component. This allows you to make
simple displays that don't need a full component rendered:

```js
export default {
	id: 'custom',
	name: 'Custom',
	description: 'This is my custom display!',
	icon: 'box',
	component: function ({ value }) {
		return value.toLowerCase();
	},
	types: ['string'],
};
```

## 2. Install Dependencies

Set up a package.json file by running:

```bash
npm init -y
```

To be read by the Admin App, your custom display's Vue component must first be bundled into a single `index.js` file. We
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
	"type": "display",
	"path": "dist/index.js",
	"source": "src/index.js",
	"host": "^9.0.0-rc.87",
	"hidden": false
}
```

## 3. Develop Your Custom Display

The display itself is simply a function or a Vue component, providing a blank canvas for creating anything you need.

## 4. Build and Deploy

To build the display for use within Directus, run:

```bash
npx directus-extension build
```

Finally, move the output from your display's `dist` folder into your project's `/extensions/displays/my-custom-display`
folder. Keep in mind that the extensions directory is configurable within your env file, and may be located elsewhere.
