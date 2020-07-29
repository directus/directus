# Item Group

Provides the ability to make groups of items out of any nested component. Can be reused to make more advanced selectable elements like a list of cards, or a button group.

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
	}
});
</script>
```

The `v-item-group` component will keep the final state for the selection; every nested `v-item` component will be registered to the context of the first `v-item-group` parent up in the tree. This means that `v-item` can be in any nested component or sibling:

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

Every `v-item` provides the `active` state and a `toggle` function to the default slot. Use this to render custom markup / styling and to toggle the active state for this item:

```html
<v-item v-slot:default="{ active, toggle }">
	<p :class="{ active }">
		Am I active? {{ active }}
	</p>
	<v-button @click="toggle">Toggle active state</v-button>
</v-item>
```

### Custom values

By default, the `v-item-group` component will use the index of the child as model value (eg `[2, 4]`). The child `v-item` component accepts a `value` prop that lets you choose what is used as identifier for the v-item. This can be useful when you're working with a predefined list of items:

```html
<template>
	<v-item-group v-model="selection">
		<v-item v-for="item in items" :value="item.id">
			{{ item.title }}
		</v-item>
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
				title: 'Hello world'
			},
			{
				id: 414,
				title: 'This might be the hardest component i built'
			},
			{
				id: 'jolly',
				title: 'Goooooood times'
			}
		];
		return { selection };
	}
});
</script>
```

In this case, the selection state for all items selected would be `[15, 414, 'jolly']`

## Props

### Item Group (`v-item-group`)
| Prop        | Description                                             | Default |
|-------------|---------------------------------------------------------|---------|
| `mandatory` | Require an item to be selected                          | `false` |
| `max`       | Only allow a maximum of n items                         | `-1`    |
| `multiple`  | Allow multiple items to be selected                     | `false` |
| `value`     | The v-model value. Selection of indexes / custom values | --      |

### Item (`v-item`)
| Prop    | Description                               | Default |
|---------|-------------------------------------------|---------|
| `value` | Custom value to be used in v-model values | --*     |

\* `value` defaults to the index of the item in the markup if value isn't set

## Slots

### Item Group (`v-item-group`)
| Slot      | Description | Data |
|-----------|-------------|------|
| _default_ |             | --   |

### Item (`v-item`)
| Slot      | Description | Data                                    |
|-----------|-------------|-----------------------------------------|
| _default_ |             | { active: boolean, toggle: () => void } |

## Events

### Item Group (`v-item-group`)
| Event   | Description                      | Data                  |
|---------|----------------------------------|-----------------------|
| `input` | Used to update the v-model value | `(string | number)[]` |

### Item (`v-item`)
n/a

## CSS Variables

### Item Group (`v-item-group`)
n/a

### Item (`v-item`)
n/a
