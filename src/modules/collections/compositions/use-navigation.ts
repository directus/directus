import { computed } from '@vue/composition-api';
import { useProjectsStore } from '@/stores/projects/';
import { useCollectionsStore } from '@/stores/collections/';
import { Collection } from '@/stores/collections/types';
import VueI18n from 'vue-i18n';

export type NavItem = {
	collection: string;
	name: string | VueI18n.TranslateResult;
	to: string;
	icon: string;
};

export default function useNavigation() {
	const collectionsStore = useCollectionsStore();
	const projectsStore = useProjectsStore();

	const navItems = computed<NavItem[]>(() => {
		return collectionsStore.visibleCollections.value
			.map((collection: Collection) => {
				const navItem: NavItem = {
					collection: collection.collection,
					name: collection.name,
					icon: collection.icon,
					to: `/${projectsStore.state.currentProjectKey}/collections/${collection.collection}`
				};

				return navItem;
			})
			.sort((navA: NavItem, navB: NavItem) => {
				return navA.name > navB.name ? 1 : -1;
			});
	});

	return { navItems: navItems };
}
