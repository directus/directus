<script setup lang="ts">
import { SplitPanel } from '@directus/vue-split-panel';
import { useNavBarStore } from '../stores/nav-bar';
import PrivateViewMain from './private-view-main.vue';
import PrivateViewNav from './private-view-nav.vue';
import ModuleBar from '../../components/module-bar.vue';
import type { PrivateViewProps } from './private-view.vue';
import PrivateViewResizeHandle from './private-view-resize-handle.vue';
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core';
import PrivateViewDrawer from './private-view-drawer.vue';
import { computed, watch } from 'vue';
import { useSidebarStore } from '../stores/sidebar';

const { lg, xl } = useBreakpoints(breakpointsTailwind);

const navBarStore = useNavBarStore();
const sidebarStore = useSidebarStore();

defineProps<PrivateViewProps>();

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
		<ModuleBar v-if="lg" class="module-bar" />

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
			divider-hit-area="24px"
			:transition-duration="125"
			primary="start"
			class="root-split"
			:disabled="!inlineNav"
		>
			<template #start>
				<PrivateViewNav v-if="inlineNav">
					<template #navigation><slot name="navigation" /></template>
				</PrivateViewNav>

				<PrivateViewDrawer v-else v-model:collapsed="navBarStore.collapsed" placement="left">
					<ModuleBar class="module-bar" />

					<PrivateViewNav class="mobile-nav">
						<template #navigation><slot name="navigation" /></template>
					</PrivateViewNav>
				</PrivateViewDrawer>
			</template>

			<template #divider>
				<PrivateViewResizeHandle />
			</template>

			<template #end>
				<PrivateViewMain v-bind="$props" :inline-nav>
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

	--content-padding: 12px;
	--content-padding-bottom: 60px;

	@media (width > 640px) {
		--content-padding: 20px;
	}
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
</style>
