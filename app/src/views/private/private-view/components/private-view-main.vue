<script setup lang="ts">
import { BREAKPOINTS } from '@/constants';
import { useUserStore } from '@/stores/user';
import { cssVar } from '@directus/utils/browser';
import { SplitPanel } from '@directus/vue-split-panel';
import { useBreakpoints, useResizeObserver, useScroll } from '@vueuse/core';
import { computed, inject, provide, ref, unref, useTemplateRef, watch, type ComputedRef } from 'vue';
import NotificationsGroup from '../../components/notifications-group.vue';
import SkipMenu from '../../components/skip-menu.vue';
import { useSidebarStore } from '../stores/sidebar';
import PrivateViewDrawer from './private-view-drawer.vue';
import PrivateViewHeaderBar from './private-view-header-bar.vue';
import PrivateViewResizeHandle from './private-view-resize-handle.vue';
import PrivateViewSidebar from './private-view-sidebar.vue';
import type { PrivateViewProps } from './private-view.vue';

const props = defineProps<PrivateViewProps & { inlineNav: boolean }>();

defineOptions({ inheritAttrs: false });

const contentEl = useTemplateRef('content-el');
provide('main-element', contentEl);

const userStore = useUserStore();
const sidebarStore = useSidebarStore();

const scrollContainerRef = useTemplateRef('scroll-container');

const { y, x } = useScroll(scrollContainerRef);

const containerWidth = ref(0);
const scrollableWidth = ref(0);

useResizeObserver(scrollContainerRef, ([entry]) => {
	const el = entry?.target as HTMLElement | undefined;
	if (!el) return;
	containerWidth.value = el.clientWidth;
	scrollableWidth.value = el.scrollWidth;
});

const enforceShadows = computed(() => props.sidebarShadow || false);
const contentPadding = computed(() => parseInt(cssVar('--content-padding'), 10) || 12);

const showStartShadow = computed(() => {
	if (enforceShadows.value) return true;
	return x.value >= contentPadding.value;
});

const showEndShadow = computed(() => {
	if (enforceShadows.value) return true;
	return scrollableWidth.value - containerWidth.value - x.value >= contentPadding.value;
});

const livePreviewActive = inject<ComputedRef<boolean>>(
	'live-preview-active',
	computed(() => false),
);

const showHeaderShadow = computed(
	() => enforceShadows.value || props.showHeaderShadow || y.value > 0 || unref(livePreviewActive),
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
</script>

<template>
	<div ref="content-el" v-bind="$attrs" class="content">
		<SplitPanel
			v-model:size="sidebarStore.size"
			v-model:collapsed="splitterCollapsed"
			primary="end"
			size-unit="px"
			collapsible
			:collapsed-size="isMobile ? 0 : 60"
			:collapse-threshold="70"
			:min-size="280"
			:max-size="600"
			:snap-points="[370]"
			:direction="userStore.textDirection"
			:snap-threshold="6"
			divider-hit-area="24px"
			:transition-duration="125"
			class="main-split"
			:disabled="isMobile"
		>
			<template #start>
				<div class="scroll-shadow start" :class="{ visible: showStartShadow }" />
				<div class="scroll-shadow end" :class="{ visible: showEndShadow }" />
				<div ref="scroll-container" class="scrolling-container" :class="{ 'flex-layout': livePreviewActive }">
					<PrivateViewHeaderBar
						:title="props.title"
						:shadow="showHeaderShadow"
						:inline-nav
						:icon
						:icon-color
						:show-back
					>
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
				<template v-if="!isMobile">
					<SkipMenu section="sidebar" />
					<PrivateViewSidebar id="sidebar">
						<template #sidebar><slot name="sidebar" /></template>
					</PrivateViewSidebar>
				</template>

				<PrivateViewDrawer v-else v-model:collapsed="sidebarStore.collapsed" placement="right">
					<SkipMenu section="sidebar" />
					<PrivateViewSidebar id="sidebar" class="mobile-sidebar">
						<template #sidebar><slot name="sidebar" /></template>
					</PrivateViewSidebar>
				</PrivateViewDrawer>
			</template>
		</SplitPanel>
	</div>
</template>

<style scoped>
.content {
	block-size: 100%;

	&:deep(.sp-start) {
		position: relative;
	}

	&:deep(.sp-divider) {
		z-index: 8;
	}
}

.scroll-shadow {
	position: absolute;
	inset-block: 0;
	inline-size: 7px;
	pointer-events: none;
	z-index: 6;
	opacity: 0;
	transition: opacity var(--medium) var(--transition);
}

.scroll-shadow.visible {
	opacity: 1;
}

.scroll-shadow.start {
	inset-inline-start: 0;
	background: linear-gradient(to right, var(--shadow-color, transparent), transparent);
}

.scroll-shadow.end {
	inset-inline-end: 0;
	background: linear-gradient(to left, var(--shadow-color, transparent), transparent);
}

:dir(rtl) .scroll-shadow.start {
	background: linear-gradient(to left, var(--shadow-color, transparent), transparent);
}

:dir(rtl) .scroll-shadow.end {
	background: linear-gradient(to right, var(--shadow-color, transparent), transparent);
}

.main-split {
	block-size: 100%;
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
	max-inline-size: 340px;
}

.main-content-container {
	inline-size: 100%;
	block-size: calc(100% - 60px);
}
</style>
