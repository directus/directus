<script setup lang="ts">
import { cssVar } from '@directus/utils/browser';
import ApexCharts from 'apexcharts';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import MetadataItem from '../../../components/metadata-item.vue';

const props = defineProps<{
	downloads: {
		count: number;
		date: string;
	}[];
}>();

const chartEl = ref<HTMLElement>();
const chart = ref<ApexCharts>();

const initChart = () => {
	chart.value = new ApexCharts(chartEl.value, {
		colors: [cssVar('--theme--foreground-subdued')],
		chart: {
			type: 'area',
			animation: {
				enabled: false,
			},
			height: '95%',
			width: '100%',
			dropShadow: {
				enabled: false,
			},
			toolbar: {
				show: false,
			},
			selection: {
				enabled: false,
			},
			zoom: {
				enabled: false,
			},
			sparkline: {
				enabled: true,
			},
		},
		series: [
			{
				name: 'downloads',
				data: props.downloads.map(({ count }) => count),
			},
		],
		stroke: {
			curve: 'smooth',
			width: 2,
			lineCap: 'round',
		},
		tooltip: {
			enabled: false,
		},
		dataLabels: {
			enabled: false,
		},
	});

	chart.value.render();
};

watch(
	() => props.downloads,
	() => {
		chart.value?.destroy();
		initChart();
	},
);

onMounted(() => {
	initChart();
});

onUnmounted(() => {
	chart.value?.destroy();
});
</script>

<template>
	<div class="chart">
		<div ref="chartEl" />
	</div>
</template>

<style scoped>
.chart {
	height: var(--theme--form--field--input--height);
	border: var(--theme--border-width) solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
}
</style>
