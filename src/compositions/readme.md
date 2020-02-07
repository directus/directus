# Compositions

Compositions are reusable pieces of logic that can be used inside Vue components (Composition API required).

## Table of Contents

* [Event Listener](#event-listener)
* [Time from Now](#time-from-now)
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


## Time from Now

Returns ref string time from current datetime based on date-fns formatDistance.

### Usage

```js
import { createComponent } from '@vue/composition-api';
import useTimeFromNow from '@/compositions/time-from-now';

export default createComponent({
	setup() {
		const date = new Date('2020-01-01T13:55');
		const timeFromNow = useTimeFromNow(date);
	}
});
```

The composition accepts an optional second parameter that controls how often the value is update. You can set this to `0` if you don't want the value to update at all.

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
