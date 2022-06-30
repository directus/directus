import { ref, Ref, onBeforeMount, onBeforeUnmount, unref } from 'vue';
import { onBeforeRouteUpdate, onBeforeRouteLeave, NavigationGuard, useRoute } from 'vue-router';

type EditsGuardOptions = {
	ignorePrefix?: string | Ref<string>;
};

export function useEditsGuard(hasEdits: Ref<boolean>, opts?: EditsGuardOptions) {
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
		const matchesPathPrefix = opts?.ignorePrefix ? to.path.startsWith(unref(opts.ignorePrefix)) : false;

		if (hasEdits.value && !to.path.startsWith(path) && !matchesPathPrefix) {
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
