<script setup lang="ts">
import { SplitPanel } from '@directus/vue-split-panel';
import { useBreakpoints, useLocalStorage } from '@vueuse/core';
import { computed, ref } from 'vue';
import FlowFolderNavigation from './flow-folder-navigation.vue';
import { BREAKPOINTS } from '@/constants';
import PrivateViewResizeHandle from '@/views/private/private-view/components/private-view-resize-handle.vue';

const SIDEBAR_DEFAULT_SIZE = 260;
const SIDEBAR_MIN_SIZE = 200;
// When collapsed the sidebar shrinks to a rail that still shows the toggle, mirroring the main sidebar
const SIDEBAR_RAIL_SIZE = 52;

defineProps<{
	currentFolder?: string;
	actionsDisabled?: boolean;
	updateDisabled?: boolean;
	deleteDisabled?: boolean;
}>();

const emit = defineEmits<{
	navigate: [folderId: string | null];
	deleted: [parent: string | null];
}>();

const breakpoints = useBreakpoints(BREAKPOINTS);
const isMobile = breakpoints.smallerOrEqual('sm');

const sizeStorage = useLocalStorage<number>('flows-folder-sidebar-size', SIDEBAR_DEFAULT_SIZE);
const collapsedStorage = useLocalStorage<boolean>('flows-folder-sidebar-collapsed', false);
const enforceDefault = ref(false);

const collapsed = computed({
	get() {
		return collapsedStorage.value;
	},
	set(value: boolean) {
		if (!value) enforceDefault.value = true;
		collapsedStorage.value = value;
	},
});

const size = computed({
	get() {
		const storedValue = sizeStorage.value || SIDEBAR_DEFAULT_SIZE;

		// Enforce the default size when the panel is dragged below the minimum
		if (enforceDefault.value && storedValue <= SIDEBAR_MIN_SIZE) {
			return SIDEBAR_DEFAULT_SIZE;
		}

		return storedValue;
	},
	set(value: number) {
		if (isMobile.value) return;

		if (enforceDefault.value && value > SIDEBAR_MIN_SIZE) {
			enforceDefault.value = false;
		}

		sizeStorage.value = value;
	},
});

function toggle() {
	collapsed.value = !collapsed.value;
}

function onNavigate(folderId: string | null) {
	// Collapsing after a pick gets the folder tree out of the way on narrow screens
	if (isMobile.value) collapsed.value = true;
	emit('navigate', folderId);
}
</script>

<template>
	<SplitPanel
		v-model:size="size"
		v-model:collapsed="collapsed"
		primary="start"
		size-unit="px"
		collapsible
		:collapsed-size="SIDEBAR_RAIL_SIZE"
		:collapse-threshold="70"
		:min-size="SIDEBAR_MIN_SIZE"
		:max-size="400"
		:snap-points="[SIDEBAR_DEFAULT_SIZE]"
		:snap-threshold="6"
		:transition-duration="125"
		class="flow-folder-split"
		:disabled="isMobile"
	>
		<template #start>
			<FlowFolderNavigation
				:current-folder="currentFolder"
				:actions-disabled="actionsDisabled"
				:update-disabled="updateDisabled"
				:delete-disabled="deleteDisabled"
				:collapsed="collapsed"
				@navigate="onNavigate"
				@deleted="emit('deleted', $event)"
				@toggle="toggle"
			/>
		</template>

		<template #divider>
			<PrivateViewResizeHandle />
		</template>

		<template #end>
			<slot />
		</template>
	</SplitPanel>
</template>

<style scoped>
.flow-folder-split {
	block-size: 100%;
}

.flow-folder-split :deep(.sp-start) {
	overflow: hidden;
	border-inline-end: var(--theme--border-width) solid var(--theme--border-color);
}

.flow-folder-split :deep(.sp-divider) {
	z-index: 8;
}

.flow-folder-split :deep(.sp-end) {
	overflow: auto;
}
</style>
