import { onDehydrateExtensions, onHydrateExtensions } from './extensions';
import { setLanguage } from './lang/set-language';
import { useAiStore } from '@/ai/stores/use-ai';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useFlowsStore } from '@/stores/flows';
import { useInsightsStore } from '@/stores/insights';
import { useNotificationsStore } from '@/stores/notifications';
import { usePermissionsStore } from '@/stores/permissions';
import { usePresetsStore } from '@/stores/presets';
import { useRelationsStore } from '@/stores/relations';
import { useRequestsStore } from '@/stores/requests';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';
import { getBasemapSources } from '@/utils/geometry/basemap';
import { useAppStore } from '@directus/stores';

type GenericStore = {
	$id: string;
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
		useRelationsStore,
		usePermissionsStore,
		useInsightsStore,
		useFlowsStore,
		useNotificationsStore,
		useAiStore,
	],
): GenericStore[] {
	return stores.map((useStore) => useStore()) as GenericStore[];
}

export async function hydrate(): Promise<void> {
	const stores = useStores();

	const appStore = useAppStore();
	const userStore = useUserStore();
	const permissionsStore = usePermissionsStore();
	const fieldsStore = useFieldsStore();

	if (appStore.hydrated) return;
	if (appStore.hydrating) return;

	appStore.hydrating = true;

	try {
		/**
		 * @NOTE
		 * Multiple stores rely on the userStore to be set, so they can fetch user specific data. The
		 * following makes sure that the user store is always fetched first, before we hydrate anything
		 * else.
		 */
		await userStore.hydrate();

		const currentUser = userStore.currentUser;

		if (currentUser?.app_access) {
			await Promise.all([permissionsStore.hydrate(), fieldsStore.hydrate({ skipTranslation: true })]);

			const hydratedStores = ['userStore', 'permissionsStore', 'fieldsStore', 'serverStore'];
			await Promise.all(stores.filter(({ $id }) => !hydratedStores.includes($id)).map((store) => store.hydrate?.()));

			await onHydrateExtensions();
		}

		await setLanguage(userStore.language);

		appStore.basemap = getBasemapSources()[0].name;
	} catch (error: any) {
		appStore.error = error;
	} finally {
		appStore.hydrating = false;
	}

	appStore.hydrated = true;
}

export async function dehydrate(stores = useStores()): Promise<void> {
	const appStore = useAppStore();

	if (appStore.hydrated === false) return;

	for (const store of stores) {
		await store.dehydrate?.();
	}

	await onDehydrateExtensions();

	appStore.hydrated = false;
}
