import { ref, UnwrapRef, watch } from 'vue';
import { parseJSON } from '@directus/utils';

type LocalStorageObjectType = string | number | boolean | object;

export function useLocalStorage<T extends LocalStorageObjectType>(
	key: string,
	defaultValue: UnwrapRef<T> | null = null,
) {
	const internalKey = `directus-${key}`;
	const data = ref<T | null>(null);

	function getValue(): UnwrapRef<T> | null {
		const rawExistingValue = localStorage.getItem(internalKey);

		if (!rawExistingValue) return defaultValue;

		try {
			return parseJSON(rawExistingValue);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.warn(`Couldn't parse value from local storage`, error);

			return defaultValue;
		}
	}

	function setValue(value: UnwrapRef<T> | null) {
		try {
			localStorage.setItem(internalKey, JSON.stringify(value));
		} catch (error) {
			// eslint-disable-next-line no-console
			console.warn(`Couldn't stringify and set value to local storage`, error);
		}
	}

	data.value = getValue();

	watch(data, () => {
		if (data.value == null) {
			localStorage.removeItem(internalKey);
		} else {
			setValue(data.value);
		}
	});

	return { data };
}
