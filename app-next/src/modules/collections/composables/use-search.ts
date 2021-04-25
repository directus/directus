import { ref, watch } from 'vue';

const searchQuery = ref<string | null>(null);
const visible = ref<number | null>(null);

export function useSearch() {
	return { visible, searchQuery };
}
