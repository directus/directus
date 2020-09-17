# Create a Custom Interface

> TK

## 1. Setup the Boilerplate

Every interface is a standalone "package" that contains at least a metadata file, and a Vue component. I recommend you use the following file structure:

```
src/
	index.js
	interface.vue
```

### src/index.js

_See [the TypeScript definition](https://github.com/directus/next/blob/20355fee5eba514dd75565f60269311187010c66/app/src/interfaces/types.ts#L5-L18) for more info on what can go into this object_

```js
import InterfaceComponent from './interface.vue';

export default {
    id: 'custom',
    name: 'Custom',
    description: 'This is my custom interface!',
    icon: 'box',
    component: InterfaceComponent,
    types: ['string'],
}
```

### src/interface.vue

```vue
<template>
    <div>My Custom Interface</div>
</template>

<script>
export default {}
</script>
```

The props you can use in an interface are:

* `value` - Current value of the field
* `width` - The current width within the form, one of `half`, `half-left`, `half-right`, `full`, `fill`
* `type` - The type of the field
* `collection` - The current collection the field is in
* `field` - The key of the field
* `primary-key` - The primary key of the current item

## 2. Install Dependencies & Setup Buildchain

The output that's read by the app has to be a single bundled index.js file. In order to bundle the Vue component into the index.js file, you need a bundler.

I recommend you use Rollup for this purpose.

Run `npm init -y` to setup a package.json file. Then run `npm i -D rollup rollup-plugin-commonjs rollup-plugin-node-resolve rollup-plugin-terser rollup-plugin-vue vue-template-compiler` to install the dev dependencies needed for the buildchain.

Use the following Rollup config:

```js
// rollup.config.js

import { terser } from 'rollup-plugin-terser';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs'
import vue from 'rollup-plugin-vue'

export default {
    input: 'src/index.js',
    output: {
        format: 'es',
        file: 'dist/index.js'
    },
    plugins: [
        terser(),
        resolve(),
        commonjs(),
        vue(),
    ]
}
```

## 3. Build Your Custom Interface

The interface itself is a Vue component, which allows you to do whatever you need.

## 4. Build and Deploy

Run `npx rollup -c` to build the interface for use in Directus. Move the `dist` folder into the `extensions` folder you've configured in the API under `interfaces`.
