import { nanoid } from 'nanoid';
import { computed, ComputedRef, Ref, ref, watch } from 'vue';

type UsableCustomSelection = {
	otherValue: Ref<string | null>;
	usesOtherValue: ComputedRef<boolean>;
};

export function useCustomSelection(
	currentValue: Ref<string>,
	items: Ref<any[]>,
	emit: (event: string | null) => void
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

type OtherValue = {
	key: string;
	value: string;
};

type UsableCustomSelectionMultiple = {
	otherValues: Ref<OtherValue[]>;
	addOtherValue: (value?: string) => void;
	setOtherValue: (key: string, newValue: string | null) => void;
};

export function useCustomSelectionMultiple(
	currentValues: Ref<string[]>,
	items: Ref<any[]>,
	emit: (event: string[] | null) => void
): UsableCustomSelectionMultiple {
	const otherValues = ref<OtherValue[]>([]);

	watch(
		currentValues,
		(newValue) => {
			if (newValue === null) return;
			if (Array.isArray(newValue) === false) return;
			if (items.value === null) return;

			(newValue as string[]).forEach((value) => {
				if (items.value === null) return;
				const values = items.value.map((item) => item.value);
				const existsInValues = values.includes(value) === true;

				if (existsInValues === false) {
					const other = otherValues.value.map((o) => o.value);
					const existsInOtherValues = other.includes(value) === true;

					if (existsInOtherValues === false) {
						addOtherValue(value);
					}
				}
			});
		},
		{ immediate: true }
	);

	return { otherValues, addOtherValue, setOtherValue };

	function addOtherValue(value = '') {
		otherValues.value = [
			...otherValues.value,
			{
				key: nanoid(),
				value: value,
			},
		];
	}

	function setOtherValue(key: string, newValue: string | null) {
		const previousValue = otherValues.value.find((o) => o.key === key);

		const valueWithoutPrevious = ((currentValues.value || []) as string[]).filter(
			(val) => val !== previousValue?.value
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

			const newEmitValue = [...valueWithoutPrevious, newValue];

			emit(newEmitValue);
		}
	}
}
