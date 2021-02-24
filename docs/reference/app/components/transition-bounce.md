# Transition Bounce

Bounces items in or out depending if the get added or removed from the view.

```html
<template>
	<div>
		<v-button @click="toggle">Click me!</v-button>

		<transition-bounce>
			<div v-if="active">More content</div>
		</transition-bounce>
	</div>
</template>

<script lang="ts">
	import { defineComponent, ref } from '@vue/composition-api';

	export default defineComponent({
		setup(props) {
			const active = ref<boolean>(false);

			return { active, toggle };

			function toggle() {
				active.value = !active.value;
			}
		},
	});
</script>
```

## Reference

#### Slots

| Slot      | Description                                  | Data |
| --------- | -------------------------------------------- | ---- |
| _default_ | The elements that should get animated in/out |      |
