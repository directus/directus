import {
	useAppStore,
	useCollectionsStore,
	useFieldsStore,
	useUserStore,
	useRequestsStore,
	usePresetsStore,
	useSettingsStore,
	useLatencyStore,
	useRelationsStore,
} from '@/stores';

import { setLanguage, Language } from '@/lang';

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
		useLatencyStore,
		useRelationsStore,
	]
) {
	return stores.map((useStore) => useStore()) as GenericStore[];
}

/* istanbul ignore next: useStores has a test already */
export async function hydrate(stores = useStores()) {
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

		setLanguage((userStore.state.currentUser?.locale as Language) || 'en-US');

		await Promise.all(stores.filter(({ id }) => id !== 'userStore').map((store) => store.hydrate?.()));
	} catch (error) {
		appStore.state.error = error;
	} finally {
		appStore.state.hydrating = false;
	}

	appStore.state.hydrated = true;
}

/* istanbul ignore next: useStores has a test already */
export async function dehydrate(stores = useStores()) {
	const appStore = useAppStore();

	if (appStore.state.hydrated === false) return;

	for (const store of stores) {
		await store.dehydrate?.();
	}

	appStore.state.hydrated = false;
}
