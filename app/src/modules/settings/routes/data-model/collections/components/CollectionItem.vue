<script setup lang="ts">
import TransitionExpand from '@/components/transition/expand.vue';
import VHighlight from '@/components/v-highlight.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import { Collection } from '@/types/collections';
import { computed } from 'vue';
import Draggable from 'vuedraggable';
import { CollectionTree } from '../collections.vue';
import CollectionOptions from './collection-options.vue';

const props = defineProps<{
	collection: Collection;
	collections: Collection[];
	isCollapsed: boolean;
	visibilityTree: CollectionTree;
	disableDrag?: boolean;
}>();

const emit = defineEmits(['setNestedSort', 'editCollection', 'toggleCollapse']);

const toggleCollapse = () => {
	emit('toggleCollapse', props.collection.collection);
};

const nestedCollections = computed(() =>
	props.collections.filter((collection) => collection.meta?.group === props.collection.collection),
);

function onGroupSortChange(collections: Collection[]) {
	const updates = collections.map((collection) => ({
		collection: collection.collection,
		meta: {
			group: props.collection.collection,
		},
	}));

	emit('setNestedSort', updates);
}
</script>

<template>
	<div v-show="visibilityTree.visible" class="collection-item">
		<VListItem
			block
			dense
			clickable
			:class="{ hidden: collection.meta?.hidden }"
			:to="collection.schema ? `/settings/data-model/${collection.collection}` : undefined"
			@click.self="!collection.schema ? $emit('editCollection', collection) : null"
		>
			<VListItemIcon>
				<VIcon v-if="!disableDrag" class="drag-handle" name="drag_handle" />
			</VListItemIcon>
			<div class="collection-item-detail">
				<VIcon
					:color="
						collection.meta?.hidden ? 'var(--theme--foreground-subdued)' : (collection.color ?? 'var(--theme--primary)')
					"
					class="collection-icon"
					:name="collection.meta?.hidden ? 'visibility_off' : collection.icon"
				/>
				<VHighlight
					ref="collectionName"
					:query="visibilityTree.search"
					:text="collection.collection"
					class="collection-name"
				/>
				<span v-if="collection.meta?.note" class="collection-note">{{ collection.meta.note }}</span>
			</div>

			<VIcon
				v-if="nestedCollections?.length"
				v-tooltip="!isCollapsed ? $t('collapse') : $t('expand')"
				:name="!isCollapsed ? 'unfold_less' : 'unfold_more'"
				clickable
				class="collapse-toggle"
				@click.stop.prevent="toggleCollapse"
			/>
			<CollectionOptions
				:has-nested-collections="nestedCollections.length > 0"
				:collection="collection"
				@collection-toggle="toggleCollapse"
			/>
		</VListItem>

		<TransitionExpand class="collection-items">
			<Draggable
				v-if="!isCollapsed"
				:model-value="nestedCollections"
				:group="{ name: 'collections' }"
				:swap-threshold="0.3"
				class="drag-container"
				item-key="collection"
				handle=".drag-handle"
				v-bind="{ 'force-fallback': true }"
				@update:model-value="onGroupSortChange"
			>
				<template #item="{ element }">
					<CollectionItem
						:collection="element"
						:collections="collections"
						:is-collapsed="element.isCollapsed"
						:visibility-tree="visibilityTree.findChild(element.collection)!"
						@edit-collection="$emit('editCollection', $event)"
						@set-nested-sort="$emit('setNestedSort', $event)"
						@toggle-collapse="$emit('toggleCollapse', $event)"
					/>
				</template>
			</Draggable>
		</TransitionExpand>
	</div>
</template>

<style scoped lang="scss">
.drag-container {
	margin-block-start: 8px;
	margin-inline-start: 20px;
}

.collection-item {
	margin-block-end: 8px;
}

.collection-item-detail {
	display: flex;
	flex-grow: 1;
	align-items: center;
	block-size: 100%;
	overflow: hidden;
	font-family: var(--theme--fonts--monospace--font-family);
	pointer-events: none;
}

.collection-name {
	flex-shrink: 0;
}

.hidden .collection-name {
	color: var(--theme--foreground-subdued);
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

.collection-icon {
	margin-inline-end: 8px;
}

.drag-handle {
	cursor: grab;
}

.collapse-toggle {
	--v-icon-color: var(--theme--foreground-subdued);

	&:hover {
		--v-icon-color: var(--theme--foreground);
	}
}
</style>
