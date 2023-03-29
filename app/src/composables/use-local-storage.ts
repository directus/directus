import { ref, watch } from 'vue';
import { parseJSON } from '@directus/shared/utils';

type LocalStorageObjectType = string | number | boolean | object | null;

export function useLocalStorage(key: string, defaultValue: LocalStorageObjectType = null) {
	const internalKey = `directus-${key}`;
	const data = ref<LocalStorageObjectType>(null);

	function getValue(): LocalStorageObjectType {
		const rawExistingValue = localStorage.getItem(internalKey);

		if (!rawExistingValue) return defaultValue;

		try {
			return parseJSON(rawExistingValue);
		} catch (e) {
			// eslint-disable-next-line no-console
			console.warn(`Couldn't parse value from local storage`, e);

			return defaultValue;
		}
	}

	function setValue(value: LocalStorageObjectType) {
		try {
			localStorage.setItem(internalKey, JSON.stringify(value));
		} catch (e) {
			// eslint-disable-next-line no-console
			console.warn(`Couldn't stringify and set value to local storage`, e);
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
