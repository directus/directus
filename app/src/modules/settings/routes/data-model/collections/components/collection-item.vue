<template>
	<div class="collection-item">
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
					:color="collection.meta?.hidden ? 'var(--foreground-subdued)' : collection.color ?? 'var(--primary)'"
					class="collection-icon"
					:name="collection.meta?.hidden ? 'visibility_off' : collection.icon"
				/>
				<span ref="collectionName" class="collection-name">{{ collection.collection }}</span>
				<span v-if="collection.meta?.note" class="collection-note">{{ collection.meta.note }}</span>
			</div>
			<template v-if="collection.type === 'alias' || nestedCollections.length">
				<v-progress-circular v-if="collapseLoading" small indeterminate />
				<v-icon
					v-else-if="nestedCollections.length"
					v-tooltip="collapseTooltip"
					:name="collapseIcon"
					:clickable="nestedCollections.length > 0"
					@click.stop.prevent="toggleCollapse"
				/>
				<v-icon v-else :name="collapseIcon" />
			</template>
			<collection-options :collection="collection" />
		</v-list-item>

		<draggable
			:force-fallback="true"
			:model-value="nestedCollections"
			:group="{ name: 'collections' }"
			:swap-threshold="0.3"
			class="drag-container"
			item-key="collection"
			handle=".drag-handle"
			@update:model-value="onGroupSortChange"
		>
			<template #item="{ element }">
				<collection-item
					:collection="element"
					:collections="collections"
					@edit-collection="$emit('editCollection', $event)"
					@set-nested-sort="$emit('setNestedSort', $event)"
				/>
			</template>
		</draggable>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from 'vue';
import CollectionOptions from './collection-options.vue';
import { Collection } from '@/types/collections';
import Draggable from 'vuedraggable';
import { useCollectionsStore } from '@/stores/collections';
import { DeepPartial } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineComponent({
	name: 'CollectionItem',
	components: { CollectionOptions, Draggable },
	props: {
		collection: {
			type: Object as PropType<Collection>,
			required: true,
		},
		collections: {
			type: Array as PropType<Collection[]>,
			required: true,
		},
		disableDrag: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['setNestedSort', 'editCollection'],
	setup(props, { emit }) {
		const collectionsStore = useCollectionsStore();
		const { t } = useI18n();

		const nestedCollections = computed(() =>
			props.collections.filter((collection) => collection.meta?.group === props.collection.collection)
		);

		const collapseIcon = computed(() => {
			switch (props.collection.meta?.collapse) {
				case 'open':
					return 'folder_open';
				case 'closed':
					return 'folder';
				case 'locked':
					return 'folder_lock';
			}

			return undefined;
		});

		const collapseTooltip = computed(() => {
			switch (props.collection.meta?.collapse) {
				case 'open':
					return t('start_open');
				case 'closed':
					return t('start_collapsed');
				case 'locked':
					return t('always_open');
			}

			return undefined;
		});

		const collapseLoading = ref(false);

		return {
			collapseIcon,
			onGroupSortChange,
			nestedCollections,
			update,
			toggleCollapse,
			collapseTooltip,
			collapseLoading,
		};

		async function toggleCollapse() {
			if (collapseLoading.value === true) return;

			collapseLoading.value = true;

			let newCollapse: 'open' | 'closed' | 'locked' = 'open';

			if (props.collection.meta?.collapse === 'open') {
				newCollapse = 'closed';
			} else if (props.collection.meta?.collapse === 'closed') {
				newCollapse = 'locked';
			}

			try {
				await update({ meta: { collapse: newCollapse } });
			} catch (err: any) {
				unexpectedError(err);
			} finally {
				collapseLoading.value = false;
			}
		}

		async function update(updates: DeepPartial<Collection>) {
			await collectionsStore.updateCollection(props.collection.collection, updates);
		}

		function onGroupSortChange(collections: Collection[]) {
			const updates = collections.map((collection) => ({
				collection: collection.collection,
				meta: {
					group: props.collection.collection,
				},
			}));

			emit('setNestedSort', updates);
		}
	},
});
</script>

<style scoped>
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
	font-family: var(--family-monospace);
	pointer-events: none;
}

.collection-name {
	flex-shrink: 0;
}

.hidden .collection-name {
	color: var(--foreground-subdued);
}

.collection-note {
	margin-left: 16px;
	overflow: hidden;
	color: var(--foreground-subdued);
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
</style>
