# Custom Layouts <small></small>

> Custom Layouts allow for building new ways to view or interact with Items via the Collection Detail pages.
> [Learn more about Layouts](/guides/layouts/).

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
import LayoutComponent from './layout.vue';

export default {
	id: 'custom',
	name: 'Custom',
	component: LayoutComponent,
};
```

- `id` — The unique key for this layout. It is good practice to scope proprietary layouts with an author prefix.
- `name` — The human-readable name for this layout.
- `component` — A reference to your Vue component.

::: tip TypeScript

See
[the TypeScript definition](https://github.com/directus/directus/blob/20355fee5eba514dd75565f60269311187010c66/app/src/layouts/types.ts#L4-L9)
for more info on what can go into this object.

:::

### src/layout.vue

```vue
<template>
	<div>Collection: {{ collection }}</div>
</template>

<script>
export default {
	props: {
		collection: String,
	},
};
</script>
```

The props you can use in an layout are:

- `collection` — The current collection's name.
- `selection` (sync) - Any currently selected items.
- `layout-options` (sync) - The user's current saved layout options.
- `layout-query` (sync) - The user's layout query parameters. (eg: sort, limit, etc)
- `filters` (sync) - The user's currently active filters.
- `search-query` (sync) - The user's current search query.


#### Accessing the API from within your extension
The Directus App's Vue app instance provides a field called `system`, which can be injected into Vue components 
using [Vue's inject framework](https://v3.vuejs.org/guide/component-provide-inject.html). This `system` field contains functions to access [Pinia](https://pinia.esm.dev) stores, and more importantly, contains a property called `api`, which is an authenticated Axios instance. Here's an example of how to use it: 

```vue
<template>
  <div>
    <div>Collection: {{ collection }}</div>
    <v-list>
      <v-list-item v-for="item in items" v-bind:key="item.id">
        {{item}}
      </v-list-item>
    </v-list>
    <v-button v-on:click="logToConsole">CLog items to console</v-button>
  </div>
</template>
<script>
  export default {
    data() {
      return {
        items: null,
      };
    },
    methods: {
      logToConsole: function () {
        console.log(this.items);
      },
    },
    inject: ["system"],
    mounted() {
      // log the system field so you can see what attributes are available under it
      // remove this line when you're done.
      console.log(this.system);
      // Get a list of all available collections to use with this module
      this.system.api.get(`/items/${this.collection}`).then((res) => {
        this.items = res;
      });
    },
  };
</script>
```

In the above example, you can see that:	
- The `system` field gets injected into the component and becomes available as an attribute of the component (ie `this.system`)
- When the component is mounted, it uses `this.system.api.get` to request a list of all available collections
- The names of the collections are rendered into a list in the component's template
- a button is added with a method the logs all the data for the collections to the console

This is just a basic example. A more efficient way to access and work with the list of collections would be to get an instance of the `collectionsStore` using `system.useCollectionsStore()`, but that's beyond the scope of this guide

## 2. Install Dependencies and Configure the Buildchain

Set up a package.json file by running:

```bash
npm init -y
```

To be read by the Admin App, your custom layouts's Vue component must first be bundled into a single `index.js` file. We
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

## 3. Develop Your Custom Layout

The layout itself is simply a Vue component, which provides an blank canvas for creating anything you need.

## 4. Build and Deploy

To build the layout for use within Directus, run:

```bash
npx rollup -c
```

Finally, move the output from your layout's `dist` folder into your project's `/extensions/layouts/my-custom-layout`
folder. Keep in mind that the extensions directory is configurable within your env file, and may be located elsewhere.
