# Slider

A standard slider as everybody knows them.

```html
<v-slider v-model="value" :min="0" :max="100" />
```

## Color

The colors can be changed via the css variables `--v-slider-color`, `--v-slider-fill-color` and
`--v-slider-thumb-color`.

```html
<v-slider />
<style>
	.v-slider {
		--v-slider-color: var(--red-400);
		--v-slider-fill-color: var(--red-700);
		--v-slider-thumb-color: var(--orange-500);
	}
</style>
```

## Thumb Label

You can show the current value of the slider when the user is sliding by enabling the thumb label. This can be done by
setting the `show-thumb-label` prop:

```html
<v-slider v-model="value" :min="0" :max="100" show-thumb-label />
```

## Ticks

You can render an indicator for every step of the slider. This allows the user to know what kind of steps are available
when sliding the slider. You can enable this with the `show-ticks` prop.

```html
<v-slider v-model="value" :min="0" :max="100" show-ticks />
```

## Prepend / Append slot

You can add any custom content before and after the slider (inline). This can be used to render things like buttons to
decrease / increase the value, or a label that shows a preview of what the value with a unit is going to be.

```html
<v-slider>
	<template #prepend>
		<v-icon name="star" />
	</template>
	<template #append>Value: {{ value }}</template>
</v-slider>
```

## Reference

#### Props

| Prop                | Description                                         | Default | Type      |
| ------------------- | --------------------------------------------------- | ------- | --------- |
| `max`               | Maximum allowed value                               | `100`   | `Number`  |
| `min`               | Minimum allowed value                               | `0`     | `Number`  |
| `show-thumb-label`  | Show the thumb label on drag of the thumb           | `false` | `Boolean` |
| `show-ticks`        | Show tick for each step                             | `false` | `Boolean` |
| `step`              | In what step the value can be entered               | `1`     | `Number`  |
| `value`             | Current value of slider. Can be used with `v-model` | `0`     | `Number`  |
| `always-show-value` | Always the current selected value                   | `false` | `Boolean` |

#### Events

| Event    | Description                                 | Value    |
| -------- | ------------------------------------------- | -------- |
| `change` | Fires only when the user releases the thumb | `number` |
| `input`  | Fires continuously                          | `number` |

#### CSS Variables

| Variable                 | Default                |
| ------------------------ | ---------------------- |
| `--v-slider-color`       | `var(--border-normal)` |
| `--v-slider-thumb-color` | `var(--primary)`       |
| `--v-slider-fill-color`  | `var(--primary)`       |

#### Slots

| Slot          | Description                    | Data |
| ------------- | ------------------------------ | ---- |
| `prepend`     | Prepend anything to the slider |      |
| `thumb-label` |                                |      |
| `type-text`   |                                |      |
| `append`      | Append anything to the slider  |      |
