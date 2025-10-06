<script setup lang="ts">
import { SplitPanel } from '@directus/vue-split-panel';
import { useNavBarStore } from '../stores/nav-bar';
import PrivateViewMain from './private-view-main.vue';
import PrivateViewNav from './private-view-nav.vue';
import ModuleBar from '../../components/module-bar.vue';

const navBarStore = useNavBarStore();
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

			<template #end>
				<PrivateViewMain />
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
</style>
