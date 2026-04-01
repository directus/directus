<script setup lang="ts">
import { SplitPanel } from '@directus/vue-split-panel';
import { useBreakpoints } from '@vueuse/core';
import { computed, type ComputedRef, inject, provide, useTemplateRef, watch } from 'vue';
import NotificationsGroup from '../../components/notifications-group.vue';
import SkipMenu from '../../components/skip-menu.vue';
import { useSidebarStore } from '../stores/sidebar';
import PrivateViewDrawer from './private-view-drawer.vue';
import PrivateViewHeaderBar from './private-view-header-bar.vue';
import PrivateViewResizeHandle from './private-view-resize-handle.vue';
import PrivateViewSidebar from './private-view-sidebar.vue';
import type { PrivateViewProps } from './private-view.vue';
import { BREAKPOINTS } from '@/constants';
import { useUserStore } from '@/stores/user';

defineProps<PrivateViewProps & { inlineNav: boolean }>();

defineOptions({ inheritAttrs: false });

const contentEl = useTemplateRef('content-el');
provide('main-element', contentEl);

const userStore = useUserStore();
const sidebarStore = useSidebarStore();

const livePreviewActive = inject<ComputedRef<boolean>>(
	'live-preview-active',
	computed(() => false),
);

const breakpoints = useBreakpoints(BREAKPOINTS);
const isMobile = breakpoints.smallerOrEqual('sm');

watch(isMobile, (mobile) => {
	if (mobile) sidebarStore.collapse();
});

const splitterCollapsed = computed({
	get() {
		if (isMobile.value) return true;
		return sidebarStore.collapsed;
	},
	set(val: boolean) {
		if (isMobile.value) return;
		sidebarStore.collapsed = val;
	},
});

const teleportTarget = computed(() => (isMobile.value ? '#sidebar-mobile-outlet' : '#sidebar-desktop-outlet'));
</script>

<template>
	<div ref="content-el" v-bind="$attrs" class="content">
		<PrivateViewHeaderBar :title :inline-nav :icon :icon-color :show-back :back-to>
			<template #actions:append><slot name="actions:append" /></template>
			<template #actions:prepend><slot name="actions:prepend" /></template>
			<template #actions><slot name="actions" /></template>
			<template #headline><slot name="headline" /></template>
			<template #title-outer:append><slot name="title-outer:append" /></template>
			<template #title-outer:prepend><slot name="title-outer:prepend" /></template>
			<template #title:append><slot name="title:append" /></template>
			<template #title:prepend><slot name="title:prepend" /></template>
			<template #title><slot name="title" /></template>
		</PrivateViewHeaderBar>

		<SplitPanel
			v-model:size="sidebarStore.size"
			v-model:collapsed="splitterCollapsed"
			primary="end"
			size-unit="px"
			collapsible
			:collapsed-size="isMobile ? 0 : 54"
			:collapse-threshold="70"
			:min-size="252"
			:max-size="540"
			:snap-points="[333]"
			:direction="userStore.textDirection"
			:snap-threshold="6"
			divider-hit-area="4px"
			:transition-duration="125"
			class="main-split"
			:disabled="isMobile"
		>
			<template #start>
				<div ref="scroll-container" class="scrolling-container" :class="{ 'flex-layout': livePreviewActive }">
					<main ref="mainEl" class="main-content-container">
						<slot />
					</main>
				</div>

				<NotificationsGroup />
			</template>

			<template #divider>
				<PrivateViewResizeHandle />
			</template>

			<template #end>
				<div v-show="!isMobile" id="sidebar-desktop-outlet" class="sidebar-outlet sidebar-border" />
				<PrivateViewDrawer
					:collapsed="isMobile ? sidebarStore.collapsed : true"
					placement="right"
					keep-mounted
					@update:collapsed="isMobile && (sidebarStore.collapsed = $event ?? false)"
				>
					<div id="sidebar-mobile-outlet" class="sidebar-outlet" />
				</PrivateViewDrawer>
			</template>
		</SplitPanel>

		<Teleport defer :to="teleportTarget">
			<SkipMenu section="sidebar" />
			<PrivateViewSidebar id="sidebar" :class="{ 'mobile-sidebar': isMobile }">
				<template #sidebar><slot name="sidebar" /></template>
			</PrivateViewSidebar>
		</Teleport>
	</div>
</template>

<style scoped>
.content {
	block-size: 100%;
	display: flex;
	flex-direction: column;

	&:deep(.sp-start) {
		position: relative;
	}

	&:deep(.sp-divider) {
		z-index: 8;
	}
}

.main-split {
	flex: 1;
	min-block-size: 0;
	position: relative;
}

.scrolling-container {
	overflow: auto;
	block-size: 100%;
	inline-size: 100%;
	position: relative;
}

.scrolling-container.flex-layout {
	display: flex;
	flex-direction: column;
}

.scrolling-container.flex-layout main {
	flex: 1;
	min-block-size: 0;
}

.mobile-sidebar {
	max-inline-size: var(--sidebar-mobile-width);
}

.sidebar-outlet {
	block-size: 100%;
	inline-size: 100%;
}

.sidebar-border {
	border-inline-start: var(--theme--sidebar--border-width) solid var(--theme--sidebar--border-color);
}

.main-content-container {
	inline-size: 100%;
	block-size: 100%;
}
</style>
