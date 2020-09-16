# Create a Custom Display

> TK

## 1. Setup the Boilerplate

Every display is a standalone "package" that contains at least a metadata file, and a Vue component. I recommend you use the following file structure:

```
src/
	index.js
	display.vue
```

### src/index.js

_See [the TypeScript definition](https://github.com/directus/next/blob/20355fee5eba514dd75565f60269311187010c66/app/src/displays/types.ts#L24-L34) for more info on what can go into this object_

```js
import DisplayComponent from './display.vue';

export default {
    id: 'custom',
    name: 'Custom',
    description: 'This is my custom display!',
    icon: 'box',
    handler: DisplayComponent,
    types: ['string'],
}
```

### src/display.vue

```vue
<template>
    <div>My Custom Display</div>
</template>

<script>
export default {}
</script>
```

The props you can use in an display are:

* `interface` - The interface that is configured for this field
* `interface-options` - The configured options for this field's interface
* `value` - The current value of this field
* `type` - The type of the field
* `collection` - The collection the field is in
* `field` - The current field

---

Alternatively, you can specify a function for the handler. This allows you to make simple displays that don't need a full component rendered:

```js
export default {
    id: 'custom',
    name: 'Custom',
    description: 'This is my custom display!',
    icon: 'box',
    handler: function(value) {
		return value.toLowerCase();
	},
    types: ['string'],
}
```

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

## 3. Build Your Custom display

The display itself is a Vue component, which allows you to do whatever you need.

## 4. Build and Deploy

Run `npx rollup -c` to build the display for use in Directus. Move the `dist` folder into the `extensions` folder you've configured in the API under `displays`.
