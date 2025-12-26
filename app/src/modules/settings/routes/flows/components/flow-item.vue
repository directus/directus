<script setup lang="ts">
import { GroupedListItem } from '@/components/grouped-list';
import DisplayColor from '@/displays/color/color.vue';
import VHighlight from '@/components/v-highlight.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import type { VisibilityTreeNode } from '@/composables/use-visibility-tree';
import type { FlowRaw } from '@directus/types';
import { computed } from 'vue';
import FlowOptions from './flow-options.vue';

const props = defineProps<{
	flow: FlowRaw & { isCollapsed?: boolean };
	flows: (FlowRaw & { isCollapsed?: boolean })[];
	isCollapsed: boolean;
	visibilityTree: VisibilityTreeNode<string>;
	disableDrag?: boolean;
}>();

const emit = defineEmits<{
	setNestedSort: [updates: { id: string; group: string }[]];
	editFlow: [flow: FlowRaw];
	toggleCollapse: [id: string];
}>();

const isFolder = computed(() => props.flow.trigger === null);

// Helper functions to compute values from any flow item (used in slots)
function getFlowIcon(item: FlowRaw): string {
	if (item.trigger === null) {
		return item.icon || 'folder';
	}
	return item.icon || 'bolt';
}

function getTriggerIcon(trigger: string | null): string | null {
	switch (trigger) {
		case 'event':
			return 'sensors';
		case 'webhook':
			return 'webhook';
		case 'schedule':
			return 'schedule';
		case 'operation':
			return 'bolt';
		case 'manual':
			return 'touch_app';
		default:
			return null;
	}
}

function getFlowLink(item: Record<string, unknown>): string | undefined {
	const flow = item as FlowRaw;
	// Folders don't have a detail page
	if (flow.trigger === null) return undefined;
	return `/settings/flows/${flow.id}`;
}

function handleItemClick(item: Record<string, unknown>) {
	emit('editFlow', item as unknown as FlowRaw);
}
</script>

<template>
	<GroupedListItem
		:item="flow"
		:items="flows"
		:is-collapsed="isCollapsed"
		:visibility-tree="visibilityTree"
		:disable-drag="disableDrag"
		id-field="id"
		group-field="group"
		drag-group="flows"
		:get-item-link="getFlowLink"
		:clickable="true"
		:can-have-children="true"
		@toggle-collapse="$emit('toggleCollapse', $event)"
		@set-nested-sort="$emit('setNestedSort', $event)"
		@item-click="handleItemClick"
	>
		<template #icon="{ item }">
			<VIcon
				:color="(item as FlowRaw).color ?? 'var(--theme--primary)'"
				class="flow-icon"
				:name="getFlowIcon(item as FlowRaw)"
			/>
		</template>

		<template #content="{ item, search }">
			<VHighlight
				:query="search"
				:text="(item as FlowRaw).name"
				class="flow-name"
			/>
		</template>

		<template #meta="{ item }">
			<div class="flow-meta">
				<DisplayColor
					v-if="(item as FlowRaw).trigger !== null"
					v-tooltip="(item as FlowRaw).status === 'active' ? $t('active') : $t('inactive')"
					class="status-dot"
					:value="(item as FlowRaw).status === 'active' ? 'var(--theme--success)' : 'var(--theme--foreground-subdued)'"
				/>
				<VIcon
					v-if="getTriggerIcon((item as FlowRaw).trigger)"
					v-tooltip="$t(`triggers.${(item as FlowRaw).trigger}.name`)"
					:name="getTriggerIcon((item as FlowRaw).trigger)!"
					class="trigger-icon"
					small
				/>
			</div>
		</template>

		<template #actions="{ item, hasChildren }">
			<FlowOptions
				:flow="(item as FlowRaw)"
				:is-folder="(item as FlowRaw).trigger === null"
				:has-children="hasChildren"
				@edit="$emit('editFlow', item as FlowRaw)"
				@toggle-collapse="$emit('toggleCollapse', (item as FlowRaw).id)"
			/>
		</template>
	</GroupedListItem>
</template>

<style scoped lang="scss">
.flow-icon {
	margin-inline-end: 8px;
}

.flow-name {
	flex-shrink: 1;
	min-width: 80px;
	overflow: hidden;
	font-family: var(--theme--fonts--monospace--font-family);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.flow-meta {
	display: flex;
	flex-shrink: 0;
	gap: 12px;
	align-items: center;
	margin-inline-start: auto;
	padding-inline-start: 12px;
}

.status-dot {
	cursor: help;
}

.trigger-icon {
	--v-icon-color: var(--theme--foreground);

	&:hover {
		--v-icon-color: var(--theme--primary);
	}
}
</style>
