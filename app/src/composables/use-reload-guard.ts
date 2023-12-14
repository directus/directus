import { type Ref, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useNavigationGuard } from './use-navigation-guard';

export function useReloadGuard(needsReload: Ref<boolean>) {
	const { path } = useRoute();

	const confirmLeave = ref(false);
	const leaveTo = ref<string | null>(null);

	const { removeGuard } = useNavigationGuard(needsReload, (to) => {
		if (needsReload.value && !to.path.startsWith(path)) {
			confirmLeave.value = true;
			leaveTo.value = to.fullPath;
			return false;
		}

		return true;
	});

	return { confirmLeave, leaveTo, removeGuard };
}
