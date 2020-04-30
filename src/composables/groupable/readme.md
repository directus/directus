# `useGroupable` / `useGroupableParent`
Can be used to make a selectable group of items within a parent container. This is used to facilitate
the functionality of the `v-item-group` base component, and other groupable components like `detail-group`,
`button-group`.

## Usage

Use the `useGroupableParent` function in a parent component that will contain one or more components
in it's slots (deeply nested or not) that use the `useGroupable` composables.

### `useGroupableParent(state: GroupableParentState, options: GroupableParentOptions, group: string): void`

The `useGroupableParent` composition accepts two paremeters: state and options.
State includes a `selection` key that can be used to pass an array of selected items, so you can
manage this active state from the parent context. The `onSelectionChange` property of state is a
callback function that fires whenever the selection changes from a child groupable item.

The `options` parameter can be used to set some behavioral options for the selection logic. These
options include `multiple: boolean`, `max: number`, `mandatory: boolean`.

```js
import { defineComponent } from '@vue/composition-api';
import { useGroupableParent } from '@/composables/size-class/';

export default defineComponent({
	props: {
		...sizeProps
	},
	setup(props) {
		useGroupableParent(
			{
				selection: selection,
				onSelectionChange: newSelectionValues => emit('input', newSelectionValues)
			},
			{
				multiple: multiple,
				max: max,
				mandatory: mandatory
			}
		);
	}
});
```

The optional group parameter allows you to control to what group this parent is registered. This
can be useful when you have complexly nested groups.

### `useGroupable(value: string | number | undefined, group: string): { active: Ref<boolean>; toggle: () => void; }`
Registers this component as a child of the first parent component that uses the `useGroupableParent`
component.

The `useGroupable` composition accepts a single parameter (`value`) that will be used in the selection
state of the groupable parent. The composition returns an object with the active state, and a function
that will toggle this component's active state in the parent's selection.

```js
import { defineComponent } from '@vue/composition-api';
import { useGroupable } from '@/composables/groupable';

export default defineComponent({
	setup(props) {
		const { active, toggle } = useGroupable('unique-value-for-this-item');
		return { active, toggle };
	}
});
```

The optional group parameter allows you to control to what group this child is registered. This
can be useful when you have complexly nested groups.
