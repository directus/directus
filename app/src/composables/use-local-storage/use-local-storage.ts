import { ref, watch } from 'vue';

export default function useLocalStorage(key: string) {
	const data = ref<string | number | boolean | object | null>(null);

	function getExistingValue() {
		let rawExistingValue;
		try {
			rawExistingValue = localStorage.getItem(key);
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
				localStorage.removeItem(key);
			} else {
				localStorage.setItem(key, JSON.stringify(data.value));
			}
		} catch (err: any) {
			//
		}
	});

	return { data };
}
