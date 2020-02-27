import Vue from 'vue';
import { computed, onBeforeUnmount, inject, ref, provide, Ref, watch } from '@vue/composition-api';
import { notEmpty, isEmpty } from '@/utils/is-empty';

type GroupableInstance = {
	active: Ref<boolean>;
	value: string | number | undefined;
};

/**
 * Used to make child item part of the group context. Needs to be used in a component that is a child
 * of a component that has the `useGroupableParent` composition enabled
 */
export function useGroupable(value?: string | number) {
	// Injects the registration / toggle functions from the parent scope
	const parentFunctions = inject('item-group');

	// If we're outside of a parent group scope, return immediately
	if (isEmpty(parentFunctions)) {
		throw new Error('useGroupable used out of group item parent context');
	}

	const {
		register,
		unregister,
		toggle
	}: {
		register: (item: GroupableInstance) => void;
		unregister: (item: GroupableInstance) => void;
		toggle: (item: GroupableInstance) => void;
	} = parentFunctions;

	const active = ref(false);
	const item = { active, value };

	register(item);
	onBeforeUnmount(() => unregister(item));

	return {
		active,
		toggle: () => {
			active.value = !active.value;
			toggle(item);
		}
	};
}

type GroupableParentState = {
	selection?: Ref<(string | number)[]>;
	onSelectionChange?: (newSelectionValues: readonly (string | number)[]) => void;
};

type GroupableParentOptions = {
	mandatory?: Ref<boolean>;
	max?: Ref<number>;
	multiple?: Ref<boolean>;
};

/**
 * Used to make a component a group parent component. Provides the registration / toggle functions
 * to its group children
 */
export function useGroupableParent(
	state: GroupableParentState = {},
	options: GroupableParentOptions = {}
) {
	// References to the active state and value of the individual child items
	const items = ref<GroupableInstance[]>([]);

	// Internal copy of the selection. This allows the composition to work without the state option
	// being passed
	const _selection = ref<(number | string)[]>([]);

	// Uses either the internal state, or the passed in state. Will call the onSelectionChange
	// handler if it's passed
	const selection = computed<(number | string)[]>({
		get() {
			if (notEmpty(state.selection) && notEmpty(state.selection.value)) {
				return state.selection.value;
			}

			return _selection.value;
		},
		set(newSelection) {
			if (notEmpty(state.onSelectionChange)) {
				state.onSelectionChange(newSelection);
			}

			_selection.value = newSelection;
		}
	});

	// Provide the needed functions to all children groupable components. Note: nested item groups
	// will override the item-group namespace, making nested item groups possible.
	provide('item-group', { register, unregister, toggle });

	// Whenever the value of the selection changes, we have to update all the children's internal
	// states. If not, you can have an activated item that's not actually active.
	watch(() => selection.value, updateChildren);

	// It takes a tick before all children are rendered, this will make sure the start state of the
	// children matches the start selection
	Vue.nextTick().then(updateChildren);

	// These aren't exported with any particular use in mind. It's mostly for testing purposes.
	// Treat them as readonly.
	return { items, selection, _selection, getValueForItem, updateChildren };

	// Register a child within the context of this group
	function register(item: GroupableInstance) {
		items.value = [...items.value, item];

		// If you're required to select a value, make sure a value is selected on first render
		if (
			selection.value.length === 0 &&
			options?.mandatory?.value === true &&
			items.value.length === 1
		) {
			selection.value = [getValueForItem(item)];
		}
	}

	// Remove a child within the context of this group. Needed to avoid memory leaks.
	function unregister(item: GroupableInstance) {
		items.value = items.value.filter(existingItem => {
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
	}

	function toggleSingle(item: GroupableInstance) {
		const itemValue = getValueForItem(item);

		if (selection.value[0] === itemValue && options?.mandatory?.value !== true) {
			selection.value = [];
			return;
		}

		selection.value = [itemValue];
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

			selection.value = selection.value.filter(value => value !== itemValue);
			return;
		}

		// Don't add it if when we're already at the maximum number of selections
		if (
			options?.max?.value &&
			options.max.value !== -1 &&
			selection.value.length >= options.max.value
		) {
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
		return item.value || items.value.findIndex(child => item === child);
	}

	// Loop over all children and make sure their internal active state matches the selection array
	// of the parent
	function updateChildren() {
		items.value.forEach(item => {
			item.active.value = selection.value.includes(getValueForItem(item));
		});
	}
}
