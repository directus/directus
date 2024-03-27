import { computed, onUnmounted, ref } from 'vue';

export function useLocalStorage(key: string) {
	const internalValue = ref<string | null>(localStorage.getItem(key));

	const storageListener = (event: StorageEvent) => {
		if (event.storageArea === localStorage && event.key === key) internalValue.value = event.newValue;
	};

	addEventListener('storage', storageListener);
	onUnmounted(() => removeEventListener('storage', storageListener));

	const value = computed({
		get() {
			return internalValue.value;
		},
		set(newValue: string | null) {
			const oldValue = internalValue.value;
			internalValue.value = newValue;

			if (newValue) {
				localStorage.setItem(key, newValue);
			} else {
				localStorage.removeItem(key);
			}

			dispatchEvent(
				new StorageEvent('storage', {
					key,
					oldValue,
					newValue,
					storageArea: localStorage,
				}),
			);
		},
	});

	return value;
}
