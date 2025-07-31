import { nanoid } from 'nanoid';
import type { ComputedRef, Ref } from 'vue';
import { computed, ref, watch } from 'vue';

export type UsableCustomSelection = {
	otherValue: Ref<string | null>;
	usesOtherValue: ComputedRef<boolean>;
};

/**
 * A Vue composable for managing custom selection values that aren't present in a predefined list of items.
 *
 * This composable is typically used in form components where users can select from a predefined list
 * of options, but also have the ability to enter custom values that aren't in the list. It manages
 * the state and logic for detecting when a custom value is being used and provides a reactive
 * interface for getting and setting custom values.
 *
 * @param currentValue - A reactive reference to the currently selected value. Can be null if no value is selected.
 * @param items - A reactive reference to the array of available predefined items. Each item should have a 'value' property.
 * @param emit - A callback function to emit value changes to the parent component.
 *
 * @returns An object containing:
 * - `otherValue` - A computed ref for getting/setting custom values. Returns current value when using custom,
 *   empty string otherwise. Setting triggers the emit callback.
 * - `usesOtherValue` - A computed boolean indicating whether the current value is a custom value
 *   (not found in the predefined items list).
 *
 * @example
 * ```typescript
 * const currentValue = ref('custom-option');
 * const items = ref([
 *   { value: 'option1', label: 'Option 1' },
 *   { value: 'option2', label: 'Option 2' }
 * ]);
 * const emit = (value: string | null) => console.log('Value changed:', value);
 *
 * const { otherValue, usesOtherValue } = useCustomSelection(currentValue, items, emit);
 *
 * console.log(usesOtherValue.value); // true (custom-option not in items)
 * console.log(otherValue.value); // 'custom-option'
 *
 * otherValue.value = 'new-custom-value'; // Triggers emit with 'new-custom-value'
 * ```
 */
export function useCustomSelection(
	currentValue: Ref<string | null>,
	items: Ref<any[]>,
	emit: (event: string | null) => void,
): UsableCustomSelection {
	const localOtherValue = ref('');

	const otherValue = computed({
		get() {
			return localOtherValue.value || (usesOtherValue.value ? currentValue.value : '');
		},
		set(newValue: string | null) {
			if (newValue === null) {
				localOtherValue.value = '';
				emit(null);
			} else {
				localOtherValue.value = newValue;
				emit(newValue);
			}
		},
	});

	const usesOtherValue = computed(() => {
		if (items.value === null) return false;

		// Check if set value is one of the existing keys
		const values = items.value.map((item) => item.value);
		return (
			currentValue.value !== null && currentValue.value.length > 0 && values.includes(currentValue.value) === false
		);
	});

	return { otherValue, usesOtherValue };
}

export type OtherValue = {
	key: string;
	value: string;
	focus?: boolean;
};

type UsableCustomSelectionMultiple = {
	otherValues: Ref<OtherValue[]>;
	addOtherValue: (value?: string, focus?: boolean) => void;
	setOtherValue: (key: string, newValue: string | null) => void;
};

/**
 * A Vue composable for managing multiple custom selection values that aren't present in a predefined list of items.
 *
 * This composable extends the single custom selection pattern to support multiple values. It's typically used
 * in multi-select form components where users can select multiple predefined options and also add custom
 * values that aren't in the predefined list. It automatically detects custom values in the current selection,
 * manages their state, and provides functions for adding and updating custom values.
 *
 * @param currentValues - A reactive reference to the currently selected values array. Can be null if no values are selected.
 * @param items - A reactive reference to the array of available predefined items. Each item should have a 'value' property.
 * @param emit - A callback function to emit value changes to the parent component.
 *
 * @returns An object containing:
 * - `otherValues` - A reactive array of custom value objects, each with a unique key, value, and optional focus state.
 * - `addOtherValue` - A function to add a new custom value with optional value and focus parameters.
 * - `setOtherValue` - A function to update or remove a custom value by its key, automatically syncing with currentValues.
 *
 * @example
 * ```typescript
 * const currentValues = ref(['option1', 'custom-value1', 'custom-value2']);
 * const items = ref([
 *   { value: 'option1', label: 'Option 1' },
 *   { value: 'option2', label: 'Option 2' }
 * ]);
 * const emit = (values: string[] | null) => console.log('Values changed:', values);
 *
 * const { otherValues, addOtherValue, setOtherValue } = useCustomSelectionMultiple(currentValues, items, emit);
 *
 * console.log(otherValues.value); // [{ key: 'abc123', value: 'custom-value1' }, { key: 'def456', value: 'custom-value2' }]
 *
 * // Add a new custom value
 * addOtherValue('new-custom-value', true);
 *
 * // Update an existing custom value
 * setOtherValue('abc123', 'updated-custom-value');
 *
 * // Remove a custom value
 * setOtherValue('def456', null);
 * ```
 */
export function useCustomSelectionMultiple(
	currentValues: Ref<string[] | null>,
	items: Ref<any[]>,
	emit: (event: string[] | null) => void,
): UsableCustomSelectionMultiple {
	const otherValues = ref<OtherValue[]>([]);

	watch(
		currentValues,
		(newValue) => {
			if (newValue === null) return;
			if (!Array.isArray(newValue)) return;
			if (items.value === null) return;

			(newValue as string[]).forEach((value) => {
				if (items.value === null) return;
				const values = items.value.map((item) => item.value);
				const existsInValues = values.includes(value);

				if (!existsInValues) {
					const other = otherValues.value.map((o) => o.value);
					const existsInOtherValues = other.includes(value);

					if (!existsInOtherValues) {
						addOtherValue(value);
					}
				}
			});
		},
		{ immediate: true },
	);

	return { otherValues, addOtherValue, setOtherValue };

	function addOtherValue(value = '', focus = false) {
		otherValues.value = [
			...otherValues.value,
			{
				key: nanoid(),
				value: value,
				focus,
			},
		];
	}

	function setOtherValue(key: string, newValue: string | null) {
		const previousValue = otherValues.value.find((o) => o.key === key);

		const valueWithoutPrevious = ((currentValues.value || []) as string[]).filter(
			(val) => val !== previousValue?.value,
		);

		if (newValue === null) {
			otherValues.value = otherValues.value.filter((o) => o.key !== key);

			if (valueWithoutPrevious.length === 0) {
				emit(null);
			} else {
				emit(valueWithoutPrevious);
			}
		} else {
			otherValues.value = otherValues.value.map((otherValue) => {
				if (otherValue.key === key) otherValue.value = newValue;
				return otherValue;
			});

			if (valueWithoutPrevious.length === currentValues.value?.length) {
				emit(valueWithoutPrevious);
			} else {
				emit([...valueWithoutPrevious, newValue]);
			}
		}
	}
}
