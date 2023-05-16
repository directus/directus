<template>
	<div v-tooltip.bottom.end="latencyTooltip" class="latency-indicator">
		<v-progress-circular v-if="!lastLatency" indeterminate />
		<v-icon v-else :name="icon" />
	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { useLatencyStore } from '@/stores/latency';
import { sortBy } from 'lodash';
import prettyMS from 'pretty-ms';

const { t } = useI18n();

const latencyStore = useLatencyStore();

const lastLatency = computed(() => {
	const sorted = sortBy(latencyStore.latency, ['timestamp']);
	return sorted[sorted.length - 1];
});

const avgLatency = computed(() => {
	if (!latencyStore.latency || latencyStore.latency.length === 0) return 0;
	const sorted = sortBy(latencyStore.latency, ['timestamp']);
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
			return `${t('connection_excellent')}\n(${prettyMS(avgLatency.value)} ${t('latency')})`;
		case 3:
			return `${t('connection_good')}\n(${prettyMS(avgLatency.value)} ${t('latency')})`;
		case 2:
			return `${t('connection_fair')}\n(${prettyMS(avgLatency.value)} ${t('latency')})`;
		case 1:
			return `${t('connection_poor')}\n(${prettyMS(avgLatency.value)} ${t('latency')})`;
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
</script>

<style lang="scss" scoped>
.v-progress-circular {
	--v-progress-circular-size: 23px;
}
</style>
