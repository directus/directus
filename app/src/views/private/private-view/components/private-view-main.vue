<script setup lang="ts">
import { SplitPanel } from '@directus/vue-split-panel';
import { useScroll } from '@vueuse/core';
import { computed, provide, useTemplateRef } from 'vue';
import SidebarDetailGroup from '../../components/sidebar-detail-group.vue';
import SkipMenu from '../../components/skip-menu.vue';
import { useSidebarStore } from '../stores/sidebar';
import PrivateViewHeaderBar from './private-view-header-bar.vue';
import PrivateViewResizeHandle from './private-view-resize-handle.vue';
import type { PrivateViewProps } from './private-view.vue';

const contentEl = useTemplateRef('contentEl');
provide('main-element', contentEl);

const props = defineProps<PrivateViewProps & { inlineNav: boolean }>();

defineOptions({ inheritAttrs: false });

const sidebarStore = useSidebarStore();

const { y } = useScroll(useTemplateRef('scrollContainer'));

const showHeaderShadow = computed(() => y.value > 0);
</script>

<template>
	<SkipMenu section="main" />

	<div id="main-content" ref="contentEl" class="content">
		<SplitPanel
			v-model:size="sidebarStore.size"
			v-model:collapsed="sidebarStore.collapsed"
			primary="end"
			size-unit="px"
			collapsible
			:collapsed-size="60"
			:collapse-threshold="70"
			:min-size="220"
			:max-size="400"
			:snap-points="[250]"
			:snap-threshold="6"
			divider-hit-area="24px"
			:transition-duration="150"
			class="main-split"
		>
			<template #start>
				<div ref="scrollContainer" class="scrolling-container">
					<PrivateViewHeaderBar :title="props.title" :shadow="showHeaderShadow" :inline-nav>
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

					<main ref="mainEl">
						<slot />
					</main>
				</div>
			</template>

			<template #divider>
				<PrivateViewResizeHandle />
			</template>

			<template #end>
				<skip-menu section="sidebar" />

				<aside
					id="sidebar"
					ref="sidebarEl"
					role="contentinfo"
					class="alt-colors"
					aria-label="Module Sidebar"
				>
					<div class="flex-container">
						<SidebarDetailGroup :sidebar-open="!sidebarStore.collapsed">
							<slot name="sidebar" />
						</SidebarDetailGroup>

						<div class="spacer" />

						<!-- <notifications-preview v-model="notificationsPreviewActive" :sidebar-open="sidebarOpen" /> -->
					</div>
				</aside>
			</template>
		</SplitPanel>
	</div>
</template>

<style scoped>
#main-content {
	block-size: 100%;

	--content-padding: 20px;
	--content-padding-bottom: 132px;
}

.main-split {
	block-size: 100%;
	position: relative;
}

.scrolling-container {
	overflow: auto;
	block-size: 100%;
	inline-size: 100%;
}

#sidebar {
	inline-size: 100%;
	block-size: 100%;
	overflow: hidden;
	background-color: var(--theme--sidebar--background);
	font-family: var(--theme--sidebar--font-family);
	border-inline-start: var(--theme--sidebar--border-width) solid var(--theme--sidebar--border-color);
	min-inline-size: 220px;

	html[dir='rtl'] & {
		transform: translateX(-100%);
	}

	/* Explicitly render the border outside of the width of the bar itself */
	box-sizing: content-box;

	.spacer {
		flex-grow: 1;
	}

	html[dir='rtl'] &.is-open,
	&.is-open {
		transform: translateX(0);
	}

	&.has-shadow {
		box-shadow: var(--sidebar-shadow);
	}

	.flex-container {
		display: flex;
		flex-direction: column;
		inline-size: 100%;
		block-size: 100%;
	}
}
</style>
