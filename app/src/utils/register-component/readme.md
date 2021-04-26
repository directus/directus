# `registerComponent`
Registers a component into the global Vue context.

## Usage
```js
registerComponent('v-button', VButton);
```

## Vue.component() vs registerComponent()
`registerComponent` internally calls `Vue.component()` directly, and doesn't do anything else. The
function is purely to extend the accepted TypeScript type for the second parameter. Vue accepts the
second parameter to be of type `Component`, yet it's `Vue.component()` function doesn't actually have
that type in it's definition.
