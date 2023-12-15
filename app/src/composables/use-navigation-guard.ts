import { useEventListener } from '@vueuse/core';
import { type Ref } from 'vue';
import { NavigationGuard, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';

export function useNavigationGuard(locked: Ref<boolean>, guard: NavigationGuard) {
	onBeforeRouteUpdate(guard);
	onBeforeRouteLeave(guard);

	useEventListener(document, 'beforeunload', (event) => {
		if (locked.value) {
			event.preventDefault();
		}
	});
}
