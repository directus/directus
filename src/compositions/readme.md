# Compositions

Compositions are reusable snippets of functionality that can be used in Vue components.

## Table of Contents

* [Event Listener](#event-listener)
* [Window Size](#window-size)

## Event Listener

The event listener composition allows you to bound event listeners to global elements.

**Note:** You should rely on Vue's event handlers like `@click` whenever possible. This composition acts as an escape hatch for triggering things based on out-of-component events.

The composition removes the event handler whenever the component is unmounted.

### Usage

```js
import { createComponent } from '@vue/composition-api';
import useEventListener from '@/compositions/event-listener';

export default createComponent({
	setup() {
		useEventListener(window, 'scroll', onScroll);

		function onScroll(event) {
			console.log(event);
		}
	}
});
```

## Window Size

Returns a `ref` of `width` and `height` of the current window size. Updates the value on window resizes.

### Usage

```js
import { createComponent } from '@vue/composition-api';
import useWindowSize from '@/compositions/window-size';

export default createComponent({
	setup() {
		const { width, height } = useWindowSize();
	}
});
```
