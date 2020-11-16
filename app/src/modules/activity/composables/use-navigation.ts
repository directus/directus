import { ref, Ref } from '@vue/composition-api';

let navFilter: Ref<Record<string, any> | null>;

export function useNavigation() {
	if (!navFilter) navFilter = ref(null);

	return { navFilter };
}
