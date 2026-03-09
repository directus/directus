import type { CommandActionContext } from '../composables/use-command-registry';
import { i18n } from '@/lang';
import { useCollectionsStore } from '@/stores/collections';
import { usePermissionsStore } from '@/stores/permissions';
import { defineCommands } from '../composables/use-command-registry';
import { getCollectionName } from '../utils/get-collection-name';

export const contentCommands = defineCommands({
	groups: () => {
		const collectionsStore = useCollectionsStore();
		const permissionsStore = usePermissionsStore();

		return collectionsStore.visibleCollections
			.filter(({ collection, type }) => type !== 'alias' && permissionsStore.hasPermission(collection, 'read'))
			.map((collection) => ({
				id: `collection:${collection.collection}`,
				name: collection.name,
				icon: (collection.meta?.icon ?? 'box') as string,
			}));
	},
	commands: ({ route }) => {
		const collectionsStore = useCollectionsStore();
		const permissionsStore = usePermissionsStore();
		const t = i18n.global.t;
		const currentPath = route.path;

		const readCollections = collectionsStore.visibleCollections.filter(
			({ collection, type }) => type !== 'alias' && permissionsStore.hasPermission(collection, 'read'),
		);

		const createCollections = collectionsStore.visibleCollections.filter(
			({ collection, type, meta }) =>
				type !== 'alias' && !meta?.singleton && permissionsStore.hasPermission(collection, 'create'),
		);

		return [
			...readCollections
				.filter((c) => currentPath !== `/content/${c.collection}`)
				.map((collection) => ({
					id: `view-collection:${collection.collection}`,
					name: t('command_go_to_collection', { collection: collection.name }),
					icon: 'arrow_right_alt' as const,
					group: `collection:${collection.collection}`,
					keywords: ['view', 'list'],
					priority: currentPath.startsWith(`/content/${collection.collection}`) ? 31 : 30,
					action: ({ router }: CommandActionContext) => {
						router.push(`/content/${collection.collection}`);
					},
				})),
			...createCollections
				.filter((c) => currentPath !== `/content/${c.collection}/+`)
				.map((collection) => ({
					id: `create-item:${collection.collection}`,
					name: t('command_create_item', { collection: getCollectionName(collection) }),
					icon: 'add' as const,
					group: `collection:${collection.collection}`,
					priority: currentPath.startsWith(`/content/${collection.collection}`) ? 21 : 20,
					action: ({ router }: CommandActionContext) => {
						router.push(`/content/${collection.collection}/+`);
					},
				})),
		];
	},
});
