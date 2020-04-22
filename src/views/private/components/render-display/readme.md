# Render Display

Renders the display component with the provided options and value. This will do the display function
check and uses the functional handler if that's set.

## Usage

```html
<render-display
	display="array"
	:options="{
		wrap: false
	}"
	value="example,value"
/>
```

## Props
| Prop       | Description                          | Default |
|------------|--------------------------------------|---------|
| `display`* | The display to render the value with |         |
| `options`  | The display options for the display  | `null`  |
| `value`    | The value to render in the display   | `null`  |

## Events
n/a

## Slots
n/a

## CSS Variables
n/a
