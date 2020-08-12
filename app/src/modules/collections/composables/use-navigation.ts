import { computed } from '@vue/composition-api';

import { useCollectionsStore, useUserStore } from '@/stores/';
import { Collection } from '@/types';
import VueI18n from 'vue-i18n';

export type NavItem = {
	collection: string;
	name: string | VueI18n.TranslateResult;
	to: string;
	icon: string;
};

export type NavItemGroup = {
	name: string;
	items: NavItem[];
};

export default function useNavigation() {
	const collectionsStore = useCollectionsStore();

	const userStore = useUserStore();

	const customNavItems = computed<NavItemGroup[] | null>(() => {
		if (!userStore.state.currentUser) return null;
		if (!userStore.state.currentUser.role.collection_listing) return null;

		return userStore.state.currentUser?.role.collection_listing.map((groupRaw) => {
			const group: NavItemGroup = {
				name: groupRaw.group_name,
				items: groupRaw.collections
					.map(({ collection }) => {
						const collectionInfo = collectionsStore.getCollection(collection);

						if (!collectionInfo) return null;

						const navItem: NavItem = {
							collection: collection,
							name: collectionInfo.name,
							icon: collectionInfo.meta?.icon || 'box',
							to: `/collections/${collection}`,
						};

						return navItem;
					})
					.filter((c) => c) as NavItem[],
			};

			return group;
		});
	});

	const navItems = computed<NavItem[]>(() => {
		return collectionsStore.visibleCollections.value
			.map((collection: Collection) => {
				const navItem: NavItem = {
					collection: collection.collection,
					name: collection.name,
					icon: collection.meta?.icon || 'box',
					to: `/collections/${collection.collection}`,
				};

				return navItem;
			})
			.sort((navA: NavItem, navB: NavItem) => {
				return navA.name > navB.name ? 1 : -1;
			});
	});

	return { customNavItems, navItems };
}
