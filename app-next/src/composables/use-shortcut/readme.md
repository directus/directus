# `useShortcut`

```ts
function useShortcut(
	shortcut: string | string[],
	handler: handler: (evt?: ExtendedKeyboardEvent, combo?: string) => void
): void
```

Can be used to attach a global keyboard shortcut to a function. Removes the shortcut once the current
component unmounts

## Usage
```js
import { defineComponent } from '@vue/composition-api';
import { useShortcut } from '@/composables/use-shortcut';

export default defineComponent({
	setup(props) {
		useShortcut('meta+s', save);

		function save() {
			// ...
		}
	}
});
```

