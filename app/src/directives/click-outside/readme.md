# Click Outside

Adds a handler when clicking outside the element.

## Usage:

```html
<template>
	<div v-click-outside="() => (count = count + 1)">
		You have clicked outside this div {{ count }} times.
	</div>
</template>
```

For more control, you can pass an option with the following properties:

```html
<template>
	<div
		v-click-outside="{
			handler: () => (count = count + 1),
			middleware: () => true,
			events: ['pointerdown'],
			disabled: false
		}"
	>
		You have clicked outside this div {{ count }} times.
	</div>
</template>
```

### Options
| Name         | Description                                               | Type                        | Default           |
|--------------|-----------------------------------------------------------|-----------------------------|-------------------|
| `handler`    | Function that is fired when the event is triggered        | `(event: Event) => void`    | `() => undefined` |
| `middleware` | Function that allows you to dynamically fire the handler. | `(event: Event) => boolean` | `() => true`      |
| `events`     | Array of individual events that the directive triggers on | `string[]`                  | `['pointerdown']` |
| `disabled`   | Disable the directive completely                          | `boolean`                   | `false`            |
