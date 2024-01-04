import { type Ref, ref, unref } from 'vue';
import { useRoute } from 'vue-router';
import { useNavigationGuard } from './use-navigation-guard';

type EditsGuardOptions = {
	ignorePrefix?: string | Ref<string>;
};

export function useEditsGuard(hasEdits: Ref<boolean>, opts?: EditsGuardOptions) {
	const { path } = useRoute();

	const confirmLeave = ref(false);
	const leaveTo = ref<string | null>(null);

	useNavigationGuard(hasEdits, (to) => {
		const matchesPathPrefix = opts?.ignorePrefix ? to.path.startsWith(unref(opts.ignorePrefix)) : false;

		if (hasEdits.value && !to.path.startsWith(path) && !matchesPathPrefix) {
			confirmLeave.value = true;
			leaveTo.value = to.fullPath;
			return false;
		}

		return;
	});

	return { confirmLeave, leaveTo };
}
