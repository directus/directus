# `useSizeClass`

```ts
function useSizeClass(props: {
	xSmall: boolean;
	small: boolean;
	large: boolean;
	xLarge: boolean;
}): string;
```

Set of props and a composition that can inject a standardized sizing prop for components.

A component that uses this composition and the corresponding props will accept the `x-small` through
`x-large` props:

```html
<v-button x-small />
<v-button small />
<v-button large />
<v-button x-large />
```

## Usage
```js
import { defineComponent } from '@vue/composition-api';
import useSizeClass, { sizeProps } from '@/composables/size-class/';

export default defineComponent({
	props: {
		...sizeProps
	},
	setup(props) {
		const sizeClass = useSizeClass(props);
		return { sizeClass }; // one of x-small, small, large, x-large
	}
});
```
