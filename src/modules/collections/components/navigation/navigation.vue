<template>
	<v-list nav>
		<v-list-item v-for="navItem in navItems" :key="navItem.to" :to="navItem.to">
			<v-list-item-icon><v-icon :name="navItem.icon" /></v-list-item-icon>
			<v-list-item-content>{{ navItem.name }}</v-list-item-content>
		</v-list-item>

		<template v-if="bookmarks.length > 0">
			<v-divider />

			<v-list-item v-for="bookmark in bookmarks" :key="bookmark.id" :to="bookmark.to">
				<v-list-item-icon><v-icon name="bookmark" /></v-list-item-icon>
				<v-list-item-content>{{ bookmark.title }}</v-list-item-content>
			</v-list-item>
		</template>
	</v-list>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import useNavigation from '../../composables/use-navigation';
import useCollectionPresetsStore from '@/stores/collection-presets';
import useProjectsStore from '@/stores/projects';

export default defineComponent({
	props: {},
	setup() {
		const collectionPresetsStore = useCollectionPresetsStore();
		const projectsStore = useProjectsStore();
		const { navItems } = useNavigation();

		const bookmarks = computed(() => {
			const { currentProjectKey } = projectsStore.state;

			return collectionPresetsStore.state.collectionPresets
				.filter((preset) => {
					return (
						preset.title !== null && preset.collection.startsWith('directus_') === false
					);
				})
				.map((preset) => {
					return {
						...preset,
						to: `/${currentProjectKey}/collections/${preset.collection}?bookmark=${preset.id}`,
					};
				});
		});

		return { navItems, bookmarks };
	},
});
</script>
