<script setup lang="ts">
import { cssVar } from '@directus/utils/browser';
import { useMediaQuery } from '@vueuse/core';
import ApexCharts from 'apexcharts';
import { onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
	downloads: {
		count: number;
		date: string;
	}[];
}>();

const browserAppearance = useMediaQuery('(prefers-color-scheme: dark)');

const chartContainerEl = ref<HTMLElement>();
const chartEl = ref<HTMLElement>();
const chart = ref<ApexCharts>();

const initChart = () => {
	chart.value = new ApexCharts(chartEl.value, {
		colors: [cssVar('--theme--primary')],
		chart: {
			type: 'area',
			animations: {
				enabled: false,
			},
			height: '100%',
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
		fill: {
			type: 'fill',
			colors: [cssVar('--theme--primary-background')],
		},
		series: [
			{
				name: 'downloads',
				data: props.downloads.map(({ count }) => count),
			},
		],
		stroke: {
			curve: 'monotoneCubic',
			width: 1,
			lineCap: 'butt',
		},
		tooltip: {
			enabled: false,
		},
		dataLabels: {
			enabled: false,
		},
		grid: {
			padding: {
				top: 10,
				bottom: 4,
				left: 0,
				right: 0,
			},
		},
	});

	chart.value.render();
};

watch([() => props.downloads, browserAppearance], () => {
	chart.value?.destroy();
	initChart();
});

onMounted(() => {
	initChart();
});

onUnmounted(() => {
	chart.value?.destroy();
});
</script>

<template>
	<div ref="chartContainerEl" class="chart-container">
		<div ref="chartEl" class="chart" />
	</div>
</template>

<style scoped>
.chart-container {
	block-size: 48px;
	border-radius: var(--theme--border-radius);
	display: flex;
	overflow: hidden;
	position: relative;

	&::after {
		content: '';
		position: absolute;
		inset-block-end: 0;
		inset-inline-start: 0;
		inline-size: 100%;
		background-color: var(--theme--primary-background);
		block-size: 4px;
		z-index: -1;
	}
}

.chart {
	inline-size: 100%;
}
</style>
