# v-slider

Range slider for selecting numeric values within a range.

## Basic Usage

```json
{
	"type": "v-slider",
	"props": {
		"modelValue": "state.volume",
		"onUpdate:modelValue": "actions.setVolume",
		"min": 0,
		"max": 100
	}
}
```

```javascript
state.volume = 50;

actions.setVolume = (value) => {
	state.volume = value;
};
```

## Props

| Prop                  | Type    | Default  | Description                           |
| --------------------- | ------- | -------- | ------------------------------------- |
| `modelValue`          | number  | 0        | Current value                         |
| `onUpdate:modelValue` | action  | required | Value change handler                  |
| `min`                 | number  | 0        | Minimum value                         |
| `max`                 | number  | 100      | Maximum value                         |
| `step`                | number  | 1        | Increment step                        |
| `disabled`            | boolean | false    | Disable the slider                    |
| `showThumbLabel`      | boolean | false    | Show value label on thumb             |
| `showTicks`           | boolean | false    | Show tick marks                       |
| `alwaysShowValue`     | boolean | false    | Always show value (not just on hover) |

## With Thumb Label

```json
{
	"type": "v-slider",
	"props": {
		"modelValue": "state.brightness",
		"onUpdate:modelValue": "actions.setBrightness",
		"min": 0,
		"max": 100,
		"showThumbLabel": true
	}
}
```

## With Ticks

```json
{
	"type": "v-slider",
	"props": {
		"modelValue": "state.rating",
		"onUpdate:modelValue": "actions.setRating",
		"min": 1,
		"max": 5,
		"step": 1,
		"showTicks": true
	}
}
```

## Decimal Steps

```json
{
	"type": "v-slider",
	"props": {
		"modelValue": "state.opacity",
		"onUpdate:modelValue": "actions.setOpacity",
		"min": 0,
		"max": 1,
		"step": 0.1,
		"showThumbLabel": true
	}
}
```

## With Value Display

```json
{
	"type": "div",
	"children": [
		{
			"type": "div",
			"props": { "style": "display: flex; justify-content: space-between; margin-bottom: 8px;" },
			"children": [
				{ "type": "span", "children": ["Volume"] },
				{ "type": "span", "children": ["{{ state.volume }}%"] }
			]
		},
		{
			"type": "v-slider",
			"props": {
				"modelValue": "state.volume",
				"onUpdate:modelValue": "actions.setVolume",
				"min": 0,
				"max": 100
			}
		}
	]
}
```

## Complete Example: Image Editor Settings

```json
{
	"type": "v-card",
	"children": [
		{ "type": "v-card-title", "children": ["Image Adjustments"] },
		{
			"type": "v-card-text",
			"children": [
				{
					"type": "div",
					"props": { "style": "margin-bottom: 24px;" },
					"children": [
						{
							"type": "div",
							"props": { "style": "display: flex; justify-content: space-between;" },
							"children": [
								{ "type": "span", "children": ["Brightness"] },
								{ "type": "span", "children": ["{{ state.brightness }}%"] }
							]
						},
						{
							"type": "v-slider",
							"props": {
								"modelValue": "state.brightness",
								"onUpdate:modelValue": "actions.setBrightness",
								"min": 0,
								"max": 200
							}
						}
					]
				},
				{
					"type": "div",
					"props": { "style": "margin-bottom: 24px;" },
					"children": [
						{
							"type": "div",
							"props": { "style": "display: flex; justify-content: space-between;" },
							"children": [
								{ "type": "span", "children": ["Contrast"] },
								{ "type": "span", "children": ["{{ state.contrast }}%"] }
							]
						},
						{
							"type": "v-slider",
							"props": {
								"modelValue": "state.contrast",
								"onUpdate:modelValue": "actions.setContrast",
								"min": 0,
								"max": 200
							}
						}
					]
				},
				{
					"type": "div",
					"children": [
						{
							"type": "div",
							"props": { "style": "display: flex; justify-content: space-between;" },
							"children": [
								{ "type": "span", "children": ["Saturation"] },
								{ "type": "span", "children": ["{{ state.saturation }}%"] }
							]
						},
						{
							"type": "v-slider",
							"props": {
								"modelValue": "state.saturation",
								"onUpdate:modelValue": "actions.setSaturation",
								"min": 0,
								"max": 200
							}
						}
					]
				}
			]
		},
		{
			"type": "v-card-actions",
			"children": [
				{
					"type": "v-button",
					"props": { "secondary": true, "onClick": "actions.reset" },
					"children": ["Reset"]
				},
				{
					"type": "v-button",
					"props": { "onClick": "actions.apply" },
					"children": ["Apply"]
				}
			]
		}
	]
}
```

```javascript
state.brightness = 100;
state.contrast = 100;
state.saturation = 100;

actions.setBrightness = (v) => {
	state.brightness = v;
};
actions.setContrast = (v) => {
	state.contrast = v;
};
actions.setSaturation = (v) => {
	state.saturation = v;
};

actions.reset = () => {
	state.brightness = 100;
	state.contrast = 100;
	state.saturation = 100;
};

actions.apply = async () => {
	await updateItem('images', state.imageId, {
		brightness: state.brightness,
		contrast: state.contrast,
		saturation: state.saturation,
	});
};
```

## Notes

- Slider fills to show progress from min to current value
- Use `showThumbLabel` for precise value feedback
- Use `showTicks` when there are discrete meaningful values
- For fine control with decimals, use small `step` values
