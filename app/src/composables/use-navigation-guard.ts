import { useEventListener } from '@vueuse/core';
import { NavigationGuard, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import type { Ref } from 'vue';

export function useNavigationGuard(locked: Ref<boolean>, guard: NavigationGuard) {
	useEventListener(document, 'beforeunload', (event) => {
		if (locked.value) event.preventDefault();
	});

	onBeforeRouteUpdate(guard);
	onBeforeRouteLeave(guard);
}
