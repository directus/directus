# `useWindowSize`

```ts
function useWindowSize(options: WindowSizeOptions = { throttle: 100 }): { width: Ref<number>; height: Ref<number>; }
```

Returns the window's width and height in an object. These values are reactive.

The optional `options` parameter allows you to set the throttling speed.

## Usage
```js
import { defineComponent } from '@vue/composition-api';
import { useWindowSize } from '@/composables/use-window-size/';

export default defineComponent({
	setup(props) {
		const { width, height } = useWindowSize();
	}
});
```
