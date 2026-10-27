import { computed, ref, type Ref } from 'vue';
import type { Choice } from './types';

export function useCardSearch<T extends string | number>(choices: Ref<Choice<T>[] | null>) {
	const searchQuery = ref('');

	const showSearch = computed(() => (choices.value?.length ?? 0) > 10 || searchQuery.value.length > 0);

	const filteredChoices = computed(() => {
		if (!choices.value) return [];
		if (!searchQuery.value) return choices.value;

		const query = searchQuery.value.toLowerCase();
		return choices.value.filter((choice) => (choice.text ?? '').toLowerCase().includes(query));
	});

	return { searchQuery, showSearch, filteredChoices };
}
