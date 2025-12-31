<script setup lang="ts">
import TransitionExpand from '@/components/transition/expand.vue';
import VHighlight from '@/components/v-highlight.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import type { VisibilityTreeNode } from '@/composables/use-visibility-tree';
import { computed, defineAsyncComponent, useSlots } from 'vue';
import Draggable from 'vuedraggable';

// Recursive component reference for nested items
const GroupedListItem = defineAsyncComponent(() => import('./grouped-list-item.vue'));

 
type ItemType = Record<string, any>;

const slots = useSlots();

const props = withDefaults(
	defineProps<{
		/** The current item */
		item: ItemType;
		/** All items (for finding nested children) */
		items: ItemType[];
		/** Whether this item is collapsed */
		isCollapsed: boolean;
		/** Visibility tree node for this item */
		visibilityTree: VisibilityTreeNode<string>;
		/** Disable drag-and-drop */
		disableDrag?: boolean;
		/** Field name for the item ID */
		idField?: string;
		/** Field name for the parent/group reference */
		groupField?: string;
		/** Draggable group name */
		dragGroup?: string;
		/** Link destination (if clickable) */
		to?: string;
		/** Function to compute link destination for any item */
		getItemLink?: (item: ItemType) => string | undefined;
		/** Whether the item row is clickable */
		clickable?: boolean;
		/** Whether this item can accept children (enables drop zone) */
		canHaveChildren?: boolean;
	}>(),
	{
		disableDrag: false,
		idField: 'id',
		groupField: 'group',
		dragGroup: 'items',
		clickable: true,
		canHaveChildren: true,
	},
);

// Compute the link for this item
const itemLink = computed(() => {
	if (props.to !== undefined) return props.to;
	if (props.getItemLink) return props.getItemLink(props.item);
	return undefined;
});

const emit = defineEmits<{
	setNestedSort: [updates: { id: string; group: string }[]];
	toggleCollapse: [id: string];
	itemClick: [item: ItemType];
}>();

// Helper to get value at a nested path (e.g., "meta.group")
function getNestedValue(obj: ItemType, path: string): unknown {
	return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

const itemId = computed(() => props.item[props.idField] as string);

const nestedItems = computed(() =>
	props.items.filter((item) => getNestedValue(item, props.groupField) === itemId.value),
);

function toggleCollapse() {
	emit('toggleCollapse', itemId.value);
}

function onGroupSortChange(items: ItemType[]) {
	const updates = items.map((item) => ({
		id: item[props.idField] as string,
		group: itemId.value,
	}));

	emit('setNestedSort', updates);
}

function handleItemClick() {
	if (!itemLink.value) {
		emit('itemClick', props.item);
	}
}
</script>

<template>
	<div v-show="visibilityTree.visible" class="grouped-list-item">
		<VListItem
			block
			dense
			:clickable="clickable"
			:to="itemLink"
			@click.self="handleItemClick"
		>
			<VListItemIcon>
				<VIcon v-if="!disableDrag" class="drag-handle" name="drag_handle" />
			</VListItemIcon>

			<div class="item-detail">
				<!-- Icon slot -->
				<slot name="icon" :item="item">
					<VIcon class="item-icon" name="folder" />
				</slot>

				<!-- Content slot (default shows name with search highlight) -->
				<slot name="content" :item="item" :search="visibilityTree.search">
					<VHighlight
						:query="visibilityTree.search"
						:text="String(item.name || item[idField])"
						class="item-name"
					/>
				</slot>
			</div>

			<!-- Meta slot (for status indicators, badges, etc.) -->
			<slot name="meta" :item="item" />

			<!-- Collapse toggle -->
			<VIcon
				v-if="nestedItems.length"
				v-tooltip="!isCollapsed ? $t('collapse') : $t('expand')"
				:name="!isCollapsed ? 'unfold_less' : 'unfold_more'"
				clickable
				class="collapse-toggle"
				@click.stop.prevent="toggleCollapse"
			/>

			<!-- Actions slot -->
			<slot name="actions" :item="item" :has-children="nestedItems.length > 0" />
		</VListItem>

		<TransitionExpand class="nested-items">
			<Draggable
				v-if="canHaveChildren && !isCollapsed"
				:model-value="nestedItems"
				:group="{ name: dragGroup }"
				:swap-threshold="0.3"
				class="drag-container draggable-list"
				:item-key="idField"
				handle=".drag-handle"
				v-bind="{ 'force-fallback': true }"
				@update:model-value="onGroupSortChange"
			>
				<template #item="{ element }">
					<GroupedListItem
						:item="element"
						:items="items"
						:is-collapsed="element.isCollapsed"
						:visibility-tree="visibilityTree.findChild(element[idField])!"
						:disable-drag="disableDrag"
						:id-field="idField"
						:group-field="groupField"
						:drag-group="dragGroup"
						:get-item-link="getItemLink"
						:clickable="clickable"
						:can-have-children="element.canHaveChildren ?? canHaveChildren"
						@toggle-collapse="$emit('toggleCollapse', $event)"
						@set-nested-sort="$emit('setNestedSort', $event)"
						@item-click="$emit('itemClick', $event)"
					>
						<template v-if="slots.icon" #icon="_iconData">
							<slot name="icon" v-bind="(_iconData as Record<string, unknown>)" />
						</template>
						<template v-if="slots.content" #content="_contentData">
							<slot name="content" v-bind="(_contentData as Record<string, unknown>)" />
						</template>
						<template v-if="slots.meta" #meta="_metaData">
							<slot name="meta" v-bind="(_metaData as Record<string, unknown>)" />
						</template>
						<template v-if="slots.actions" #actions="_actionsData">
							<slot name="actions" v-bind="(_actionsData as Record<string, unknown>)" />
						</template>
					</GroupedListItem>
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

.grouped-list-item {
	margin-block-end: 8px;
}

.item-detail {
	display: flex;
	flex-grow: 1;
	align-items: center;
	block-size: 100%;
	overflow: hidden;
	pointer-events: none;

	// Ensure slot content also doesn't capture clicks
	:deep(*) {
		pointer-events: none;
	}
}

.item-name {
	flex-shrink: 0;
}

.item-icon {
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
