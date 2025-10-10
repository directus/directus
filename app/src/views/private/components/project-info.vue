<script setup lang="ts">
import { computed } from 'vue';
import LatencyIndicator from './latency-indicator.vue';
import { useServerStore } from '@/stores/server';

const serverStore = useServerStore();

const name = computed(() => serverStore.info?.project?.project_name);
const descriptor = computed(() => serverStore.info?.project?.project_descriptor);
</script>

<template>
	<div class="project-info">
		<v-text-overflow class="name" :text="name" placement="bottom" />
		<v-text-overflow v-if="descriptor" class="descriptor" :text="descriptor" placement="bottom" />
	</div>
</template>

<style lang="scss" scoped>
.project-info {
	flex-grow: 1;
	inline-size: 100px;
	line-height: 1.3;

	.name {
		font-family: var(--theme--navigation--project--font-family);
	}

	.descriptor {
		color: var(--theme--foreground-subdued);
	}
}
</style>
