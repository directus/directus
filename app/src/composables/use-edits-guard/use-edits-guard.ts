import { ref, Ref, onBeforeMount, onBeforeUnmount } from 'vue';
import { onBeforeRouteUpdate, onBeforeRouteLeave, NavigationGuard, useRoute } from 'vue-router';

export function useEditsGuard(hasEdits: Ref<boolean>) {
	const { path } = useRoute();

	const confirmLeave = ref(false);
	const leaveTo = ref<string | null>(null);

	const beforeUnload = (event: BeforeUnloadEvent) => {
		if (hasEdits.value) {
			event.preventDefault();
			event.returnValue = '';
			return '';
		}
	};

	const editsGuard: NavigationGuard = (to) => {
		if (hasEdits.value && !to.path.startsWith(path)) {
			confirmLeave.value = true;
			leaveTo.value = to.fullPath;
			return false;
		}
	};

	onBeforeMount(() => {
		window.addEventListener('beforeunload', beforeUnload);
	});

	onBeforeUnmount(() => {
		window.removeEventListener('beforeunload', beforeUnload);
	});

	onBeforeRouteUpdate(editsGuard);
	onBeforeRouteLeave(editsGuard);

	return { confirmLeave, leaveTo };
}
