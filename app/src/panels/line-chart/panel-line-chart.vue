<template>
	<div class="line-chart">
		<div ref="chartEl" />
	</div>
</template>

<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { PanelFunction } from '@/types/panels';
import type { Filter } from '@directus/types';
import { abbreviateNumber } from '@directus/utils';
import { cssVar } from '@directus/utils/browser';
import ApexCharts from 'apexcharts';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		showHeader?: boolean;
		height: number;
		collection: string;
		data?: Record<string, any>[];
		group?: string;
		xAxis?: string;
		function: PanelFunction;
		yAxis: string;
		color?: string;
		filter: Filter;
		decimals?: number;
		showAxisLabels?: string;
		showLegend?: boolean;
		showMarker?: boolean;
		curveType?: string;
	}>(),
	{
		showHeader: false,
		data: () => [],
		showAxisLabels: 'both',
		showLegend: false,
		showMarker: true,
		curveType: 'smooth',
		decimals: 2,
		color: 'var(--primary)',
	}
);

const { t, n } = useI18n();

const fieldsStore = useFieldsStore();

const chartEl = ref();
const chart = ref<ApexCharts>();

onMounted(setUpChart);

onUnmounted(() => {
	chart.value?.destroy();
});

watch(
	[
		() => props.showHeader,
		() => props.data,
		() => props.showAxisLabels,
		() => props.showLegend,
		() => props.showMarker,
		() => props.curveType,
	],
	() => {
		chart.value?.destroy();
		setUpChart();
	},
	{ deep: true }
);

function setUpChart() {
	if (props.group && !props.xAxis) return;

	const series = props.group
		? {
				name: props.function,
				data: props.data.map((d) => {
					const yAxis = d[props.function]?.[props.xAxis!];
					if (isNaN(Number(yAxis))) return yAxis;
					return props.decimals ? n(Number(Number(yAxis).toFixed(props.decimals))) : n(Number(yAxis));
				}),
		  }
		: {
				name: props.yAxis,
				data: props.data.map((d) => {
					const yAxis = d[props.yAxis];
					return props.decimals ? Number(Number(yAxis).toFixed(props.decimals)) : yAxis;
				}),
		  };

	const categories = props.group
		? props.data.map((d) => d['group'][props.group!])
		: props.data.map((d) => d[props.xAxis!]);

	const colors =
		props.color && props.color.startsWith('var(--')
			? cssVar(props.color.substring(4, props.color.length - 1))
			: props.color ?? 'var(--primary)';

	chart.value = new ApexCharts(chartEl.value, {
		colors: [colors],
		chart: {
			animation: {
				enabled: false,
			},
			height: '100%',
			type: 'line',
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
			fontFamily: 'var(--family-sans-serif)',
			foreColor: 'var(--foreground-subdued)',
		},
		series: [series],
		stroke: {
			curve: props.curveType,
			width: 2,
			lineCap: 'round',
		},
		tooltip: {
			theme: 'light',
			marker: {
				show: props.showMarker,
			},
			x: {
				formatter: (index: number) => {
					if (!index) return;
					return `${categories[index - 1]}:`;
				},
			},
			y: {
				title: {
					formatter: (columnName: string | number) => {
						if (!columnName) return;

						const field = fieldsStore.getField(props.collection, String(columnName));
						if (field) return field.name;

						if (isNaN(Number(columnName))) return `${t(columnName)}:`;
						return `${n(Number(columnName))}:`;
					},
				},
				formatter(value: number) {
					if (!value) return;

					return n(value);
				},
			},
		},
		dataLabels: {
			enabled: false,
		},

		grid: {
			borderColor: 'var(--border-subdued)',
			padding: {
				top: props.showHeader ? -20 : -2,
				bottom: 5,
				left: 20,
				right: 20,
			},
		},
		markers: {
			size: 1,
			colors: colors,
			strokeColors: colors,
		},
		xaxis: {
			categories,
			type: 'category',
			toolbar: false,
			tooltip: {
				enabled: false,
			},
			axisTicks: {
				show: false,
			},
			axisBorder: {
				show: false,
			},
			labels: {
				show: ['both', 'xAxis'].includes(props.showAxisLabels),
				offsetY: -4,
				style: {
					fontFamily: 'var(--family-sans-serif)',
					foreColor: 'var(--foreground-subdued)',
					fontWeight: 600,
					fontSize: '10px',
				},
			},
			crosshairs: {
				stroke: {
					color: 'var(--border-normal)',
				},
			},
		},
		yaxis: {
			show: ['both', 'yAxis'].includes(props.showAxisLabels),
			forceNiceScale: true,
			tickAmount: props.height - 4,
			axisBorder: {
				show: false,
			},
			axisTicks: {
				show: false,
			},

			labels: {
				show: ['both', 'yAxis'].includes(props.showAxisLabels),
				formatter: (value: number) => {
					return value > 10000
						? abbreviateNumber(value, 1)
						: n(value, 'decimal', {
								minimumFractionDigits: 0,
								maximumFractionDigits: props.decimals,
						  } as any);
				},
				style: {
					fontFamily: 'var(--family-sans-serif)',
					foreColor: 'var(--foreground-subdued)',
					fontWeight: 600,
					fontSize: '10px',
				},
			},
		},
		legend: {
			show: props.showLegend,
			position: 'bottom',
			offsetY: -4,
			markers: {
				width: 8,
				height: 8,
			},
			fontFamily: 'var(--family-sans-serif)',
			foreColor: 'var(--foreground-normal)',
			fontWeight: 600,
			fontSize: '10px',
		},
	});

	chart.value.render();
}
</script>

<style scoped>
.line-chart {
	padding: 0px;
	height: 100%;
	width: 100%;
}
</style>

<style>
.apexcharts-tooltip.apexcharts-theme-light {
	border-color: var(--border-normal) !important;
}

.apexcharts-tooltip.apexcharts-theme-light .apexcharts-tooltip-title {
	border-color: var(--border-normal) !important;
	margin-bottom: 0;
	padding: 0 4px;
	font-weight: 600 !important;
	font-size: 10px !important;
	background-color: var(--background-subdued) !important;
}

.apexcharts-tooltip-y-group {
	padding: 0 0 0 0px;
	font-weight: 600 !important;
	font-size: 10px !important;
}

.apexcharts-tooltip-series-group {
	background-color: var(--background-normal-alt) !important;
	padding: 0;
}

.apexcharts-tooltip-series-group.apexcharts-active,
.apexcharts-tooltip-series-group:last-child {
	padding: 0 4px !important;
	padding-bottom: 0px !important;
}

.apexcharts-tooltip-text {
	line-height: 0.5 !important;
	color: var(--foreground-normal);
}

.apexcharts-tooltip-marker {
	height: 8px !important;
	width: 8px !important;
	padding: 4px !important;
}

.apexcharts-yaxistooltip {
	padding: 0 !important;
}
</style>
