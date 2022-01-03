<template>
	<div class="project-info">
		<latency-indicator />
		<div class="name-container">
			<span class="name">{{ name }}</span>
			<span class="descriptor">{{ descriptor }}</span>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import LatencyIndicator from '../latency-indicator';
import { useServerStore } from '@/stores/';

export default defineComponent({
	components: { LatencyIndicator },
	setup() {
		const serverStore = useServerStore();

		const name = computed(() => serverStore.info?.project?.project_name);
		const descriptor = computed(() => serverStore.info?.project?.project_descriptor);

		return { name, descriptor };
	},
});
</script>

<style lang="scss" scoped>
.project-info {
	position: relative;
	display: flex;
	align-items: center;
	width: 100%;
	height: 60px;
	padding: 0 20px;
	color: var(--foreground-normal-alt);
	text-align: left;
	background-color: var(--background-normal-alt);

	.name-container {
		flex-grow: 1;
		margin-left: 12px;
		line-height: 1.3;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.name {
		margin-right: 8px;
	}

	.descriptor {
		display: block;
		color: var(--foreground-subdued);
	}
}
</style>
