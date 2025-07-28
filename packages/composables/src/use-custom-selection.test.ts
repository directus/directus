import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ref, type Ref } from 'vue';
import { useCustomSelection } from './use-custom-selection';

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
			items.value = [
				{ value: 'string-value' },
				{ value: 123 },
				{ value: true },
			];

			currentValue.value = '123'; // String representation of number

			const { usesOtherValue } = useCustomSelection(currentValue, items, emit);

			// Should be custom since '123' (string) !== 123 (number)
			expect(usesOtherValue.value).toBe(true);
		});
	});
});
