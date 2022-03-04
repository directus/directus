import { ref, watch } from 'vue';

export default function useLocalStorage(key: string) {
	const internalKey = `directus-${key}`;
	const data = ref<string | number | boolean | object | null>(null);

	function getExistingValue() {
		let rawExistingValue;
		try {
			rawExistingValue = localStorage.getItem(internalKey);
		} catch (err: any) {
			//
		}

		if (!rawExistingValue) return;

		try {
			const existingValue = JSON.parse(rawExistingValue);
			data.value = existingValue;
		} catch (err: any) {
			//
		}
	}

	getExistingValue();

	watch(data, () => {
		try {
			if (data.value == null) {
				localStorage.removeItem(internalKey);
			} else {
				localStorage.setItem(internalKey, JSON.stringify(data.value));
			}
		} catch (err: any) {
			//
		}
	});

	return { data };
}
