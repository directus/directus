# Slider

```html
<v-slider v-model="value" :min="0" :max="100" />
```

## Thumb Label

You can show the current value of the slider when the user is sliding by enabling the thumb label. This can be done by setting the `show-thumb-label` prop:

```html
<v-slider v-model="value" :min="0" :max="100" show-thumb-label />
```

## Ticks

You can render an indicator for every step of the slider. This allows the user to know what kind of steps are available when sliding the slider. You can enable this with the `show-ticks` prop.

```html
<v-slider v-model="value" :min="0" :max="100" show-ticks />
```

## Prepend / Append slot

You can add any custom content before and after the slider (inline). This can be used to render things like buttons to decrease / increase the value, or a label that shows a preview of what the value with a unit is going to be.

```html
<v-slider>
	<template #prepend>
		<v-icon name="star" />
	</template>
	<template #append>
		Value: {{ value }}
	</template>
</v-slider>
```

## Props
| Prop               | Description                                                  | Default                     |
|--------------------|--------------------------------------------------------------|-----------------------------|
| `max`              | Maximum allowed value                                        | `100`                       |
| `min`              | Minimum allowed value                                        | `0`                         |
| `show-thumb-label` | Show the thumb label on drag of the thumb                    | `false`                     |
| `show-ticks`       | Show tick for each step                                      | `false`                     |
| `step`             | In what step the value can be entered                        | `1`                         |
| `thumb-color`      | Color of the thumb and label                                 | `--slider-thumb-color`      |
| `track-color`      | Color of the slider track                                    | `--slider-track-color`      |
| `track-fill-color` | Color of the filled part of the slider track (left of thumb) | `--slider-track-fill-color` |
| `value`            | Current value of slider. Can be used with `v-model`          | `50`                        |

## Events
| Event           | Description                                 | Value    |
|-----------------|---------------------------------------------|----------|
| `change`        | Fires only when the user releases the thumb | `number` |
| `input`         | Fires continuously                          | `number` |

## Slots
| Slot          | Description                        | Props               |
|---------------|------------------------------------|---------------------|
| `append`      | Inserted after the slider track    | --                  |
| `prepend`     | Inserted before the slider track   | --                  |
| `thumb-label` | Custom content for the thumb label | `{ value: number }` |
