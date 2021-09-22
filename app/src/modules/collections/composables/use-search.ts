import { ref, Ref } from 'vue';

const searchQuery = ref<string | null>(null);
const visible = ref<number | null>(null);

export function useSearch(): { visible: Ref<number | null>; searchQuery: Ref<string | null> } {
	return { visible, searchQuery };
}
