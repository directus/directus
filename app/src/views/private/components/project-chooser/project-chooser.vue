<template>
	<div class="project-chooser">
		<latency-indicator />
		<span class="name">{{ name }}</span>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import LatencyIndicator from '../latency-indicator';
import { useSettingsStore } from '@/stores/';

export default defineComponent({
	components: { LatencyIndicator },
	setup() {
		const settingsStore = useSettingsStore();
		const name = computed(() => settingsStore.state.settings?.project_name);

		return { name };
	},
});
</script>

<style lang="scss" scoped>
.project-chooser {
	position: relative;
	display: flex;
	align-items: center;
	width: 100%;
	height: 64px;
	padding: 0 20px;
	color: var(--foreground-normal);
	text-align: left;
	background-color: var(--background-normal-alt);

	.latency-indicator {
		margin-right: 12px;
	}

	.name {
		flex-grow: 1;
	}
}
</style>
