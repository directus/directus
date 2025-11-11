<script setup lang="ts">
import { useCollectionsStore } from '@/stores/collections';
import { useUserStore } from '@/stores/user';
import { isNil, orderBy } from 'lodash';
import { computed, ref, toRefs } from 'vue';
import { useNavigation } from '../composables/use-navigation';
import NavigationItem from './navigation-item.vue';

const props = defineProps<{
	currentCollection?: string;
}>();

const { currentCollection } = toRefs(props);
const { activeGroups, showHidden } = useNavigation(currentCollection);

const search = ref('');

const collectionsStore = useCollectionsStore();
const userStore = useUserStore();

const rootItems = computed(() => {
	const shownCollections = showHidden.value ? collectionsStore.allCollections : collectionsStore.visibleCollections;
	return orderBy(
		shownCollections.filter((collection) => {
			return isNil(collection?.meta?.group);
		}),
		['meta.sort', 'collection'],
	);
});

const dense = computed(() => collectionsStore.visibleCollections.length > 5);
const showSearch = computed(() => collectionsStore.visibleCollections.length > 20);

const hasHiddenCollections = computed(
	() => collectionsStore.allCollections.length > collectionsStore.visibleCollections.length,
);
</script>

<template>
	<div class="content-navigation-wrapper">
		<div v-if="showSearch" class="search-input">
			<v-input v-model="search" type="search" :placeholder="$t('search_collection')" />
		</div>

		<v-list
			v-model="activeGroups"
			v-context-menu="'contextMenu'"
			scope="content-navigation"
			class="content-navigation"
			tabindex="-1"
			nav
			:mandatory="false"
			:dense="dense"
		>
			<v-button
				v-if="userStore.isAdmin && collectionsStore.allCollections.length === 0"
				full-width
				outlined
				dashed
				to="/settings/data-model/+"
			>
				{{ $$t('create_collection') }}
			</v-button>

			<navigation-item
				v-for="collection in rootItems"
				:key="collection.collection"
				:show-hidden="showHidden"
				:collection="collection"
				:search="search"
			/>

			<v-menu v-if="hasHiddenCollections" ref="contextMenu" show-arrow placement="bottom-start">
				<v-list>
					<v-list-item clickable @click="showHidden = !showHidden">
						<v-list-item-icon>
							<v-icon :name="showHidden ? 'visibility_off' : 'visibility'" />
						</v-list-item-icon>
						<v-list-item-content>
							<v-text-overflow :text="showHidden ? t('hide_hidden_collections') : t('show_hidden_collections')" />
						</v-list-item-content>
					</v-list-item>
				</v-list>
			</v-menu>
		</v-list>
	</div>
</template>

<style lang="scss" scoped>
.group-name {
	padding-inline-start: 8px;
	font-weight: 600;
}

.empty {
	.v-button {
		--v-button-color: var(--theme--foreground-subdued);
		--v-button-background-color: var(--theme--foreground-subdued);
		--v-button-background-color-hover: var(--theme--primary);
	}
}

.content-navigation-wrapper {
	display: flex;
	flex-direction: column;
	min-block-size: 100%;
}

.content-navigation {
	--v-list-min-height: calc(100% - 64px);

	flex-grow: 1;

	.v-detail {
		:deep(.v-divider) {
			margin: 0;
		}

		&:not(:first-child) :deep(.v-divider) {
			margin-block-start: 8px;
		}

		&.empty :deep(.v-divider) {
			margin-block-end: 8px;
		}
	}
}

.hidden-collection {
	--v-list-item-color: var(--theme--foreground-subdued);
}

.search-input {
	--input-height: 40px;

	position: sticky;
	inset-block-start: 0;
	z-index: 2;
	padding: 12px;
	padding-block-end: 0;
	background-color: var(--theme--navigation--background);
}
</style>
