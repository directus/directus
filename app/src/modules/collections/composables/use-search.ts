import { ref, Ref } from 'vue';

const searchQuery = ref<string | null>(null);
const visible = ref<number | null>(null);

export function useSearch(): Record<string, Ref> {
	return { visible, searchQuery };
}
