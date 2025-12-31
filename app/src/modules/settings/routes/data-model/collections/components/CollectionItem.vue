<script setup lang="ts">
import { GroupedListItem } from '@/components/grouped-list';
import VHighlight from '@/components/v-highlight.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { Collection } from '@/types/collections';
import { CollectionTree } from '../collections.vue';
import CollectionOptions from './collection-options.vue';

defineProps<{
	collection: Collection;
	collections: Collection[];
	isCollapsed: boolean;
	visibilityTree: CollectionTree;
	disableDrag?: boolean;
}>();

const emit = defineEmits<{
	setNestedSort: [updates: { collection: string; meta: { group: string } }[]];
	editCollection: [collection: Collection];
	toggleCollapse: [id: string];
}>();

function getCollectionLink(item: Record<string, unknown>): string | undefined {
	const collection = item as Collection;
	// Only collections with schema have a detail page
	if (!collection.schema) return undefined;
	return `/settings/data-model/${collection.collection}`;
}

function handleItemClick(item: Record<string, unknown>) {
	emit('editCollection', item as Collection);
}

function handleNestedSort(updates: { id: string; group: string }[]) {
	// Convert from generic format to collection-specific format
	emit(
		'setNestedSort',
		updates.map((u) => ({
			collection: u.id,
			meta: { group: u.group },
		})),
	);
}
</script>

<template>
	<GroupedListItem
		:item="collection"
		:items="collections"
		:is-collapsed="isCollapsed"
		:visibility-tree="visibilityTree"
		:disable-drag="disableDrag"
		id-field="collection"
		group-field="meta.group"
		drag-group="collections"
		:get-item-link="getCollectionLink"
		clickable
		can-have-children
		@toggle-collapse="$emit('toggleCollapse', $event)"
		@set-nested-sort="handleNestedSort"
		@item-click="handleItemClick"
	>
		<template #icon="{ item }">
			<VIcon
				:color="
					(item as Collection).meta?.hidden
						? 'var(--theme--foreground-subdued)'
						: ((item as Collection).color ?? 'var(--theme--primary)')
				"
				class="collection-icon"
				:name="(item as Collection).meta?.hidden ? 'visibility_off' : (item as Collection).icon"
			/>
		</template>

		<template #content="{ item, search }">
			<VHighlight
				:query="search"
				:text="(item as Collection).collection"
				class="collection-name"
				:class="{ hidden: (item as Collection).meta?.hidden }"
			/>
			<span v-if="(item as Collection).meta?.note" class="collection-note">
				{{ (item as Collection).meta.note }}
			</span>
		</template>

		<template #actions="{ item, hasChildren }">
			<CollectionOptions
				:has-nested-collections="hasChildren"
				:collection="item as Collection"
				@collection-toggle="$emit('toggleCollapse', (item as Collection).collection)"
			/>
		</template>
	</GroupedListItem>
</template>

<style scoped lang="scss">
.collection-icon {
	margin-inline-end: 8px;
}

.collection-name {
	flex-shrink: 0;
	font-family: var(--theme--fonts--monospace--font-family);

	&.hidden {
		color: var(--theme--foreground-subdued);
	}
}

.collection-note {
	margin-inline-start: 16px;
	overflow: hidden;
	color: var(--theme--foreground-subdued);
	white-space: nowrap;
	text-overflow: ellipsis;
	opacity: 0;
	transition: opacity var(--fast) var(--transition);
}

.v-list-item:hover .collection-note {
	opacity: 1;
}
</style>
