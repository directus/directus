import { isEqual, isNil } from 'lodash';
import { computed, inject, nextTick, onBeforeUnmount, provide, ref, shallowRef, Ref, watch } from 'vue';

export type GroupableInstance = {
	active: Ref<boolean>;
	value: string | number | undefined;
};

/**
 * Used to make child item part of the group context. Needs to be used in a component that is a child
 * of a component that has the `useGroupableParent` composition enabled
 */
type GroupableOptions = {
	value?: string | number;
	group?: string;
	active?: Ref<boolean>;
	watch?: boolean;
};

type UsableGroupable = {
	active: Ref<boolean>;
	toggle: () => void;
	activate: () => void;
	deactivate: () => void;
};

export function useGroupable(options?: GroupableOptions): UsableGroupable {
	// Injects the registration / toggle functions from the parent scope
	const parentFunctions = inject(options?.group || 'item-group', null);

	if (isNil(parentFunctions)) {
		return {
			active: ref(false),
			toggle: () => {
				// Do nothing
			},
			activate: () => {
				// Do nothing
			},
			deactivate: () => {
				// Do nothing
			},
		};
	}

	const {
		register,
		unregister,
		toggle,
		selection,
	}: {
		register: (item: GroupableInstance) => void;
		unregister: (item: GroupableInstance) => void;
		toggle: (item: GroupableInstance) => void;
		selection: Ref<(number | string)[]>;
	} = parentFunctions;

	let startActive = false;

	if (options?.active?.value === true) startActive = true;
	if (options?.value && selection.value.includes(options.value)) startActive = true;

	const active = ref(startActive);
	const item = { active, value: options?.value };

	register(item);

	if (options?.active !== undefined && options.watch === true) {
		watch(options.active, () => {
			if (options.active === undefined) return;

			if (options.active.value === true) {
				if (active.value === false) toggle(item);
				active.value = true;
			}

			if (options.active.value === false) {
				if (active.value === true) toggle(item);
				active.value = false;
			}
		});
	}

	onBeforeUnmount(() => unregister(item));

	return {
		active,
		toggle: () => {
			toggle(item);
		},
		activate: () => {
			if (active.value === false) toggle(item);
		},
		deactivate: () => {
			if (active.value === true) toggle(item);
		},
	};
}

type GroupableParentState = {
	selection?: Ref<(string | number)[] | undefined> | Ref<readonly (string | number)[] | undefined>;
	onSelectionChange?: (newSelectionValues: readonly (string | number)[]) => void;
	onToggle?: (item: GroupableInstance) => void;
};

type GroupableParentOptions = {
	mandatory?: Ref<boolean>;
	max?: Ref<number>;
	multiple?: Ref<boolean>;
};

type UsableGroupableParent = {
	items: Ref<GroupableInstance[]>;
	selection: Ref<readonly (string | number)[]>;
	internalSelection: Ref<(string | number)[]>;
	getValueForItem: (item: GroupableInstance) => string | number;
	updateChildren: () => void;
};

/**
 * Used to make a component a group parent component. Provides the registration / toggle functions
 * to its group children
 */
export function useGroupableParent(
	state: GroupableParentState = {},
	options: GroupableParentOptions = {},
	group = 'item-group'
): UsableGroupableParent {
	// References to the active state and value of the individual child items
	const items = shallowRef<GroupableInstance[]>([]);

	// Internal copy of the selection. This allows the composition to work without the state option
	// being passed
	const internalSelection = ref<(number | string)[]>([]);

	// Uses either the internal state, or the passed in state. Will call the onSelectionChange
	// handler if it's passed
	const selection = computed<readonly (number | string)[]>({
		get() {
			if (!isNil(state.selection) && !isNil(state.selection.value)) {
				return state.selection.value;
			}

			return internalSelection.value;
		},
		set(newSelection) {
			if (!isNil(state.onSelectionChange)) {
				state.onSelectionChange(newSelection);
			}

			internalSelection.value = [...newSelection];
		},
	});

	// Provide the needed functions to all children groupable components. Note: nested item groups
	// will override the item-group namespace, making nested item groups possible.
	provide(group, { register, unregister, toggle, selection });

	// Whenever the value of the selection changes, we have to update all the children's internal
	// states. If not, you can have an activated item that's not actually active.
	watch(selection, updateChildren, { immediate: true });

	// It takes a tick before all children are rendered, this will make sure the start state of the
	// children matches the start selection
	nextTick().then(updateChildren);

	watch(
		() => options?.mandatory?.value,
		(newValue, oldValue) => {
			if (isEqual(newValue, oldValue)) return;

			// If you're required to select a value, make sure a value is selected on first render
			if (!selection.value || (selection.value.length === 0 && options?.mandatory?.value === true)) {
				if (items.value[0]) selection.value = [getValueForItem(items.value[0])];
			}
		}
	);

	// These aren't exported with any particular use in mind. It's mostly for testing purposes.
	// Treat them as readonly.
	return { items, selection, internalSelection, getValueForItem, updateChildren };

	// Register a child within the context of this group
	function register(item: GroupableInstance) {
		items.value = [...items.value, item];
		const value = getValueForItem(item);

		// If you're required to select a value, make sure a value is selected on first render
		if (selection.value.length === 0 && options?.mandatory?.value === true && items.value.length === 1) {
			selection.value = [value];
		}

		if (item.active.value && selection.value.includes(value) === false) {
			toggle(item);
		}
	}

	// Remove a child within the context of this group. Needed to avoid memory leaks.
	function unregister(item: GroupableInstance) {
		items.value = items.value.filter((existingItem: any) => {
			return existingItem !== item;
		});
	}

	// Toggle the active state for the given item
	function toggle(item: GroupableInstance) {
		if (options?.multiple?.value === true) {
			toggleMultiple(item);
		} else {
			toggleSingle(item);
		}

		if (!isNil(state.onToggle)) {
			state.onToggle(item);
		}
	}

	function toggleSingle(item: GroupableInstance) {
		const itemValue = getValueForItem(item);

		if (selection.value[0] === itemValue && options?.mandatory?.value !== true) {
			selection.value = [];
			return;
		}

		if (selection.value[0] !== itemValue) {
			selection.value = [itemValue];
		}
	}

	function toggleMultiple(item: GroupableInstance) {
		const itemValue = getValueForItem(item);

		// Remove the item if it is already selected. Don't remove it if it's the last item and
		// the mandatory option is set
		if (selection.value.includes(itemValue)) {
			if (options?.mandatory?.value === true && selection.value.length === 1) {
				updateChildren();
				return;
			}

			selection.value = selection.value.filter((value) => value !== itemValue);
			return;
		}

		// Don't add it if when we're already at the maximum number of selections
		if (options?.max?.value && options.max.value !== -1 && selection.value.length >= options.max.value) {
			// Even though we don't alter selection, we should flush the internal active state of
			// the children to make sure we don't have any invalid internal active states
			updateChildren();
			return;
		}

		// Add the selected item to the selection
		selection.value = [...selection.value, itemValue];
	}

	// Converts the item reference into the value that's used in the selection. This value is either
	// the index of the item in the items array (by default), or the custom value that's passed in
	// the groupable composition
	function getValueForItem(item: GroupableInstance) {
		return item.value || items.value.findIndex((child) => item === child);
	}

	// Loop over all children and make sure their internal active state matches the selection array
	// of the parent
	function updateChildren() {
		items.value.forEach((item) => {
			item.active.value = selection.value.includes(getValueForItem(item));
		});
	}
}
