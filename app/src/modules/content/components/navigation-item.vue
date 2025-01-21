<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { Collection } from '@/types/collections';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import NavigationBookmark from './navigation-bookmark.vue';
import NavigationItemContent from './navigation-item-content.vue';
import { useGroupable } from '@directus/composables';
import { useCollectionNavigationItem } from '../composables/use-collection-navigation-item';

const props = defineProps<{
	collection: Collection;
	showHidden?: boolean;
	search?: string;
}>();

const { t } = useI18n();

const { isAdmin } = storeToRefs(useUserStore());

const { isGroup, isBookmarkActive, collectionRoute, matchesSearch, hasContextMenu, childBookmarks, childCollections } =
	useCollectionNavigationItem(props.collection, props.showHidden, props.search);

const groupScope = 'content-navigation';
const groupValue = props.collection.collection;

const { active: isGroupOpen } = useGroupable({
	group: groupScope,
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
	>
		<template #activator>
			<navigation-item-content
				:search="search"
				:name="collection.name"
				:icon="collection.icon"
				:color="collection.color"
			/>
		</template>
		<navigation-item
			v-for="childCollection in childCollections"
			:key="childCollection.collection"
			:show-hidden="showHidden"
			:collection="childCollection"
			:search="search"
		/>
		<navigation-bookmark v-for="bookmark in childBookmarks" :key="bookmark.id" :bookmark="bookmark" />
	</v-list-group>

	<v-list-item
		v-else-if="matchesSearch"
		v-context-menu="hasContextMenu ? 'contextMenu' : null"
		:to="collectionRoute"
		:value="collection.collection"
		:class="{ hidden: collection.meta?.hidden }"
	>
		<navigation-item-content
			:search="search"
			:name="collection.name"
			:icon="collection.icon"
			:color="collection.color"
		/>
	</v-list-item>

	<v-menu v-if="hasContextMenu" ref="contextMenu" show-arrow placement="bottom-start">
		<v-list>
			<v-list-item v-if="isAdmin" clickable :to="`/settings/data-model/${collection.collection}`">
				<v-list-item-icon>
					<v-icon name="database" />
				</v-list-item-icon>
				<v-list-item-content>
					<v-text-overflow :text="t('edit_collection')" />
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<style scoped>
.hidden {
	--v-list-item-color: var(--theme--foreground-subdued);
}
</style>
