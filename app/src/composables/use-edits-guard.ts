import { ref, unref, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { useNavigationGuard } from './use-navigation-guard';

type EditsGuardOptions = {
	ignorePrefix?: string | Ref<string>;
};

export function useEditsGuard(hasEdits: Ref<boolean>, opts?: EditsGuardOptions) {
	const confirmLeave = ref(false);
	const leaveTo = ref<string | null>(null);

	useNavigationGuard(hasEdits, (to) => {
		const { path } = useRoute();

		if (hasEdits.value && !isSubpath(path, to.path) && !isIgnoredPath(unref(opts?.ignorePrefix), to.path)) {
			confirmLeave.value = true;
			leaveTo.value = to.fullPath;
			return false;
		}

		return;
	});

	return { confirmLeave, leaveTo };
}

function isSubpath(currentPath: string, newPath: string) {
	return (
		currentPath === newPath || (newPath.startsWith(currentPath) && newPath.substring(currentPath.length).includes('/'))
	);
}

function isIgnoredPath(ignorePrefix: string | undefined, newPath: string) {
	if (!ignorePrefix) return false;

	return newPath.startsWith(ignorePrefix);
}
