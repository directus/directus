import { type Ref, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNavigationGuard } from './use-navigation-guard';

export function useReloadGuard(needsReload: Ref<boolean>) {
	const router = useRouter();
	const { path } = useRoute();

	const confirmLeave = ref(false);
	const leaveTo = ref<string | null>(null);

	useNavigationGuard(needsReload, (to) => {
		if (needsReload.value && !to.path.startsWith(path)) {
			confirmLeave.value = true;
			leaveTo.value = router.resolve(to.fullPath).href;
			return false;
		}

		return true;
	});

	return { confirmLeave, leaveTo };
}
