import { type Ref, onBeforeMount, onBeforeUnmount } from 'vue';
import { onBeforeRouteUpdate, onBeforeRouteLeave, NavigationGuard } from 'vue-router';

export function useNavigationGuard(locked: Ref<boolean>, guard: NavigationGuard) {
	onBeforeRouteUpdate(guard);
	onBeforeRouteLeave(guard);

	const beforeUnload = (event: BeforeUnloadEvent) => {
		if (locked.value) {
			event.preventDefault();
			event.returnValue = '';
		}
	};

	const addListener = () => window.addEventListener('beforeunload', beforeUnload);
	const removeListener = () => window.removeEventListener('beforeunload', beforeUnload);

	onBeforeMount(addListener);
	onBeforeUnmount(removeListener);

	return { removeGuard: removeListener };
}
