import { ref, watch } from 'vue';
import { LocalStorageObject } from '@/utils/local-storage-object';

export function useLocalStorage(key: string) {
	const localStorageObject = new LocalStorageObject(key);
	const data = ref<string | number | boolean | object | null>(null);

	function getExistingValue() {
		const existingValue = localStorageObject.getValue();

		if (!existingValue) return;

		data.value = existingValue;
	}

	getExistingValue();

	watch(data, () => {
		if (data.value == null) {
			localStorageObject.clear();
		} else {
			localStorageObject.setValue(data.value);
		}
	});

	return { data };
}
