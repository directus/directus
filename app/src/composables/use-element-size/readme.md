# `useElementSize`

```ts
function useElementSize(element: Element): { width: Ref<number>, height: Ref<number> }
```

Allows you to reactively watch an elements width and height.

## Usage
```vue
<template>
	<div ref="el">
		My size is: {{ width }} x {{ height }}
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useElementSize } from '@/composables/use-element-size';

export default defineComponent({
	setup(props) {
		const el = ref<Element>(null);
		const { width, height } = useElementSize(el);
		return { el, width, height };
	}
});
</script>
```
