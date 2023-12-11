import { ref, Ref, onBeforeMount, onBeforeUnmount } from 'vue';
import { onBeforeRouteUpdate, onBeforeRouteLeave, NavigationGuard, useRoute } from 'vue-router';

export function useReloadGuard(needsReload: Ref<boolean>) {
	const { path } = useRoute();

	const confirmLeave = ref(false);
	const leaveTo = ref<string | null>(null);

	const reloadGuard: NavigationGuard = (to) => {
		if (needsReload.value && !to.path.startsWith(path)) {
			confirmLeave.value = true;
			leaveTo.value = to.fullPath;
			return false;
		}

		return true;
	};

	onBeforeRouteUpdate(reloadGuard);
	onBeforeRouteLeave(reloadGuard);

	const beforeUnload = (event: BeforeUnloadEvent) => {
		if (needsReload.value) {
			event.preventDefault();
			event.returnValue = '';
		}
	};

	const addListener = () => window.addEventListener('beforeunload', beforeUnload);
	const removeListener = () => window.removeEventListener('beforeunload', beforeUnload);

	onBeforeMount(addListener);
	onBeforeUnmount(removeListener);

	return { confirmLeave, leaveTo, removeGuard: removeListener };
}
