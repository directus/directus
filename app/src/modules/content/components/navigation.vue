<script setup lang="ts">
import { isNil, orderBy } from 'lodash';
import { computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNavigation } from '../composables/use-navigation';
import NavigationItem from './NavigationItem.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useCollectionsStore } from '@/stores/collections';
import { useUserStore } from '@/stores/user';

const { t } = useI18n();
const isMacOS = navigator.platform.toUpperCase().includes('MAC');

function openCommandPalette() {
	window.dispatchEvent(new CustomEvent('open-command-palette'));
}

const props = defineProps<{
	currentCollection?: string;
}>();

const { currentCollection } = toRefs(props);
const { activeGroups, showHidden } = useNavigation(currentCollection);

const search = '';

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
const hasHiddenCollections = computed(
	() => collectionsStore.allCollections.length > collectionsStore.visibleCollections.length,
);
</script>

<template>
	<div class="content-navigation-wrapper">
		<div class="command-palette-trigger" @click="openCommandPalette">
			<span>{{ t('search') }}...</span>
			<span class="keys">
				<kbd>{{ isMacOS ? '⌘' : 'Ctrl+' }}</kbd>
				<kbd>K</kbd>
			</span>
		</div>

		<VList
			v-model="activeGroups"
			v-context-menu="'contextMenu'"
			scope="content-navigation"
			class="content-navigation"
			tabindex="-1"
			nav
			:mandatory="false"
			:dense="dense"
		>
			<VButton
				v-if="userStore.isAdmin && collectionsStore.allCollections.length === 0"
				full-width
				outlined
				dashed
				to="/settings/data-model/+"
			>
				{{ $t('create_collection') }}
			</VButton>

			<NavigationItem
				v-for="collection in rootItems"
				:key="collection.collection"
				:show-hidden="showHidden"
				:collection="collection"
				:search="search"
			/>

			<VMenu v-if="hasHiddenCollections" ref="contextMenu" show-arrow placement="bottom-start">
				<VList>
					<VListItem clickable @click="showHidden = !showHidden">
						<VListItemIcon>
							<VIcon :name="showHidden ? 'visibility_off' : 'visibility'" />
						</VListItemIcon>
						<VListItemContent>
							<VTextOverflow :text="showHidden ? $t('hide_hidden_collections') : $t('show_hidden_collections')" />
						</VListItemContent>
					</VListItem>
				</VList>
			</VMenu>
		</VList>
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

.command-palette-trigger {
	cursor: pointer;
	display: flex;
	background-color: var(--theme--background);
	gap: 8px;
	justify-content: center;
	align-items: center;
	border: 1px solid var(--theme--border-color);
	padding: 6px 12px;
	border-radius: var(--theme--border-radius);
	color: var(--theme--foreground-subdued);
	margin: 12px 12px 0;
	transition: all var(--fast) var(--transition);

	&:hover {
		border-color: var(--theme--primary);
		color: var(--theme--foreground-accent);
	}

	.keys {
		border: 1px solid var(--theme--border-color);
		padding: 0 6px;
		border-radius: 4px;
		font-size: 87.5%;
	}
}

.search-input {
	--theme--form--field--input--height: 40px;

	position: sticky;
	inset-block-start: 0;
	z-index: 1;
	padding: 12px;
	padding-block-end: 0;
	background-color: var(--theme--navigation--background);
}
</style>
