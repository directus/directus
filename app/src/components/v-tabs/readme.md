# Tabs

Tabs can be used for hiding content behind a selectable item. It can be used as a navigational
device.

## Usage

```html
<template>
	<v-tabs v-model="selection">
		<v-tab><v-icon name="home" left /> Home</v-tab>
		<v-tab><v-icon name="notifications" left /> News</v-tab>
		<v-tab><v-icon name="help" left /> Help</v-tab>
	</v-tabs>

	<v-tabs-items v-model="selection">
		<v-tab-item>I'm the content for Home!</v-tab-item>
		<v-tab-item>I'm the content for News!</v-tab-item>
		<v-tab-item>I'm the content for Help!</v-tab-item>
	</v-tabs-items>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
	setup() {
		const selection = ref([]);
		return { selection };
	}
});
</script>
```

## Props
| Prop       | Description                        | Default |
|------------|------------------------------------|---------|
| `vertical` | Render the tabs vertically         | `false` |
| `value`    | v-model value for active selection | --      |


## Events
| Event   | Description              | Value                          |
|---------|--------------------------|--------------------------------|
| `input` | Update current selection | `readonly (string | number)[]` |

## Slots
| Slot      | Description | Data |
|-----------|-------------|------|
| _default_ |             |      |

## CSS Variables
| Variable                   | Default                   |
|----------------------------|---------------------------|
| `--v-tabs-underline-color` | `var(--foreground-normal)` |
