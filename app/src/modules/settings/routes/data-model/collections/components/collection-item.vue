<template>
	<div class="collection-item">
		<v-list-item block clickable :class="{ hidden: collection.meta?.hidden }">
			<v-list-item-icon>
				<v-icon class="drag-handle" name="drag_handle" />
			</v-list-item-icon>
			<div class="collection-name" @click="openCollection(collection)">
				<v-icon
					:color="collection.meta?.hidden ? 'var(--foreground-subdued)' : collection.color"
					class="collection-icon"
					:name="collection.meta?.hidden ? 'visibility_off' : collection.icon"
				/>
				<span class="collection-name">{{ collection.name }}</span>
			</div>
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
					@setNestedSort="$emit('setNestedSort', $event)"
					@toggleCollapsed="$emit('toggleCollapsed', $event)"
				/>
			</template>
		</draggable>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import CollectionOptions from './collection-options.vue';
import { Collection } from '@/types';
import { useRouter } from 'vue-router';
import Draggable from 'vuedraggable';

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
	},
	emits: ['setNestedSort', 'toggleCollapsed'],
	setup(props, { emit }) {
		const router = useRouter();

		const nestedCollections = computed(() =>
			props.collections.filter((collection) => collection.meta?.group === props.collection.collection)
		);

		const collapsed = computed(() => props.collection.meta?.collapse === 'closed');

		return { collapsed, openCollection, onGroupSortChange, nestedCollections };

		function openCollection({ collection }: Collection) {
			router.push(`/settings/data-model/${collection}`);
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

.collection-name {
	flex-grow: 1;
	font-family: var(--family-monospace);
}

.collection-icon {
	margin-right: 8px;
}

.drag-handle {
	cursor: grab;
}

.hidden {
	--v-list-item-color: var(--foreground-subdued);
	--v-icon-color: var(--foreground-subdued);
}

.toggle-collapse.collapsed {
	transform: rotate(90deg);
}
</style>
