# Item Group

Provides the ability to make groups of items out of any nested component. Can be reused to make more advanced selectable
elements like a list of cards, or a button group.

## Usage

```html
<template>
	<v-item-group v-model="selection">
		<div class="whatever-nested-markup">
			<v-item v-slot:default="{ active, toggle }" v-for="n in 5">
				<p :class="{ active }">Item {{ n }}</p>
				<v-button @click="toggle">Click me to {{ active ? 'activate' : 'deactivate' }}</v-button>
			</v-item>
		</div>
	</v-item-group>
</template>

<script lang="ts">
	import { defineComponent, ref } from '@vue/composition-api';

	export default defineComponent({
		setup() {
			const selection = ref([]);
			return { selection };
		},
	});
</script>
```

The `v-item-group` component will keep the final state for the selection; every nested `v-item` component will be
registered to the context of the first `v-item-group` parent up in the tree. This means that `v-item` can be in any
nested component or sibling:

```html
<v-item-group>
	<v-item />
	<div>
		<v-item />
	</div>
	<div>
		<v-button>
			<v-item />
		</v-button>
	</div>
</v-item-group>
```

It also means you can theoretically nest item-groups inside of items:

```html
<v-item-group>
	<v-item />
	<div>
		<v-item>
			<v-item-group>
				<v-item />
				<div>
					<v-item />
				</div>
				<div>
					<v-button>
						<v-item />
					</v-button>
				</div>
			</v-item-group>
		</v-item>
	</div>
	<div>
		<v-button>
			<v-item />
		</v-button>
	</div>
</v-item-group>
```

(That being said, if you ever find yourself in this situation, think long and hard if what you're doing makes sense)

### Active / Toggle

Every `v-item` provides the `active` state and a `toggle` function to the default slot. Use this to render custom markup
/ styling and to toggle the active state for this item:

```html
<v-item v-slot:default="{ active, toggle }">
	<p :class="{ active }">Am I active? {{ active }}</p>
	<v-button @click="toggle">Toggle active state</v-button>
</v-item>
```

### Custom values

By default, the `v-item-group` component will use the index of the child as model value (eg `[2, 4]`). The child
`v-item` component accepts a `value` prop that lets you choose what is used as identifier for the v-item. This can be
useful when you're working with a predefined list of items:

```html
<template>
	<v-item-group v-model="selection">
		<v-item v-for="item in items" :value="item.id">{{ item.title }}</v-item>
	</v-item-group>
</template>

<script lang="ts">
	import { defineComponent, ref } from '@vue/composition-api';

	export default defineComponent({
		setup() {
			const selection = ref([]);
			const items = [
				{
					id: 15,
					title: 'Hello world',
				},
				{
					id: 414,
					title: 'This might be the hardest component i built',
				},
				{
					id: 'jolly',
					title: 'Goooooood times',
				},
			];
			return { selection };
		},
	});
</script>
```

In this case, the selection state for all items selected would be `[15, 414, 'jolly']`

## Reference

#### Props

| Prop        | Description                                           | Default        | Type                   |
| ----------- | ----------------------------------------------------- | -------------- | ---------------------- |
| `value`     | Used with `v-model` to model the selected items       | `undefined`    | `(string or number)[]` |
| `mandatory` | If enabled, at least one item has to be selected      | `false`        | `Boolean`              |
| `max`       | The maximum amount of items that can be selected      | `-1`           | `Number`               |
| `multiple`  | If enabled, multiple elements can be selected         | `false`        | `Boolean`              |
| `scope`     | Items that do not have the same scope will be ignored | `'item-group'` | `String`               |

#### Events

| Event   | Description                      | Value                |
| ------- | -------------------------------- | -------------------- |
| `input` | Used to update the modeled value | (String or Number)[] |

#### Slots

| Slot      | Description                                                 | Data |
| --------- | ----------------------------------------------------------- | ---- |
| _default_ | All items placed inside here will be part of the item group |      |
