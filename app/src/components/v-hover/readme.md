# Hover (util)

```html
<v-hover v-slot="{ hover }">
  <v-button :color="hover ? red : blue" />
</v-hover>
```

## Delays

You can control how long the hover state persists after the user leaves the element with the `close-delay` prop. Likewise, you can set how long it will take before the hover state is set with the `open-delay` prop:

```html
<v-hover v-slot="{ hover }" :open-delay="250" :close-delay="400">
  <v-button :class="hover ? red : blue" />
</v-hover>
<style>
.v-button.red {
	--v-button-color: var(--red);
}
.v-button.blue {
	--v-button-color: var(--blue);
}
</style>
```

## Props

| Prop          | Description                                  | Default |
|---------------|----------------------------------------------|---------|
| `close-delay` | Delay (ms) before the hover state is removed | `0`     |
| `open-delay`  | Delay (ms) before the hover state is applied | `0`     |
| `disabled`    | Disables the hover state from happening      | `false` |
| `tag`         | What HTML tag to use for the wrapper         | `div`   |

## Events
n/a

## Slots

Only the default slot is available. The hover state is passed as scoped slot data
