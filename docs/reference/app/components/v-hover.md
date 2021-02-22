# Hover (util)

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

## Props

| Prop          | Description                                  | Default | Type      |
| ------------- | -------------------------------------------- | ------- | --------- |
| `close-delay` | Delay (ms) before the hover state is removed | `0`     | `Number`  |
| `open-delay`  | Delay (ms) before the hover state is applied | `0`     | `Number`  |
| `disabled`    | Disables the hover state from happening      | `false` | `Boolean` |
| `tag`         | What HTML tag to use for the wrapper         | `'div'` | `String`  |

## Events

n/a

## Slots

Only the default slot is available. The hover state is passed as scoped slot data

## Slots

| Slot      | Description | Data |
| --------- | ----------- | ---- |
| _default_ |             |      |

## Props

| Prop          | Description | Default | Type      |
| ------------- | ----------- | ------- | --------- |
| `close-delay` |             | `0`     | `Number`  |
| `open-delay`  |             | `0`     | `Number`  |
| `disabled`    |             | `false` | `Boolean` |
| `tag`         |             | `'div'` | `String`  |

## Slots

| Slot      | Description | Data |
| --------- | ----------- | ---- |
| _default_ |             |      |

## Props

| Prop          | Description | Default | Type      |
| ------------- | ----------- | ------- | --------- |
| `close-delay` |             | `0`     | `Number`  |
| `open-delay`  |             | `0`     | `Number`  |
| `disabled`    |             | `false` | `Boolean` |
| `tag`         |             | `'div'` | `String`  |

## Slots

| Slot      | Description | Data |
| --------- | ----------- | ---- |
| _default_ |             |      |

## Props

| Prop          | Description | Default | Type      |
| ------------- | ----------- | ------- | --------- |
| `close-delay` |             | `0`     | `Number`  |
| `open-delay`  |             | `0`     | `Number`  |
| `disabled`    |             | `false` | `Boolean` |
| `tag`         |             | `'div'` | `String`  |

## Slots

| Slot      | Description | Data |
| --------- | ----------- | ---- |
| _default_ |             |      |
