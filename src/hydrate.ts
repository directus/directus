import { useAppStore } from '@/stores/app/';
import { useCollectionsStore } from '@/stores/collections/';
import { useFieldsStore } from '@/stores/fields/';
import { useUserStore } from '@/stores/user/';
import { useRequestsStore } from '@/stores/requests/';
import { useCollectionPresetsStore } from '@/stores/collection-presets/';
import { useSettingsStore } from '@/stores/settings/';
import { useProjectsStore } from '@/stores/projects/';
import { useLatencyStore } from '@/stores/latency';
import { usePermissionsStore } from '@/stores/permissions';
import { useRelationsStore } from '@/stores/relations';

type GenericStore = {
	id: string;
	hydrate?: () => Promise<void>;
	dehydrate?: () => Promise<void>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
};

export function useStores(
	stores = [
		useCollectionsStore,
		useFieldsStore,
		useUserStore,
		useRequestsStore,
		useCollectionPresetsStore,
		useSettingsStore,
		useProjectsStore,
		useLatencyStore,
		usePermissionsStore,
		useRelationsStore,
	]
) {
	return stores.map((useStore) => useStore()) as GenericStore[];
}

/* istanbul ignore next: useStores has a test already */
export async function hydrate(stores = useStores()) {
	const appStore = useAppStore();

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
		await useUserStore().hydrate();

		await Promise.all(
			stores.filter(({ id }) => id !== 'userStore').map((store) => store.hydrate?.())
		);
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
