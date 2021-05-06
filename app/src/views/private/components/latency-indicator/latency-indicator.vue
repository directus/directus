<template>
	<div class="latency-indicator" v-tooltip.bottom.end="latencyTooltip">
		<v-progress-circular indeterminate v-if="!lastLatency" />
		<v-icon v-else :name="icon" />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { useLatencyStore } from '@/stores';
import { sortBy } from 'lodash';
import { i18n } from '@/lang';
import ms from 'ms';

export default defineComponent({
	setup() {
		const latencyStore = useLatencyStore();

		const lastLatency = computed(() => {
			const sorted = sortBy(latencyStore.state.latency, ['timestamp']);
			return sorted[sorted.length - 1];
		});

		const avgLatency = computed(() => {
			if (!latencyStore.state.latency || latencyStore.state.latency.length === 0) return 0;
			const sorted = sortBy(latencyStore.state.latency, ['timestamp']);
			const lastFive = sorted.slice(Math.max(sorted.length - 5, 0));
			let total = 0;

			for (const { latency } of lastFive) {
				total += latency;
			}

			return Math.round(total / lastFive.length);
		});

		const connectionStrength = computed(() => {
			if (avgLatency.value <= 250) return 4;
			else if (avgLatency.value > 250 && avgLatency.value <= 500) return 3;
			else if (avgLatency.value > 500 && avgLatency.value <= 750) return 2;
			return 1;
		});

		const latencyTooltip = computed(() => {
			switch (connectionStrength.value) {
				case 4:
					return `${i18n.t('connection_excellent')}\n(${ms(avgLatency.value)} ${i18n.t('latency')})`;
				case 3:
					return `${i18n.t('connection_good')}\n(${ms(avgLatency.value)} ${i18n.t('latency')})`;
				case 2:
					return `${i18n.t('connection_fair')}\n(${ms(avgLatency.value)} ${i18n.t('latency')})`;
				case 1:
					return `${i18n.t('connection_poor')}\n(${ms(avgLatency.value)} ${i18n.t('latency')})`;
				default:
					return null;
			}
		});

		const icon = computed(() => {
			switch (connectionStrength.value) {
				case 4:
					return 'signal_wifi_4_bar';
				case 3:
					return 'signal_wifi_3_bar';
				case 2:
					return 'signal_wifi_2_bar';
				case 1:
					return 'signal_wifi_1_bar';
				default:
					return null;
			}
		});

		return { icon, lastLatency, latencyTooltip };
	},
});
</script>

<style lang="scss" scoped>
.v-progress-circular {
	--v-progress-circular-size: 23px;
}
</style>
