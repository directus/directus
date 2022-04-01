# `useScrollDistance`

```ts
function useScrollDistance<T extends Element>(
	t: T | Ref<T | null | ComponentPublicInstance>
): { top: Ref<number>; left: Ref<number>; target: Element };
```

Returns a ref for the top and left scroll positions of the given element. Parameter supports Element, Ref<Element>,
Ref<ComponentPublicInstance>, and Ref<null>.

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
	import { defineComponent, ComponentPublicInstance } from 'vue';

	export default defineComponent({
		setup() {
			const el = ref<ComponentPublicInstance>(null);

			const { top, left } = useScrollDistance(el);

			return { el };
		},
	});
</script>
```
