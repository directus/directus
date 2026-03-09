import { i18n } from '@/lang';
import { useCollectionsStore } from '@/stores/collections';
import { usePermissionsStore } from '@/stores/permissions';
import { defineCommands } from '../../composables/use-command-registry';
import SearchCollection from './search-collection.vue';

export const searchCommands = defineCommands({
	commands: ({ route }) => {
		const collectionsStore = useCollectionsStore();
		const permissionsStore = usePermissionsStore();
		const t = i18n.global.t;
		const currentPath = route.path;

		const readCollections = collectionsStore.visibleCollections.filter(
			({ collection, type }) => type !== 'alias' && permissionsStore.hasPermission(collection, 'read'),
		);

		return readCollections.map((collection) => ({
			id: `search-collection:${collection.collection}`,
			name: t('command_search_collection', { collection: collection.name }),
			icon: 'search' as const,
			group: `collection:${collection.collection}`,
			keywords: ['search', 'find'],
			priority: currentPath.startsWith(`/content/${collection.collection}`) ? 41 : 40,
			component: SearchCollection,
			props: {
				collection: collection.collection,
				collectionName: collection.name,
				collectionIcon: (collection.meta?.icon ?? 'box') as string,
				displayTemplate: collection.meta?.display_template ?? null,
			},
		}));
	},
});
