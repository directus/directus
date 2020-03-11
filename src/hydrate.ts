import { useAppStore } from '@/stores/app/';
import { useCollectionsStore } from '@/stores/collections/';
import { useFieldsStore } from '@/stores/fields/';
import { useRequestsStore } from '@/stores/requests/';

type GenericStore = {
	id: string;
	hydrate?: () => Promise<void>;
	dehydrate?: () => Promise<void>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
};

export function useStores(stores = [useCollectionsStore, useFieldsStore, useRequestsStore]) {
	return stores.map(useStore => useStore()) as GenericStore[];
}

/* istanbul ignore next: useStores has a test already */
export async function hydrate(stores = useStores()) {
	const appStore = useAppStore();

	if (appStore.state.hydrated) return;
	if (appStore.state.hydrating) return;

	appStore.state.hydrating = true;

	try {
		for (const store of stores) {
			await store.hydrate?.();
		}
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
