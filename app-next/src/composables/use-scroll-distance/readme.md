# `useScrollDistance`

```ts
function useScrollDistance<T extends Element>(t: T | Ref<T | null | Vue>): { top: Ref<number>, left: Ref<number>, target: Element }
```

Returns a ref for the top and left scroll positions of the given element. Parameter supports Element, Ref<Element>, Ref<Vue>, and Ref<null>.

## Usage

```html
<template>
	<v-sheet
		ref="el"
		style="
			--v-sheet-max-width: 150px;
			--v-sheet-max-height: 150px;
			overflow: auto;
		"
	>
		<div style="width: 600px; height: 600px;" />
	</v-sheet>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	setup() {
		const el = ref<Vue>(null);

		const { top, left } = useScrollDistance(el);

		return { el };
	}
});
</script>
```
