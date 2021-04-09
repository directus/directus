# Transition Expand

Use around a `v-if` or `v-show` component to have it expand in and out of view.

```html
<template>
	<div>
		<v-button @click="toggle">Click me!</v-button>

		<transition-expand>
			<div v-if="active">More content</div>
		</transition-expand>
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

#### Props

| Prop                    | Description                                        | Default | Type      |
| ----------------------- | -------------------------------------------------- | ------- | --------- |
| `x-axis`                | Expand on the horizontal instead vertical axis     | `false` | `Boolean` |
| `expanded-parent-class` | Add a custom class to the element that is expanded | `''`    | `String`  |

#### Slots

| Slot      | Description                              | Data |
| --------- | ---------------------------------------- | ---- |
| _default_ | Elements that should be animated go here |      |

#### Events

n/a

#### CSS Variables

n/a
