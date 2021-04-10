<template>
	<div class="project-info">
		<latency-indicator />
		<span class="name">{{ name }}</span>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import LatencyIndicator from '../latency-indicator';
import { useServerStore, useLatencyStore } from '@/stores/';
import { sortBy } from 'lodash';

export default defineComponent({
	components: { LatencyIndicator },
	setup() {
		const latencyStore = useLatencyStore();
		const serverStore = useServerStore();

		const name = computed(() => serverStore.state.info?.project?.project_name);

		return { name };
	},
});
</script>

<style lang="scss" scoped>
.project-info {
	position: relative;
	display: flex;
	align-items: center;
	width: 100%;
	height: 64px;
	padding: 0 20px;
	color: var(--foreground-normal-alt);
	text-align: left;
	background-color: var(--background-normal-alt);

	.name {
		flex-grow: 1;
		margin-left: 12px;
	}
}
</style>
