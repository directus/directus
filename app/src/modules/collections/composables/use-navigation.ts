import { useCollectionsStore, useUserStore } from '@/stores/';
import { Collection } from '@/types';
import { computed, Ref, ref } from '@vue/composition-api';
import VueI18n from 'vue-i18n';

export type NavItem = {
	collection: string;
	name: string | VueI18n.TranslateResult;
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

export default function useNavigation(searchQuery?: Ref<string | null>): Record<string, any> {
	const collectionsStore = useCollectionsStore();
	const userStore = useUserStore();

	const customNavItems = computed<NavItemGroup[] | null>(() => {
		if (!userStore.state.currentUser) return null;
		if (!userStore.state.currentUser.role.collection_list) return null;

		return userStore.state.currentUser?.role.collection_list.map((groupRaw) => {
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
		return collectionsStore.visibleCollections.value
			.map(collectionToNavItem)
			.sort((navA: NavItem, navB: NavItem) => {
				return navA.name > navB.name ? 1 : -1;
			})
			.filter(search);
	});

	const hiddenNavItems = computed<NavItem[]>(() => {
		return collectionsStore.hiddenCollections.value
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
