<template>
	<div class="project-info">
		<latency-indicator />
		<div class="name-container">
			<v-text-overflow placement="right" class="name" :text="name" />
			<v-text-overflow v-if="descriptor" placement="right" class="descriptor" :text="descriptor" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import LatencyIndicator from './latency-indicator.vue';
import { useServerStore } from '@/stores/server';

const serverStore = useServerStore();

const name = computed(() => serverStore.info?.project?.project_name);
const descriptor = computed(() => serverStore.info?.project?.project_descriptor);
</script>

<style lang="scss" scoped>
.project-info {
	position: relative;
	display: flex;
	align-items: center;
	width: 100%;
	height: 60px;
	padding-left: 20px;
	color: var(--foreground-normal-alt);
	text-align: left;
	background-color: var(--background-normal-alt);

	.name-container {
		flex-grow: 1;
		width: 100px;
		margin-left: 12px;
		line-height: 1.3;
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
