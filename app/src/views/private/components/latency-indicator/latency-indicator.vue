<template>
	<div class="latency-indicator">
		<v-progress-circular indeterminate v-if="!lastLatency" />
		<v-icon v-else :name="icon" />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { useLatencyStore } from '@/stores';
import { sortBy } from 'lodash';

export default defineComponent({
	setup() {
		const latencyStore = useLatencyStore();

		const lastLatency = computed(() => {
			const sorted = sortBy(latencyStore.state.latency, ['timestamp']);
			return sorted[sorted.length - 1];
		});

		const icon = computed<string>(() => {
			const { latency } = lastLatency.value;
			if (latency <= 750) return 'signal_wifi_4_bar';
			else if (latency > 750 && latency <= 1250) return 'signal_wifi_3_bar';
			else if (latency > 1250 && latency <= 2000) return 'signal_wifi_2_bar';
			return 'signal_wifi_1_bar';
		});

		return { icon, lastLatency };
	},
});
</script>

<style lang="scss" scoped>
.v-progress-circular {
	--v-progress-circular-size: 23px;
}
</style>
