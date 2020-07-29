# Button Group

Provides the ability to make groups of buttons. Uses the v-item-group component and adds styling to the buttons.
For more information about how to use groups, look into v-item-group.

## Usage

```html
<template>
	<v-button-group v-model="selection">
		<v-button v-slot:default="{ active }">
			Click me to {{ active ? 'activate' : 'deactivate' }}
		</v-button>
	</v-button-group>
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

| Prop        | Description                                             | Default |
|-------------|---------------------------------------------------------|---------|
| `mandatory` | Require an item to be selected                          | `false` |
| `max`       | Only allow a maximum of n items                         | `-1`    |
| `multiple`  | Allow multiple items to be selected                     | `false` |
| `value`     | The v-model value. Selection of indexes / custom values | --      |
| `rounded`   | Adds rounded corners to the sides                       | `false` |
| `tile`      | Adds sharp corners to the sides                         | `false` |


## Slots

| Slot      | Description | Data |
|-----------|-------------|------|
| _default_ |             | --   |

## Events

| Event   | Description                      | Data                  |
|---------|----------------------------------|-----------------------|
| `input` | Used to update the v-model value | `(string | number)[]` |


## CSS Variables

| Variable                                   | Default                                            |
|--------------------------------------------|----------------------------------------------------|
| `--v-button-group-background-color-active` | `var(--primary-alt)`  |




