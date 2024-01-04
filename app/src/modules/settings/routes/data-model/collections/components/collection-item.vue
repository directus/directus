<script setup lang="ts">
import { useLocalStorage } from '@/composables/use-local-storage';
import { Collection } from '@/types/collections';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import CollectionOptions from './collection-options.vue';
import { CollectionTree } from '../collections.vue';

const props = defineProps<{
	collection: Collection;
	collections: Collection[];
	visibilityTree: CollectionTree;
	disableDrag?: boolean;
}>();

const emit = defineEmits(['setNestedSort', 'editCollection']);

const { t } = useI18n();
const { data: isCollectionExpanded } = useLocalStorage(`settings-collapsed-${props.collection.collection}`, true);

const toggleCollapse = () => {
	isCollectionExpanded.value = !isCollectionExpanded.value;
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
		<v-list-item
			block
			dense
			clickable
			:class="{ hidden: collection.meta?.hidden }"
			:to="collection.schema ? `/settings/data-model/${collection.collection}` : undefined"
			@click.self="!collection.schema ? $emit('editCollection', collection) : null"
		>
			<v-list-item-icon>
				<v-icon v-if="!disableDrag" class="drag-handle" name="drag_handle" />
			</v-list-item-icon>
			<div class="collection-item-detail">
				<v-icon
					:color="
						collection.meta?.hidden ? 'var(--theme--foreground-subdued)' : collection.color ?? 'var(--theme--primary)'
					"
					class="collection-icon"
					:name="collection.meta?.hidden ? 'visibility_off' : collection.icon"
				/>
				<v-highlight
					ref="collectionName"
					:query="visibilityTree.search"
					:text="collection.collection"
					class="collection-name"
				/>
				<span v-if="collection.meta?.note" class="collection-note">{{ collection.meta.note }}</span>
			</div>

			<v-icon
				v-if="nestedCollections?.length"
				v-tooltip="isCollectionExpanded ? t('collapse') : t('expand')"
				:name="isCollectionExpanded ? 'unfold_less' : 'unfold_more'"
				clickable
				class="collapse-toggle"
				@click.stop.prevent="toggleCollapse"
			/>
			<collection-options
				:has-nested-collections="nestedCollections.length > 0"
				:collection="collection"
				@collection-toggle="toggleCollapse"
			/>
		</v-list-item>

		<transition-expand class="collection-items">
			<draggable
				v-if="isCollectionExpanded"
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
					<collection-item
						:collection="element"
						:collections="collections"
						:visibility-tree="visibilityTree.findChild(element.collection)!"
						@edit-collection="$emit('editCollection', $event)"
						@set-nested-sort="$emit('setNestedSort', $event)"
					/>
				</template>
			</draggable>
		</transition-expand>
	</div>
</template>

<style scoped lang="scss">
.drag-container {
	margin-top: 8px;
	margin-left: 20px;
}

.collection-item {
	margin-bottom: 8px;
}

.collection-item-detail {
	display: flex;
	flex-grow: 1;
	align-items: center;
	height: 100%;
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
	margin-left: 16px;
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
	margin-right: 8px;
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
