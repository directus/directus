import type { UseFocusTrapReturn as FocusTrap } from '@vueuse/integrations/useFocusTrap';
import { inject, provide, ref } from 'vue';

const nestedValidationSymbol = 'focusTrapManager';

export function useFocusTrapManager() {
	const trap = ref<FocusTrap>();

	provide(nestedValidationSymbol, { pauseFocusTrap, unpauseFocusTrap });

	return { addFocusTrap };

	function addFocusTrap(focusTrap: FocusTrap) {
		trap.value = focusTrap;
	}

	function pauseFocusTrap() {
		trap.value?.pause();
	}

	function unpauseFocusTrap() {
		trap.value?.unpause();
	}
}

export function useInjectFocusTrapManager() {
	return inject(nestedValidationSymbol, {
		pauseFocusTrap: () => {},
		unpauseFocusTrap: () => {},
	});
}
