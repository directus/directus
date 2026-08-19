<script setup lang="ts">
import { SplitPanel } from '@directus/vue-split-panel';
import { useBreakpoints, useLocalStorage } from '@vueuse/core';
import { computed, ref } from 'vue';
import FlowFolderNavigation from './flow-folder-navigation.vue';
import { BREAKPOINTS } from '@/constants';
import PrivateViewDrawer from '@/views/private/private-view/components/private-view-drawer.vue';
import PrivateViewResizeHandle from '@/views/private/private-view/components/private-view-resize-handle.vue';

const SIDEBAR_DEFAULT_SIZE = 260;
const SIDEBAR_MIN_SIZE = 200;

defineProps<{
	currentFolder?: string;
	actionsDisabled?: boolean;
}>();

const emit = defineEmits<{
	navigate: [folderId: string | null];
}>();

// Mobile opens the sidebar as an overlay drawer instead of an inline split
const drawerOpen = defineModel<boolean>('drawerOpen', { default: false });

const breakpoints = useBreakpoints(BREAKPOINTS);
const isMobile = breakpoints.smallerOrEqual('sm');

const sizeStorage = useLocalStorage<number>('flows-folder-sidebar-size', SIDEBAR_DEFAULT_SIZE);
const collapsedStorage = useLocalStorage<boolean>('flows-folder-sidebar-collapsed', false);
const enforceDefault = ref(false);

const minSize = computed(() => (isMobile.value ? 0 : SIDEBAR_MIN_SIZE));

const collapsed = computed({
	get() {
		// The inline panel is always hidden on mobile; the drawer takes over there
		return isMobile.value ? true : collapsedStorage.value;
	},
	set(value: boolean) {
		if (isMobile.value) return;
		if (!value) enforceDefault.value = true;
		collapsedStorage.value = value;
	},
});

const size = computed({
	get() {
		if (isMobile.value) return 0;

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

function onNavigate(folderId: string | null) {
	drawerOpen.value = false;
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
		:collapsed-size="0"
		:collapse-threshold="70"
		:min-size="minSize"
		:max-size="400"
		:snap-points="[SIDEBAR_DEFAULT_SIZE]"
		:snap-threshold="6"
		:transition-duration="125"
		class="flow-folder-split"
		:disabled="isMobile"
	>
		<template #start>
			<FlowFolderNavigation
				v-if="!isMobile"
				:current-folder="currentFolder"
				:actions-disabled="actionsDisabled"
				@navigate="onNavigate"
			/>

			<PrivateViewDrawer v-else :collapsed="!drawerOpen" placement="left" @update:collapsed="drawerOpen = !$event">
				<FlowFolderNavigation
					:current-folder="currentFolder"
					:actions-disabled="actionsDisabled"
					@navigate="onNavigate"
				/>
			</PrivateViewDrawer>
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
}

.flow-folder-split :deep(.sp-end) {
	overflow: auto;
}

.flow-folder-split.sp-collapsed :deep(.sp-divider) {
	display: none;
}
</style>
