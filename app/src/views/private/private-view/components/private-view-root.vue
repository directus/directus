<script setup lang="ts">
import { BREAKPOINTS } from '@/constants';
import { useUserStore } from '@/stores/user';
import { SplitPanel } from '@directus/vue-split-panel';
import { useBreakpoints } from '@vueuse/core';
import { computed, watch } from 'vue';
import ModuleBar from '../../components/module-bar.vue';
import SkipMenu from '../../components/skip-menu.vue';
import { useNavBarStore } from '../stores/nav-bar';
import { useSidebarStore } from '../stores/sidebar';
import PrivateViewDrawer from './private-view-drawer.vue';
import PrivateViewMain from './private-view-main.vue';
import PrivateViewNav from './private-view-nav.vue';
import PrivateViewResizeHandle from './private-view-resize-handle.vue';
import type { PrivateViewProps } from './private-view.vue';

defineProps<PrivateViewProps>();

const { lg, xl } = useBreakpoints(BREAKPOINTS);

const userStore = useUserStore();
const navBarStore = useNavBarStore();
const sidebarStore = useSidebarStore();

const inlineNav = computed(() => {
	return sidebarStore.collapsed ? lg.value : xl.value;
});

watch(inlineNav, (inline) => {
	if (!inline) navBarStore.collapse();
	else navBarStore.expand();
});

const splitterCollapsed = computed({
	get() {
		if (inlineNav.value === false) return true;
		return navBarStore.collapsed;
	},
	set(val: boolean) {
		if (inlineNav.value === false) return;
		navBarStore.collapsed = val;
	},
});
</script>

<template>
	<div class="private-view">
		<template v-if="lg">
			<SkipMenu section="nav" />
			<ModuleBar id="navigation" class="module-bar" />
		</template>

		<SplitPanel
			v-model:size="navBarStore.size"
			v-model:collapsed="splitterCollapsed"
			size-unit="px"
			collapsible
			:collapse-threshold="70"
			:min-size="220"
			:max-size="340"
			:snap-points="[250]"
			:snap-threshold="6"
			:direction="userStore.textDirection"
			divider-hit-area="24px"
			:transition-duration="125"
			primary="start"
			class="root-split"
			:disabled="!inlineNav"
		>
			<template #start>
				<template v-if="inlineNav">
					<SkipMenu section="moduleNav" />
					<PrivateViewNav id="module-navigation">
						<template #navigation><slot name="navigation" /></template>
					</PrivateViewNav>
				</template>

				<PrivateViewDrawer v-else v-model:collapsed="navBarStore.collapsed" placement="left">
					<SkipMenu section="nav" />
					<ModuleBar id="navigation" class="module-bar" />

					<SkipMenu section="moduleNav" class="mobile-skip-menu" />
					<PrivateViewNav id="module-navigation" class="mobile-nav">
						<template #navigation><slot name="navigation" /></template>
					</PrivateViewNav>
				</PrivateViewDrawer>
			</template>

			<template #divider>
				<PrivateViewResizeHandle />
			</template>

			<template #end>
				<SkipMenu section="main" />
				<PrivateViewMain id="main-content" v-bind="$props" :inline-nav>
					<template #actions:append><slot name="actions:append" /></template>
					<template #actions:prepend><slot name="actions:prepend" /></template>
					<template #actions><slot name="actions" /></template>
					<template #headline><slot name="headline" /></template>
					<template #title-outer:append><slot name="title-outer:append" /></template>
					<template #title-outer:prepend><slot name="title-outer:prepend" /></template>
					<template #title:append><slot name="title:append" /></template>
					<template #title:prepend><slot name="title:prepend" /></template>
					<template #title><slot name="title" /></template>
					<template #sidebar><slot name="sidebar" /></template>
					<slot />
				</PrivateViewMain>
			</template>
		</SplitPanel>
	</div>
</template>

<style scoped>
.private-view {
	block-size: 100%;
	display: flex;
}

.module-bar {
	flex-shrink: 0;
}

.root-split {
	flex-grow: 1;
	block-size: 100%;
	position: relative;
}

:deep(.root-split > :is(.sp-start, .sp-end)) {
	overflow-y: auto;
}

.mobile-nav {
	inline-size: 0;
	max-inline-size: 340px;
	flex-grow: 1;
	flex-shrink: 1;
}

.root-split.sp-dragging :deep(iframe),
.root-split:active :deep(iframe) {
	pointer-events: none !important;
}
</style>
