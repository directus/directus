import { beforeEach, describe, expect, test, vi } from 'vitest';
import { nextTick, ref, type Ref } from 'vue';
import { useCustomSelection, useCustomSelectionMultiple } from './use-custom-selection';

describe('useCustomSelection', () => {
	let currentValue: Ref<string | null>;
	let items: Ref<any[]>;
	let emit: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		currentValue = ref<string | null>(null);

		items = ref([
			{ value: 'option1', label: 'Option 1' },
			{ value: 'option2', label: 'Option 2' },
			{ value: 'option3', label: 'Option 3' },
		]);

		emit = vi.fn();
	});

	describe('usesOtherValue computed', () => {
		test('should return false when items is null', () => {
			(items as any).value = null;
			currentValue.value = 'custom-value';

			const { usesOtherValue } = useCustomSelection(currentValue, items, emit);

			expect(usesOtherValue.value).toBe(false);
		});

		test('should return false when currentValue is null', () => {
			currentValue.value = null;

			const { usesOtherValue } = useCustomSelection(currentValue, items, emit);

			expect(usesOtherValue.value).toBe(false);
		});

		test('should return false when currentValue is empty string', () => {
			currentValue.value = '';

			const { usesOtherValue } = useCustomSelection(currentValue, items, emit);

			expect(usesOtherValue.value).toBe(false);
		});

		test('should return false when currentValue exists in items', () => {
			currentValue.value = 'option1';

			const { usesOtherValue } = useCustomSelection(currentValue, items, emit);

			expect(usesOtherValue.value).toBe(false);
		});

		test('should return true when currentValue is custom (not in items)', () => {
			currentValue.value = 'custom-value';

			const { usesOtherValue } = useCustomSelection(currentValue, items, emit);

			expect(usesOtherValue.value).toBe(true);
		});

		test('should update when currentValue changes', () => {
			currentValue.value = 'option1';

			const { usesOtherValue } = useCustomSelection(currentValue, items, emit);

			expect(usesOtherValue.value).toBe(false);

			currentValue.value = 'custom-value';
			expect(usesOtherValue.value).toBe(true);

			currentValue.value = 'option2';
			expect(usesOtherValue.value).toBe(false);
		});

		test('should update when items change', () => {
			currentValue.value = 'option4';

			const { usesOtherValue } = useCustomSelection(currentValue, items, emit);

			expect(usesOtherValue.value).toBe(true);

			// Add option4 to items
			items.value = [...(items.value || []), { value: 'option4', label: 'Option 4' }];
			expect(usesOtherValue.value).toBe(false);
		});
	});

	describe('otherValue computed getter', () => {
		test('should return empty string when not using other value', () => {
			currentValue.value = 'option1';

			const { otherValue } = useCustomSelection(currentValue, items, emit);

			expect(otherValue.value).toBe('');
		});

		test('should return currentValue when using other value', () => {
			currentValue.value = 'custom-value';

			const { otherValue } = useCustomSelection(currentValue, items, emit);

			expect(otherValue.value).toBe('custom-value');
		});

		test('should return local other value when it has been set', () => {
			currentValue.value = 'option1';

			const { otherValue } = useCustomSelection(currentValue, items, emit);

			// Set a local other value
			otherValue.value = 'local-custom-value';

			// Should return the local value even though we're not using other value
			expect(otherValue.value).toBe('local-custom-value');
		});

		test('should prioritize local other value over current value', () => {
			currentValue.value = 'custom-value';

			const { otherValue } = useCustomSelection(currentValue, items, emit);

			// Set a local other value
			otherValue.value = 'local-custom-value';

			// Should return the local value, not the current value
			expect(otherValue.value).toBe('local-custom-value');
		});
	});

	describe('otherValue computed setter', () => {
		test('should emit null and clear local value when set to null', () => {
			const { otherValue } = useCustomSelection(currentValue, items, emit);

			otherValue.value = 'some-value';
			emit.mockClear();

			otherValue.value = null;

			expect(emit).toHaveBeenCalledWith(null);
			expect(emit).toHaveBeenCalledTimes(1);

			// Local value should be cleared, so getter should return empty string
			expect(otherValue.value).toBe('');
		});

		test('should emit new value and update local value when set to string', () => {
			const { otherValue } = useCustomSelection(currentValue, items, emit);

			otherValue.value = 'new-custom-value';

			expect(emit).toHaveBeenCalledWith('new-custom-value');
			expect(emit).toHaveBeenCalledTimes(1);
			expect(otherValue.value).toBe('new-custom-value');
		});

		test('should emit each time value is set', () => {
			const { otherValue } = useCustomSelection(currentValue, items, emit);

			otherValue.value = 'value1';
			otherValue.value = 'value2';
			otherValue.value = null;
			otherValue.value = 'value3';

			expect(emit).toHaveBeenNthCalledWith(1, 'value1');
			expect(emit).toHaveBeenNthCalledWith(2, 'value2');
			expect(emit).toHaveBeenNthCalledWith(3, null);
			expect(emit).toHaveBeenNthCalledWith(4, 'value3');
			expect(emit).toHaveBeenCalledTimes(4);
		});
	});

	describe('integration scenarios', () => {
		test('should handle complete workflow of switching between predefined and custom values', () => {
			currentValue.value = 'option1';

			const { otherValue, usesOtherValue } = useCustomSelection(currentValue, items, emit);

			// Initially using predefined value
			expect(usesOtherValue.value).toBe(false);
			expect(otherValue.value).toBe('');

			// Switch to custom value via currentValue
			currentValue.value = 'custom-value';
			expect(usesOtherValue.value).toBe(true);
			expect(otherValue.value).toBe('custom-value');

			// Set custom value via otherValue
			otherValue.value = 'updated-custom-value';
			expect(emit).toHaveBeenCalledWith('updated-custom-value');

			// Clear the custom value - this clears localOtherValue but currentValue is still 'custom-value'
			otherValue.value = null;
			expect(emit).toHaveBeenCalledWith(null);
			// Since currentValue is still 'custom-value' and usesOtherValue is true, getter returns currentValue
			expect(otherValue.value).toBe('custom-value');

			// Switch back to predefined value
			currentValue.value = 'option2';
			expect(usesOtherValue.value).toBe(false);
			expect(otherValue.value).toBe('');
		});

		test('should handle empty items array', () => {
			items.value = [];
			currentValue.value = 'any-value';

			const { usesOtherValue } = useCustomSelection(currentValue, items, emit);

			expect(usesOtherValue.value).toBe(true);
		});

		test('should handle items with different value types', () => {
			items.value = [{ value: 'string-value' }, { value: 123 }, { value: true }];

			currentValue.value = '123'; // String representation of number

			const { usesOtherValue } = useCustomSelection(currentValue, items, emit);

			// Should be custom since '123' (string) !== 123 (number)
			expect(usesOtherValue.value).toBe(true);
		});
	});
});

describe('useCustomSelectionMultiple', () => {
	let currentValues: Ref<string[] | null>;
	let items: Ref<any[]>;
	let emit: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		currentValues = ref<string[] | null>(null);

		items = ref([
			{ value: 'option1', label: 'Option 1' },
			{ value: 'option2', label: 'Option 2' },
			{ value: 'option3', label: 'Option 3' },
		]);

		emit = vi.fn();
	});

	describe('initialization and watch behavior', () => {
		test('should initialize with empty otherValues array', () => {
			const { otherValues } = useCustomSelectionMultiple(currentValues, items, emit);

			expect(otherValues.value).toEqual([]);
		});

		test('should not add other values when currentValues is null', async () => {
			currentValues.value = null;

			const { otherValues } = useCustomSelectionMultiple(currentValues, items, emit);

			await nextTick();
			expect(otherValues.value).toEqual([]);
		});

		test('should not add other values when currentValues is not an array', async () => {
			(currentValues as any).value = 'not-an-array';

			const { otherValues } = useCustomSelectionMultiple(currentValues, items, emit);

			await nextTick();
			expect(otherValues.value).toEqual([]);
		});

		test('should not add other values when items is null', async () => {
			currentValues.value = ['custom-value'];
			(items as any).value = null;

			const { otherValues } = useCustomSelectionMultiple(currentValues, items, emit);

			await nextTick();
			expect(otherValues.value).toEqual([]);
		});

		test('should add other values for custom values in currentValues', async () => {
			currentValues.value = ['option1', 'custom-value1', 'custom-value2'];

			const { otherValues } = useCustomSelectionMultiple(currentValues, items, emit);

			await nextTick();
			expect(otherValues.value).toHaveLength(2);
			expect(otherValues.value[0]?.value).toBe('custom-value1');
			expect(otherValues.value[1]?.value).toBe('custom-value2');
			expect(otherValues.value[0]?.key).toBeDefined();
			expect(otherValues.value[1]?.key).toBeDefined();
		});

		test('should not add duplicate other values', async () => {
			currentValues.value = ['custom-value1', 'custom-value1', 'custom-value2'];

			const { otherValues } = useCustomSelectionMultiple(currentValues, items, emit);

			await nextTick();
			expect(otherValues.value).toHaveLength(2);
			expect(otherValues.value[0]?.value).toBe('custom-value1');
			expect(otherValues.value[1]?.value).toBe('custom-value2');
		});

		test('should update other values when currentValues changes', async () => {
			currentValues.value = ['custom-value1'];

			const { otherValues } = useCustomSelectionMultiple(currentValues, items, emit);

			await nextTick();
			expect(otherValues.value).toHaveLength(1);
			expect(otherValues.value[0]?.value).toBe('custom-value1');

			// Add more custom values
			currentValues.value = ['custom-value1', 'custom-value2', 'option1'];

			await nextTick();
			expect(otherValues.value).toHaveLength(2);
			expect(otherValues.value.some((o) => o.value === 'custom-value1')).toBe(true);
			expect(otherValues.value.some((o) => o.value === 'custom-value2')).toBe(true);
		});

		test('should handle items.value becoming null during initialization', async () => {
			// Start with items having values, then set to null before adding other values
			items.value = [{ text: 'Option 1', value: 'option1' }];
			currentValues.value = ['custom-value1', 'custom-value2'];

			const { otherValues } = useCustomSelectionMultiple(currentValues, items, emit);

			// Immediately set items to null to simulate race condition
			(items as any).value = null;

			await nextTick();

			// Should handle gracefully when items becomes null
			expect(otherValues.value).toHaveLength(2);
			expect(otherValues.value.some((o) => o.value === 'custom-value1')).toBe(true);
			expect(otherValues.value.some((o) => o.value === 'custom-value2')).toBe(true);
		});
	});

	describe('addOtherValue function', () => {
		test('should add other value with default parameters', () => {
			const { otherValues, addOtherValue } = useCustomSelectionMultiple(currentValues, items, emit);

			addOtherValue();

			expect(otherValues.value).toHaveLength(1);
			expect(otherValues.value[0]?.value).toBe('');
			expect(otherValues.value[0]?.focus).toBe(false);
			expect(otherValues.value[0]?.key).toBeDefined();
		});

		test('should add other value with specified value', () => {
			const { otherValues, addOtherValue } = useCustomSelectionMultiple(currentValues, items, emit);

			addOtherValue('custom-value');

			expect(otherValues.value).toHaveLength(1);
			expect(otherValues.value[0]?.value).toBe('custom-value');
			expect(otherValues.value[0]?.focus).toBe(false);
		});

		test('should add other value with focus true', () => {
			const { otherValues, addOtherValue } = useCustomSelectionMultiple(currentValues, items, emit);

			addOtherValue('custom-value', true);

			expect(otherValues.value).toHaveLength(1);
			expect(otherValues.value[0]?.value).toBe('custom-value');
			expect(otherValues.value[0]?.focus).toBe(true);
		});

		test('should add multiple other values', () => {
			const { otherValues, addOtherValue } = useCustomSelectionMultiple(currentValues, items, emit);

			addOtherValue('value1');
			addOtherValue('value2', true);

			expect(otherValues.value).toHaveLength(2);
			expect(otherValues.value[0]?.value).toBe('value1');
			expect(otherValues.value[1]?.value).toBe('value2');
			expect(otherValues.value[1]?.focus).toBe(true);
		});
	});

	describe('setOtherValue function', () => {
		test('should update existing other value', () => {
			currentValues.value = ['option1', 'custom-value1'];

			const { otherValues, setOtherValue } = useCustomSelectionMultiple(currentValues, items, emit);

			// Wait for initial setup
			return new Promise((resolve) => {
				nextTick().then(() => {
					const key = otherValues.value[0]?.key;

					setOtherValue(key!, 'updated-value');

					expect(otherValues.value[0]?.value).toBe('updated-value');
					expect(emit).toHaveBeenCalledWith(['option1', 'updated-value']);
					resolve(undefined);
				});
			});
		});

		test('should remove other value when set to null', () => {
			currentValues.value = ['option1', 'custom-value1'];

			const { otherValues, setOtherValue } = useCustomSelectionMultiple(currentValues, items, emit);

			return new Promise((resolve) => {
				nextTick().then(() => {
					const key = otherValues.value[0]?.key;

					setOtherValue(key!, null);

					expect(otherValues.value).toHaveLength(0);
					expect(emit).toHaveBeenCalledWith(['option1']);
					resolve(undefined);
				});
			});
		});

		test('should emit null when removing last value results in empty array', () => {
			currentValues.value = ['custom-value1'];

			const { otherValues, setOtherValue } = useCustomSelectionMultiple(currentValues, items, emit);

			return new Promise((resolve) => {
				nextTick().then(() => {
					const key = otherValues.value[0]?.key;

					setOtherValue(key!, null);

					expect(otherValues.value).toHaveLength(0);
					expect(emit).toHaveBeenCalledWith(null);
					resolve(undefined);
				});
			});
		});

		test('should handle setting value for non-existent key', async () => {
			currentValues.value = ['custom-value1'];

			const { setOtherValue } = useCustomSelectionMultiple(currentValues, items, emit);

			await nextTick();

			setOtherValue('non-existent-key', 'new-value');

			// When key doesn't exist, previousValue is undefined, so valueWithoutPrevious = currentValues
			// Since valueWithoutPrevious.length === currentValues.length, it emits valueWithoutPrevious
			expect(emit).toHaveBeenCalledWith(['custom-value1']);
		});

		test('should handle removing non-existent key', () => {
			currentValues.value = ['custom-value1'];

			const { otherValues, setOtherValue } = useCustomSelectionMultiple(currentValues, items, emit);

			return new Promise((resolve) => {
				nextTick().then(() => {
					const initialLength = otherValues.value.length;

					setOtherValue('non-existent-key', null);

					expect(otherValues.value).toHaveLength(initialLength);
					expect(emit).toHaveBeenCalledWith(['custom-value1']);
					resolve(undefined);
				});
			});
		});

		test('should handle complex scenario with multiple values', () => {
			currentValues.value = ['option1', 'custom-value1', 'custom-value2', 'option2'];

			const { otherValues, setOtherValue } = useCustomSelectionMultiple(currentValues, items, emit);

			return new Promise((resolve) => {
				nextTick().then(() => {
					expect(otherValues.value).toHaveLength(2);

					const key1 = otherValues.value.find((o) => o.value === 'custom-value1')?.key;
					const key2 = otherValues.value.find((o) => o.value === 'custom-value2')?.key;

					// Update first custom value
					setOtherValue(key1!, 'updated-custom-value1');

					// Remove second custom value
					setOtherValue(key2!, null);

					expect(otherValues.value).toHaveLength(1);
					expect(otherValues.value[0]?.value).toBe('updated-custom-value1');
					resolve(undefined);
				});
			});
		});

		test('should handle edge case where valueWithoutPrevious has same length as currentValues', () => {
			currentValues.value = ['custom-value1'];

			const { otherValues, setOtherValue, addOtherValue } = useCustomSelectionMultiple(currentValues, items, emit);

			return new Promise((resolve) => {
				nextTick().then(() => {
					// Add another other value manually (not from currentValues)
					addOtherValue('manual-value');

					const manualKey = otherValues.value.find((o) => o.value === 'manual-value')?.key;

					// Setting this value should emit valueWithoutPrevious since the manual value wasn't in currentValues
					setOtherValue(manualKey!, 'updated-manual-value');

					expect(emit).toHaveBeenCalledWith(['custom-value1']);
					resolve(undefined);
				});
			});
		});
	});

	describe('integration scenarios', () => {
		test('should handle complete workflow with mixed operations', () => {
			currentValues.value = ['option1'];

			const { otherValues, addOtherValue, setOtherValue } = useCustomSelectionMultiple(currentValues, items, emit);

			return new Promise((resolve) => {
				nextTick().then(() => {
					// Add custom values
					addOtherValue('custom1');
					addOtherValue('custom2', true);

					expect(otherValues.value).toHaveLength(2);
					expect(otherValues.value[1]?.focus).toBe(true);

					// Update one value
					const key1 = otherValues.value[0]?.key;
					setOtherValue(key1!, 'updated-custom1');

					// Remove one value
					const key2 = otherValues.value[1]?.key;
					setOtherValue(key2!, null);

					expect(otherValues.value).toHaveLength(1);
					expect(otherValues.value[0]?.value).toBe('updated-custom1');
					resolve(undefined);
				});
			});
		});

		test('should handle currentValues becoming null after initialization', () => {
			currentValues.value = ['custom-value1'];

			const { otherValues } = useCustomSelectionMultiple(currentValues, items, emit);

			return new Promise((resolve) => {
				nextTick().then(() => {
					expect(otherValues.value).toHaveLength(1);

					// Change to null
					currentValues.value = null;

					return nextTick().then(() => {
						// Other values should remain (they're not automatically cleared)
						expect(otherValues.value).toHaveLength(1);
						resolve(undefined);
					});
				});
			});
		});

		test('should handle empty currentValues array', () => {
			currentValues.value = [];

			const { otherValues } = useCustomSelectionMultiple(currentValues, items, emit);

			return new Promise((resolve) => {
				nextTick().then(() => {
					expect(otherValues.value).toHaveLength(0);
					resolve(undefined);
				});
			});
		});
	});
});
