# Custom Modules <small></small>

> Custom Modules are completely open-ended components that allow you to create new experiences within the Directus
> platform. [Learn more about Modules](/getting-started/glossary/#modules).

## 1. Setup the Boilerplate

Every module is a standalone "package" that contains at least a metadata file and a Vue component. We recommend using
the following file structure:

```
src/
	index.js
	module.vue
```

### src/index.js

```js
import ModuleComponent from './module.vue';

export default {
	id: 'custom',
	name: 'Custom',
	icon: 'box',
	routes: [
		{
			path: '',
			component: ModuleComponent,
		},
	],
};
```

- `id` — The unique key for this module. It is good practice to scope proprietary interfaces with an author prefix.
- `name` — The human-readable name for this module.
- `icon` — An icon name from the material icon set, or the extended list of Directus custom icons.
- `routes` — Details the routes in your module. The routes are registered as nested routes with the module's `id`
  serving as the base path.

::: tip TypeScript

See
[the TypeScript definition](https://github.com/directus/directus/blob/20355fee5eba514dd75565f60269311187010c66/app/src/modules/types.ts#L6-L17)
for more info on what can go into this object.

:::

### src/module.vue

```vue
<template>
	<private-view title="My Custom Module">Content goes here...</private-view>
</template>

<script>
export default {};
</script>
```

#### Accessing the API from within your extension

The Directus App's Vue app instance provides a field called `api`, which can be injected into Vue components using
[Vue's inject framework](https://v3.vuejs.org/guide/component-provide-inject.html). This `api` field contains a property
called `api`, which is an authenticated Axios instance. Here's an example of how to use it:

```vue
<template>
	<private-view title="Example Collection List">
		<v-list>
			<v-list-item v-for="col in collections" v-bind:key="col.collection">
				{{ col.collection }}
			</v-list-item>
		</v-list>
		<v-button v-on:click="logToConsole">Log collections to console</v-button>
	</private-view>
</template>

<script>
export default {
	data() {
		return {
			collections: null,
		};
	},
	methods: {
		logToConsole: function () {
			console.log(this.collections);
		},
	},
	inject: ['api'],
	mounted() {
		// log the system field so you can see what attributes are available under it
		// remove this line when you're done.
		console.log(this.api);

		// Get a list of all available collections to use with this module
		this.api.get('/collections?limit=-1').then((res) => {
			this.collections = res.data.data;
		});
	},
};
</script>
```

In the above example, you can see that:

- The `api` field gets injected into the component and becomes available as an attribute of the component (ie
  `this.api`)
- When the component is mounted, it uses `this.api.get` to request a list of all available collections
- The names of the collections are rendered into a list in the component's template
- a button is added with a method the logs all the data for the collections to the console

This is just a basic example. A more efficient way to access and work with the list of collections would be to get an
instance of the `collectionsStore` using `store.useCollectionsStore()`, but that's beyond the scope of this guide

#### Available Props

If you setup a route with a parameter, you can pass it in as a prop.

## 2. Install Dependencies

Set up a package.json file by running:

```bash
npm init -y
```

To be read by the Admin App, your custom module's Vue component must first be bundled into a single `index.js` file. We
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
	"type": "module",
	"path": "dist/index.js",
	"source": "src/index.js",
	"host": "^9.0.0-rc.92",
	"hidden": false
}
```

## 3. Develop Your Custom Module

The module itself is simply a Vue component, which provides an blank canvas for creating anything you need.

## 4. Build and Deploy

To build the module for use within Directus, run:

```bash
npx directus-extension build
```

Finally, move the output from your module's `dist` folder into your project's `/extensions/modules/my-custom-module`
folder. Keep in mind that the extensions directory is configurable within your env file, and may be located elsewhere.
