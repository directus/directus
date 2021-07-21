import { useCollectionsStore, useUserStore } from '@/stores/';
import { Collection } from '@/types';
import { computed, ComputedRef, Ref, ref } from 'vue';

export type NavItem = {
	collection: string;
	name: string;
	to: string;
	icon: string;
	color: string | null | undefined;
	note: string | null;
};

export type NavItemGroup = {
	name: string;
	accordion: string;
	items: NavItem[];
};

let activeGroups: Ref<string[]>;
let hiddenShown: Ref<boolean>;

function collectionToNavItem(collection: Collection): NavItem {
	return {
		collection: collection.collection,
		name: collection.name,
		icon: collection.meta?.icon || 'label',
		color: collection.meta?.color,
		note: collection.meta?.note || null,
		to: `/collections/${collection.collection}`,
	};
}

type UsableNavigation = {
	customNavItems: ComputedRef<NavItemGroup[] | null>;
	navItems: ComputedRef<NavItem[]>;
	activeGroups: Ref<string[]>;
	hiddenNavItems: ComputedRef<NavItem[]>;
	hiddenShown: Ref<boolean>;
	search: (item: NavItem) => boolean;
};

export default function useNavigation(searchQuery?: Ref<string | null>): UsableNavigation {
	const collectionsStore = useCollectionsStore();
	const userStore = useUserStore();

	const customNavItems = computed<NavItemGroup[] | null>(() => {
		if (!userStore.currentUser) return null;
		if (!userStore.currentUser.role.collection_list) return null;

		return userStore.currentUser?.role.collection_list.map((groupRaw) => {
			const group: NavItemGroup = {
				name: groupRaw.group_name,
				accordion: groupRaw.accordion,
				items: groupRaw.collections
					.map(({ collection }) => collectionsStore.getCollection(collection) as Collection)
					.filter((collection) => !!collection)
					.map(collectionToNavItem)
					.filter(search),
			};

			return group;
		});
	});

	const navItems = computed<NavItem[]>(() => {
		return collectionsStore.visibleCollections
			.map(collectionToNavItem)
			.sort((navA: NavItem, navB: NavItem) => {
				return navA.name > navB.name ? 1 : -1;
			})
			.filter(search);
	});

	const hiddenNavItems = computed<NavItem[]>(() => {
		return collectionsStore.hiddenCollections
			.map(collectionToNavItem)
			.sort((navA: NavItem, navB: NavItem) => {
				return navA.name > navB.name ? 1 : -1;
			})
			.filter(search);
	});

	if (!activeGroups) {
		activeGroups = ref(
			customNavItems.value?.filter(({ accordion }) => accordion === 'start_open').map(({ name }) => name) ?? []
		);
	}

	if (hiddenShown === undefined) {
		hiddenShown = ref(false);
	}

	return { customNavItems, navItems, activeGroups, hiddenNavItems, hiddenShown, search };

	function search(item: NavItem) {
		if (!searchQuery?.value) return true;
		if (typeof item.name !== 'string') return true;
		return item.name.toLocaleLowerCase().includes(searchQuery.value.toLocaleLowerCase());
	}
}
