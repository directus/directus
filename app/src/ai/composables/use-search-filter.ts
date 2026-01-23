import { computed, type Ref } from 'vue';

export function useSearchFilter<T>(
	items: Ref<T[]>,
	searchQuery: Ref<string>,
	keys: (keyof T | ((item: T) => string))[],
) {
	return computed(() => {
		if (!searchQuery.value) return items.value;
		const query = searchQuery.value.toLowerCase();

		return items.value.filter((item) => {
			return keys.some((key) => {
				const value = typeof key === 'function' ? key(item) : item[key];
				return String(value ?? '')
					.toLowerCase()
					.includes(query);
			});
		});
	});
}
