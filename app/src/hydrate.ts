import {
	useAppStore,
	useCollectionsStore,
	useFieldsStore,
	useUserStore,
	useRequestsStore,
	usePresetsStore,
	useSettingsStore,
	useServerStore,
	useLatencyStore,
	useRelationsStore,
	usePermissionsStore,
} from '@/stores';
import { register as registerModules, unregister as unregisterModules } from '@/modules/register';

import { Language } from '@/lang';
import { setLanguage } from '@/lang/set-language';

type GenericStore = {
	id: string;
	hydrate?: () => Promise<void>;
	dehydrate?: () => Promise<void>;

	[key: string]: any;
};

export function useStores(
	stores = [
		useCollectionsStore,
		useFieldsStore,
		useUserStore,
		useRequestsStore,
		usePresetsStore,
		useSettingsStore,
		useServerStore,
		useLatencyStore,
		useRelationsStore,
		usePermissionsStore,
	]
): GenericStore[] {
	return stores.map((useStore) => useStore()) as GenericStore[];
}

/* istanbul ignore next: useStores has a test already */
export async function hydrate(stores = useStores()): Promise<void> {
	const appStore = useAppStore();
	const userStore = useUserStore();

	if (appStore.state.hydrated) return;
	if (appStore.state.hydrating) return;

	appStore.state.hydrating = true;

	try {
		/**
		 * @NOTE
		 * Multiple stores rely on the userStore to be set, so they can fetch user specific data. The
		 * following makes sure that the user store is always fetched first, before we hydrate anything
		 * else.
		 */
		await userStore.hydrate();

		if (userStore.state.currentUser?.role) {
			await Promise.all(stores.filter(({ id }) => id !== 'userStore').map((store) => store.hydrate?.()));
			await registerModules();
			await setLanguage((userStore.state.currentUser?.language as Language) || 'en-US');
		}
	} catch (error) {
		appStore.state.error = error;
	} finally {
		appStore.state.hydrating = false;
	}

	appStore.state.hydrated = true;
}

/* istanbul ignore next: useStores has a test already */
export async function dehydrate(stores = useStores()): Promise<void> {
	const appStore = useAppStore();

	if (appStore.state.hydrated === false) return;

	for (const store of stores) {
		await store.dehydrate?.();
	}

	unregisterModules();

	appStore.state.hydrated = false;
}
