# `transition-expand`

Use around a `v-if` or `v-show` component to have it expand in and out of view.

## Usage

```html
<template>
	<div>
		<v-button @click="toggle">Click me!</v-button>

		<transition-expand>
			<div v-if="active">
				More content
			</div>
		</transition-expand>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
	setup(props) {
		const active = ref<boolean>(false);

		return { active, toggle };

        function toggle() { active.value = !active.value; };
	}
});
</script>
```

## Props
| Prop                    | Description                                        | Default |
|-------------------------|----------------------------------------------------|---------|
| `x-axis`                | Expand on the horizontal instead vertical axis     | `false` |
| `expanded-parent-class` | Add a custom class to the element that is expanded | `''`    |

## Slots
| Slot      | Description | Data |
|-----------|-------------|------|
| _default_ |             |      |

## Events
n/a

## CSS Variables
n/a
