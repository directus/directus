import { computed } from '@vue/composition-api';
import { useProjectsStore } from '@/stores/projects/';
import { useCollectionsStore } from '@/stores/collections/';
import { Collection } from '@/stores/collections/types';
import VueI18n from 'vue-i18n';
import useUserStore from '@/stores/user';

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
	const projectsStore = useProjectsStore();
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
							icon: collectionInfo.icon,
							to: `/${projectsStore.state.currentProjectKey}/collections/${collection}`,
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
					icon: collection.icon,
					to: `/${projectsStore.state.currentProjectKey}/collections/${collection.collection}`,
				};

				return navItem;
			})
			.sort((navA: NavItem, navB: NavItem) => {
				return navA.name > navB.name ? 1 : -1;
			});
	});

	return { customNavItems, navItems };
}
