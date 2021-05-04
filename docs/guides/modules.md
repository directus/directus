# Custom Modules <small></small>

> Custom Modules are completely open-ended components that allow you to create new experiences within the Directus
> platform. [Learn more about Modules](/concepts/modules/).

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
			path: '/',
			component: ModuleComponent,
		},
	],
};
```

- `id` — The unique key for this module. It is good practice to scope proprietary interfaces with an author prefix.
- `name` — The human-readable name for this module.
- `icon` — An icon name from the material icon set, or the extended list of Directus custom icons.
- `routes` — Details the routes in your module per the Vue router.

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
The Directus App's Vue app instance provides a field called `system`, which can be injected into Vue components 
using [Vue's inject framework](https://v3.vuejs.org/guide/component-provide-inject.html). This `system` field contains functions to access Vuex stores, and more importantly, contains a property called `api`, which is an authenticated Axios instance. Here's an example of how to use it: 

```vue
<template>
  <private-view title="Example Collection List">
    <v-list>
      <v-list-item v-for="col in collections" v-bind:key="col.collection">
        {{col.collection}}
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
    inject: ["system"],
    mounted() {
      // log the system field so you can see what attributes are available under it
      // remove this line when you're done.
      console.log(this.system);

      // Get a list of all available collections to use with this module
      this.system.api.get("/collections?limit=-1").then((res) => {
        this.collections = res.data.data;
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

#### Available Props

If you setup a route with a parameter, you can pass it in as a prop.

## 2. Install Dependencies and Configure the Buildchain

Set up a package.json file by running:

```bash
npm init -y
```

To be read by the Admin App, your custom module's Vue component must first be bundled into a single `index.js` file. We
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

## 3. Develop Your Custom Module

The module itself is simply a Vue component, which provides an blank canvas for creating anything you need.

## 4. Build and Deploy

To build the module for use within Directus, run:

```bash
npx rollup -c
```

Finally, move the output from your module's `dist` folder into your project's `/extensions/modules/my-custom-module`
folder. Keep in mind that the extensions directory is configurable within your env file, and may be located elsewhere.
