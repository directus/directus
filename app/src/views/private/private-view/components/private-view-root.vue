<script setup lang="ts">
import { SplitPanel } from '@directus/vue-split-panel';
import { useNavBarStore } from '../stores/nav-bar';
import PrivateViewMain from './private-view-main.vue';
import PrivateViewNav from './private-view-nav.vue';
import ModuleBar from '../../components/module-bar.vue';
import type { PrivateViewProps } from './private-view.vue';
import PrivateViewResizeHandle from './private-view-resize-handle.vue';

const navBarStore = useNavBarStore();

defineProps<PrivateViewProps>();
</script>

<template>
	<div class="private-view">
		<ModuleBar class="module-bar" />

		<SplitPanel
			v-model:size="navBarStore.size"
			v-model:collapsed="navBarStore.collapsed"
			size-unit="px"
			collapsible
			:collapse-threshold="70"
			:min-size="220"
			:max-size="500"
			:snap-points="[250]"
			:snap-threshold="6"
			divider-hit-area="24px"
			:transition-duration="150"
			primary="start"
			class="root-split"
		>
			<template #start>
				<PrivateViewNav>
					<template #navigation><slot name="navigation" /></template>
				</PrivateViewNav>
			</template>

			<template #divider>
				<PrivateViewResizeHandle />
			</template>

			<template #end>
				<PrivateViewMain v-bind="$props">
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

:deep(:is(.sp-start, .sp-end)) {
	overflow-y: auto;
}
</style>
