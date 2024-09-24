<script setup lang="ts">
import { Collection } from '@/types/collections';
import { useI18n } from 'vue-i18n';
import NavigationBookmark from '../../content/components/navigation-bookmark.vue';
import NavigationItemContent from '../../content/components/navigation-item-content.vue';
import { useCollectionNavigationItem } from '@/modules/content/composables/use-collection-navigation-item';
import { useGroupable } from '@directus/composables';

const props = defineProps<{
	collection: Collection;
	showHidden?: boolean;
	search?: string;
	active: boolean;
}>();

const { t } = useI18n();

const { isGroup, isBookmarkActive, collectionRoute, matchesSearch, hasContextMenu, childBookmarks } =
	useCollectionNavigationItem(props.collection, props.showHidden, props.search);

const groupScope = 'v-list';
const groupValue = props.collection.collection;

const { active: isGroupOpen } = useGroupable({
	group: '',
	value: groupValue,
});
</script>

<template>
	<v-list-group
		v-if="isGroup && matchesSearch"
		v-context-menu="hasContextMenu ? 'contextMenu' : null"
		:to="collectionRoute"
		:scope="groupScope"
		:value="groupValue"
		:query="isGroupOpen && isBookmarkActive"
		:open="collection.meta?.collapse === 'locked'"
		:arrow-placement="collection.meta?.collapse === 'locked' ? false : 'after'"
		:active="active && !isBookmarkActive"
	>
		<template #activator>
			<navigation-item-content :search="search" :name="t('all_users')" icon="folder_shared" :color="null" />
		</template>
		<navigation-bookmark v-for="bookmark in childBookmarks" :key="bookmark.id" :bookmark="bookmark" />
	</v-list-group>

	<v-list-item
		v-else-if="matchesSearch"
		v-context-menu="hasContextMenu ? 'contextMenu' : null"
		:to="collectionRoute"
		:value="collection.collection"
		:class="{ hidden: collection.meta?.hidden }"
		:active="active && !isBookmarkActive"
	>
		<navigation-item-content :search="search" :name="t('all_users')" icon="folder_shared" :color="null" />
	</v-list-item>
</template>

<style scoped>
.hidden {
	--v-list-item-color: var(--theme--foreground-subdued);
}
</style>
