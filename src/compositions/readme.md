# Compositions

Compositions are reusable pieces of logic that can be used inside Vue components (Composition API required).

## Table of Contents

* [Event Listener](#event-listener)
* [Size Class](#size-class)
* [Time from Now](#time-from-now)
* [Window Size](#window-size)

## Event Listener

The event listener composition allows you to bound event listeners to global elements.

**Note:** You should rely on Vue's event handlers like `@click` whenever possible. This composition acts as an escape hatch for triggering things based on out-of-component events.

The composition removes the event handler whenever the component is unmounted.

### Usage

```js
import { defineComponent } from '@vue/composition-api';
import useEventListener from '@/compositions/use-event-listener';

export default defineComponent({
	setup() {
		useEventListener(window, 'scroll', onScroll);

		function onScroll(event) {
			console.log(event);
		}
	}
});
```

---

## Size Class

Shared size class prop handler for base components. Adds `x-small`, `small`, `large`, and `x-large` props to the component, and converts the prop into a string that can be added to classes.

### Usage

```js
import { defineComponent } from '@vue/composition-api';
import useSizeClass, { sizeProps } from '@/compositions/size-class';

export default defineComponent({
	props: {
		...sizeProps
	},
	setup(props) {
		const sizeClass = useSizeClass(props);
	}
});
```

---

## Time from Now

Returns ref string time from current datetime based on date-fns formatDistance.

### Usage

```js
import { defineComponent } from '@vue/composition-api';
import useTimeFromNow from '@/compositions/use-time-from-now';

export default defineComponent({
	setup() {
		const date = new Date('2020-01-01T13:55');
		const timeFromNow = useTimeFromNow(date);
	}
});
```

The composition accepts an optional second parameter that controls how often the value is update. You can set this to `0` if you don't want the value to update at all.

---

## Window Size

Returns a `ref` of `width` and `height` of the current window size. Updates the value on window resizes.

### Usage

```js
import { defineComponent } from '@vue/composition-api';
import useWindowSize from '@/compositions/window-size';

export default defineComponent({
	setup() {
		const { width, height } = useWindowSize();
	}
});
```
