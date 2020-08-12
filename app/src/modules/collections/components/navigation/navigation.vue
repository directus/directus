<template>
	<v-list nav>
		<template v-if="customNavItems && customNavItems.length > 0">
			<div :key="group.name" v-for="(group, index) in customNavItems">
				<div class="group-name">{{ group.name }}</div>
				<v-list-item :exact="exact" v-for="navItem in group.items" :key="navItem.to" :to="navItem.to">
					<v-list-item-icon><v-icon :name="navItem.icon" /></v-list-item-icon>
					<v-list-item-content>{{ navItem.name }}</v-list-item-content>
				</v-list-item>
				<v-divider v-if="index !== customNavItems.length - 1" />
			</div>
		</template>

		<v-list-item v-else :exact="exact" v-for="navItem in navItems" :key="navItem.to" :to="navItem.to">
			<v-list-item-icon><v-icon :name="navItem.icon" /></v-list-item-icon>
			<v-list-item-content>{{ navItem.name }}</v-list-item-content>
		</v-list-item>

		<template v-if="bookmarks.length > 0">
			<v-divider />

			<v-list-item exact v-for="bookmark in bookmarks" :key="bookmark.id" :to="bookmark.to">
				<v-list-item-icon><v-icon name="bookmark" /></v-list-item-icon>
				<v-list-item-content>{{ bookmark.title }}</v-list-item-content>
			</v-list-item>
		</template>
	</v-list>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import useNavigation from '../../composables/use-navigation';
import { usePresetsStore } from '@/stores/';

export default defineComponent({
	props: {
		exact: {
			type: Boolean,
			default: false,
		},
	},
	setup() {
		const presetsStore = usePresetsStore();
		const { customNavItems, navItems } = useNavigation();

		const bookmarks = computed(() => {
			return presetsStore.state.collectionPresets
				.filter((preset) => {
					return preset.title !== null && preset.collection.startsWith('directus_') === false;
				})
				.map((preset) => {
					return {
						...preset,
						to: `/collections/${preset.collection}?bookmark=${preset.id}`,
					};
				});
		});

		return { navItems, bookmarks, customNavItems };
	},
});
</script>

<style lang="scss" scoped>
.group-name {
	padding-left: 8px;
	font-weight: 600;
}
</style>
