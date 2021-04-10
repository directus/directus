# Hover

Adds hover functionality to any component you place inside. Can be used to display different states of a component
depending if you are hovering over it.

```html
<v-hover v-slot="{ hover }">
	<v-button :color="hover ? red : blue" />
</v-hover>
```

## Delays

You can control how long the hover state persists after the user leaves the element with the `close-delay` prop.
Likewise, you can set how long it will take before the hover state is set with the `open-delay` prop:

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

## Reference

#### Props

| Prop          | Description                                  | Default | Type      |
| ------------- | -------------------------------------------- | ------- | --------- |
| `close-delay` | Delay (ms) before the hover state is removed | `0`     | `Number`  |
| `open-delay`  | Delay (ms) before the hover state is applied | `0`     | `Number`  |
| `disabled`    | Disables the hover state from happening      | `false` | `Boolean` |
| `tag`         | What HTML tag to use for the wrapper         | `'div'` | `String`  |

#### Events

n/a

#### Slots

| Slot      | Description                                                 | Data |
| --------- | ----------------------------------------------------------- | ---- |
| _default_ | Place your components that should use the hover effect here |      |
