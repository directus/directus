# `useEventListener`

```ts
function useEventListener(target: HTMLElement, type: string, handler: (event: Event) => void, options:
AddEventListenerOptions): void
```

Can be used to attach an event listener to any DOM element that will automatically be attached /
cleaned up whenever the component mounts / unmounts.

## Usage
```js
import { defineComponent } from '@vue/composition-api';
import { useEventListener } from '@/composables/use-event-listener';

export default defineComponent({
	setup(props) {
		useEventListener(document.querySelector('#example'), 'click', onExampleClick);

		function onExampleClick(event) {
			// ...
		}
	}
});
```
